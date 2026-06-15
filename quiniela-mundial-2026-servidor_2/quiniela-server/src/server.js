import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, save, initDB, flush, addTx } from './db.js';
import { buildOdds, resultFor } from './odds.js';
import { matchStatus, settleBets } from './engine.js';
import { playerMatchPoints, validateLineup, newLineup, FORMATIONS, FAN_BUDGET, MAX_PER_TEAM } from './fantasy.js';
import { tgNotify, tgConfigured } from './telegram.js';
import { providerConfigured, providerName } from './provider.js';
import { startJobs } from './jobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const START_BALANCE = 100;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || '051909';

const app = express();
app.use(express.json({limit:'1mb'}));
app.use(express.static(path.join(__dirname,'..','public')));

const GROUPS={ cruz_roja:'Cruz Roja', hookeros:'Hookeros' };
const GROUP_PASS={ cruz_roja: process.env.GROUP_PASS_CRUZ_ROJA || '189', hookeros: process.env.GROUP_PASS_HOOKEROS || '123' };

/* ---------- AUTH ---------- */
function sess(t){ let s=db().sessions[t]; if(typeof s==='string') s={name:s,admin:false}; return s; }
function tokenFor(name){ const t=crypto.randomUUID(); db().sessions[t]={name,admin:false}; save(); return t; }
function auth(req,res,next){
  const h=req.headers.authorization||'';
  const t=h.startsWith('Bearer ')?h.slice(7):'';
  const s=sess(t);
  if(!s || !db().users[s.name]) return res.status(401).json({error:'Sesión no válida'});
  req.user=s.name; req.token=t; req.admin=!!s.admin; next();
}
function adminOnly(req,res,next){ if(!req.admin) return res.status(403).json({error:'Necesitas entrar como administrador'}); next(); }

app.post('/api/register', async (req,res)=>{
  const name=String(req.body.name||'').trim().toLowerCase();
  const pass=String(req.body.pass||'');
  if(!name||!pass) return res.status(400).json({error:'Faltan datos'});
  if(name.length>16) return res.status(400).json({error:'Nombre demasiado largo (máx 16)'});
  const state=db();
  const ex=state.users[name];
  if(ex && ex.passHash) return res.status(409).json({error:'Ese nombre ya existe'});
  if(ex && !ex.passHash){ ex.passHash=bcrypt.hashSync(pass,10); }
  else state.users[name]={ passHash:bcrypt.hashSync(pass,10), balance:START_BALANCE, group:null, joined:Date.now() };
  save(true);
  res.json({ token:tokenFor(name), name, group:state.users[name].group||null });
});

app.post('/api/login',(req,res)=>{
  const name=String(req.body.name||'').trim().toLowerCase();
  const pass=String(req.body.pass||'');
  const u=db().users[name];
  if(!u || !u.passHash) return res.status(404).json({error:'No existe ese jugador'});
  if(!bcrypt.compareSync(pass,u.passHash)) return res.status(401).json({error:'Contraseña incorrecta'});
  res.json({ token:tokenFor(name), name, group:u.group||null });
});

// Elegir grupo (Cruz Roja / Hookeros) tras registrarse
app.post('/api/group', auth, (req,res)=>{
  const g=String(req.body.group||'');
  if(!GROUPS[g]) return res.status(400).json({error:'Grupo no válido'});
  const u=db().users[req.user];
  if(u.group && !req.admin) return res.status(400).json({error:'Ya tienes grupo asignado'});
  if(!req.admin && String(req.body.pass||'')!==GROUP_PASS[g]) return res.status(401).json({error:'Contraseña del grupo incorrecta'});
  u.group=g; save(true);
  tgNotify(`🎉 <b>${req.user}</b> se ha unido a <b>${GROUPS[g]}</b> en La Quiniela (saldo ${u.balance.toFixed(2)} €)`);
  res.json({ ok:true, group:g });
});

// Desbloquear / bloquear el modo administrador (contraseña 051909) dentro de la app
app.post('/api/admin/unlock', auth, (req,res)=>{
  if(String(req.body.pass||'')!==ADMIN_PASS) return res.status(401).json({error:'Contraseña incorrecta'});
  db().sessions[req.token]={name:req.user,admin:true}; save(true);
  res.json({ ok:true });
});
app.post('/api/admin/lock', auth, (req,res)=>{ db().sessions[req.token]={name:req.user,admin:false}; save(true); res.json({ok:true}); });

/* ---------- FANTASY HELPERS ---------- */
const dateId = iso => iso.slice(0,10);
const matchesOnDate = did => db().matches.filter(m=>dateId(m.kickoff)===did);
function eligibleIds(did){ const teams=new Set(); matchesOnDate(did).forEach(m=>{teams.add(m.home);teams.add(m.away);}); const ids={}; db().players.forEach(p=>{ if(teams.has(p.team)) ids[p.id]=p; }); return ids; }
function fantasyStatus(did){
  const ms=matchesOnDate(did); if(!ms.length) return 'none';
  const firstKO=Math.min(...ms.map(m=>new Date(m.kickoff).getTime()));
  const now=Date.now(), open2=firstKO-48*3600*1000, allFin=ms.every(m=>m.finished);
  if(db().meta.demoOpen) return now<firstKO?'open':(allFin?'finished':'live');
  if(now<open2) return 'upcoming';
  if(now<firstKO) return 'open';
  if(!allFin) return 'live';
  return 'finished';
}
function lineupPoints(lineup){
  const pbi=Object.fromEntries(db().players.map(p=>[p.id,p]));
  let total=0, allScored=true;
  for(const s of lineup.slots){
    if(!s.id) continue;
    const p=pbi[s.id]; if(!p) continue;
    const m=matchesOnDate(lineup.dateKey).find(mm=>mm.home===p.team||mm.away===p.team);
    const pts=playerMatchPoints(p,m);
    if(pts==null){ allScored=false; } else { total+=pts*(s.id===lineup.captainId?2:1); }
  }
  return {total, allScored};
}

/* ---------- STATE ---------- */
app.get('/api/state', auth, (req,res)=>{
  const state=db(); const meName=req.user; const meUser=state.users[meName]; const myGroup=meUser.group||null;
  const inMyGroup=name=> myGroup && state.users[name] && state.users[name].group===myGroup;
  const ranking=Object.entries(state.users).filter(([n,u])=>u.group===myGroup && myGroup).map(([name,u])=>({name,balance:u.balance})).sort((a,b)=>b.balance-a.balance);
  const matches=state.matches.map(m=>({id:m.id,home:m.home,away:m.away,kickoff:m.kickoff,group:m.group,venue:m.venue,finished:m.finished,result:m.result,odds:m.odds,status:matchStatus(m)}))
    .sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff));
  const myBets=state.bets.filter(b=>b.user===meName).sort((a,b)=>b.placedAt-a.placedAt)
    .map(b=>({...b, legStates:b.selections.map(s=>{const m=state.matches.find(x=>x.id===s.mid);if(!m||!m.finished)return 'pending';const r=resultFor(m.result,s.market);if(r==null)return (m.result&&m.result.statsFinal)?'void':'pending';return r===s.sel?'won':'lost';})}));
  const dids=[...new Set(state.matches.map(m=>dateId(m.kickoff)))].sort();
  const fantasyDays=dids.map(did=>({dateKey:did, status:fantasyStatus(did),
    matches:matchesOnDate(did).map(m=>({home:m.home,away:m.away,kickoff:m.kickoff,finished:m.finished})),
    mine: (state.fantasy[meName]&&state.fantasy[meName][did])? {...state.fantasy[meName][did], points:lineupPoints(state.fantasy[meName][did])} : null }));
  const fanTotals={}; Object.keys(state.users).forEach(u=>{ if(state.users[u].group===myGroup && myGroup) fanTotals[u]=0; });
  for(const u in state.fantasy){ if(!inMyGroup(u)) continue; for(const did in state.fantasy[u]) fanTotals[u]=(fanTotals[u]||0)+lineupPoints(state.fantasy[u][did]).total; }
  const fanRanking=Object.entries(fanTotals).map(([name,points])=>({name,points})).sort((a,b)=>b.points-a.points);
  const ledger=state.tx.filter(t=>inMyGroup(t.user)).slice(0,300);
  const participants=Object.entries(state.users).map(([name,u])=>({name,balance:u.balance,group:u.group||null,groupName:GROUPS[u.group]||'—',claimed:!!u.passHash})).sort((a,b)=>(a.groupName>b.groupName?1:-1));
  res.json({
    me:{name:meName, balance:meUser.balance, group:myGroup, groupName:GROUPS[myGroup]||null, admin:req.admin},
    groups:GROUPS, ranking, matches, myBets, ledger, participants,
    players: state.players.map(p=>({id:p.id,name:p.name,team:p.team,pos:p.pos,price:p.price,photo:p.photo})),
    fantasy:{ days:fantasyDays, ranking:fanRanking, budget:FAN_BUDGET, maxPerTeam:MAX_PER_TEAM, formations:FORMATIONS },
    meta:{ demoOpen:state.meta.demoOpen, provider:providerConfigured(), providerName:providerName(), telegram:tgConfigured(), startBalance:START_BALANCE }
  });
});

/* ---------- BETS ---------- */
app.post('/api/bets', auth, (req,res)=>{
  const state=db(); const u=state.users[req.user];
  const stake=Number(req.body.stake); const sels=req.body.selections||[];
  if(!Array.isArray(sels)||!sels.length) return res.status(400).json({error:'Sin selecciones'});
  if(!(stake>=1)) return res.status(400).json({error:'Importe mínimo 1€'});
  if(u.balance<stake) return res.status(400).json({error:'Saldo insuficiente'});
  // valida y construye
  const seen=new Set(); const selections=[]; let totalOdd=1;
  for(const s of sels){
    const m=state.matches.find(x=>x.id===s.mid);
    if(!m) return res.status(400).json({error:'Partido inexistente'});
    if(matchStatus(m)!=='open') return res.status(400).json({error:`"${m.home} – ${m.away}" no admite apuestas`});
    const odd=m.odds[s.market] && m.odds[s.market][s.sel];
    if(!odd) return res.status(400).json({error:'Mercado/selección no válido'});
    const key=s.mid+'|'+s.market;
    if(seen.has(key)) return res.status(400).json({error:'Dos selecciones del mismo mercado'});
    seen.add(key);
    const selLabel = s.market==='winner' ? (s.sel==='1'?m.home:s.sel==='2'?m.away:'Empate') : s.sel;
    selections.push({mid:m.id, match:`${m.home} – ${m.away}`, market:s.market, sel:s.sel, selLabel, odd});
    totalOdd*=odd;
  }
  totalOdd=+totalOdd.toFixed(2);
  u.balance=+((u.balance-stake).toFixed(2));
  const bet={id:'b'+Date.now()+crypto.randomBytes(2).toString('hex'), user:req.user,
    type:selections.length>1?'combinada':'simple', selections, totalOdd, stake, status:'pending', placedAt:Date.now()};
  state.bets.push(bet); save(true);
  res.json({balance:u.balance, bet});
});

/* ---------- ROULETTE ---------- */
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const colorOf=n=>n===0?'g':REDS.has(n)?'r':'b';
function rlMatch(bet,n){if(typeof bet==='number')return bet===n;switch(bet){case'red':return colorOf(n)==='r';case'black':return colorOf(n)==='b';case'even':return n!==0&&n%2===0;case'odd':return n%2===1;case'low':return n>=1&&n<=18;case'high':return n>=19&&n<=36;case'd1':return n>=1&&n<=12;case'd2':return n>=13&&n<=24;case'd3':return n>=25&&n<=36;}return false;}
const rlPay=bet=>typeof bet==='number'?35:({red:1,black:1,even:1,odd:1,low:1,high:1,d1:2,d2:2,d3:2}[bet]||0);
app.post('/api/casino/roulette', auth, (req,res)=>{
  const state=db(); const u=state.users[req.user];
  const bets=(req.body.bets||[]).map(b=>({type:b.type, amount:Number(b.amount)})).filter(b=>b.amount>0);
  if(!bets.length) return res.status(400).json({error:'Sin apuestas'});
  const total=bets.reduce((a,b)=>a+b.amount,0);
  if(u.balance<total) return res.status(400).json({error:'Saldo insuficiente'});
  const result=WHEEL[crypto.randomInt(WHEEL.length)];
  let winnings=0;
  for(const b of bets){ if(rlMatch(b.type,result)) winnings+=b.amount+b.amount*rlPay(b.type); }
  const net=+(winnings-total).toFixed(2);
  u.balance=+((u.balance-total+winnings).toFixed(2));
  addTx(req.user, net, 'roulette', net>=0?'Ruleta · ganada':'Ruleta · perdida', `Salió ${result} (${colorOf(result)==='r'?'rojo':colorOf(result)==='b'?'negro':'verde'}) · apostado ${total.toFixed(2)}€`);
  save(true);
  res.json({result, color:colorOf(result), winnings:+winnings.toFixed(2), net, balance:u.balance});
});

/* ---------- BLACKJACK (servidor) ---------- */
const bjGames=new Map(); // gameId -> {user,shoe,player,dealer,bet,phase}
function freshShoe(){const suits=['♠','♥','♦','♣'],ranks=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];const d=[];for(const s of suits)for(const r of ranks)d.push({r,s,red:(s==='♥'||s==='♦')});for(let i=d.length-1;i>0;i--){const j=crypto.randomInt(i+1);[d[i],d[j]]=[d[j],d[i]];}return d;}
function handValue(cs){let v=0,a=0;for(const c of cs){if(c.r==='A'){v+=11;a++;}else if(['K','Q','J','10'].includes(c.r))v+=10;else v+=+c.r;}while(v>21&&a){v-=10;a--;}return v;}
const pubGame=(g,hideDealer)=>({gameId:g.id, bet:g.bet, phase:g.phase, player:g.player, dealer:hideDealer?[g.dealer[0],{hidden:true}]:g.dealer, playerValue:handValue(g.player), dealerValue:hideDealer?null:handValue(g.dealer), msg:g.msg||'', outcome:g.outcome||null});
function endHand(g,u){ if(g.txDone||g.phase!=='done') return; g.txDone=true; const net=+(u.balance-g.balBefore).toFixed(2); const c=g.outcome==='win'?'Blackjack · ganada':g.outcome==='push'?'Blackjack · empate':'Blackjack · perdida'; addTx(g.user, net, 'blackjack', c, `Tú ${handValue(g.player)} · Crupier ${handValue(g.dealer)} · apuesta ${g.origBet.toFixed(2)}€`); }
app.post('/api/casino/bj/deal', auth, (req,res)=>{
  const state=db(); const u=state.users[req.user]; const bet=Number(req.body.bet);
  if(!(bet>=1)) return res.status(400).json({error:'Apuesta mínima 1€'});
  if(u.balance<bet) return res.status(400).json({error:'Saldo insuficiente'});
  const balBefore=u.balance;
  u.balance=+((u.balance-bet).toFixed(2));
  const shoe=freshShoe();
  const g={id:crypto.randomUUID(), user:req.user, shoe, bet, origBet:bet, balBefore, player:[shoe.pop(),shoe.pop()], dealer:[shoe.pop(),shoe.pop()], phase:'player', canDouble:true};
  const pv=handValue(g.player), dv=handValue(g.dealer);
  if(pv===21||dv===21){ g.phase='done'; if(pv===21&&dv===21){g.msg='Empate — blackjack doble';g.outcome='push';u.balance=+((u.balance+bet).toFixed(2));}else if(pv===21){g.msg='¡BLACKJACK! 3:2';g.outcome='win';u.balance=+((u.balance+bet+bet*1.5).toFixed(2));}else{g.msg='El crupier tiene blackjack';g.outcome='lose';} endHand(g,u); }
  bjGames.set(g.id,g); save(true);
  res.json({...pubGame(g, g.phase==='player'), balance:u.balance});
});
function bjResolve(g,u){ g.phase='done'; while(handValue(g.dealer)<17) g.dealer.push(g.shoe.pop()); const pv=handValue(g.player),dv=handValue(g.dealer); if(dv>21||pv>dv){g.msg='¡Ganas! 🎉';g.outcome='win';u.balance=+((u.balance+g.bet*2).toFixed(2));}else if(pv===dv){g.msg='Empate';g.outcome='push';u.balance=+((u.balance+g.bet).toFixed(2));}else{g.msg='Gana el crupier';g.outcome='lose';} }
function getGame(req,res){ const g=bjGames.get(req.body.gameId); if(!g||g.user!==req.user){res.status(404).json({error:'Partida no encontrada'});return null;} return g; }
app.post('/api/casino/bj/hit', auth, (req,res)=>{ const g=getGame(req,res); if(!g)return; const u=db().users[req.user]; g.canDouble=false; g.player.push(g.shoe.pop()); if(handValue(g.player)>21){g.phase='done';g.msg='Te pasaste 💥';g.outcome='lose';endHand(g,u);} save(true); res.json({...pubGame(g,g.phase==='player'),balance:u.balance}); });
app.post('/api/casino/bj/stand', auth, (req,res)=>{ const g=getGame(req,res); if(!g)return; const u=db().users[req.user]; bjResolve(g,u); endHand(g,u); save(true); res.json({...pubGame(g,false),balance:u.balance}); });
app.post('/api/casino/bj/double', auth, (req,res)=>{ const g=getGame(req,res); if(!g)return; const u=db().users[req.user]; if(u.balance<g.bet) return res.status(400).json({error:'Sin saldo para doblar'}); u.balance=+((u.balance-g.bet).toFixed(2)); g.bet*=2; g.canDouble=false; g.player.push(g.shoe.pop()); if(handValue(g.player)>21){g.phase='done';g.msg='Te pasaste 💥';g.outcome='lose';endHand(g,u);save(true);return res.json({...pubGame(g,false),balance:u.balance});} bjResolve(g,u); endHand(g,u); save(true); res.json({...pubGame(g,false),balance:u.balance}); });

/* ---------- FANTASY ---------- */
app.post('/api/fantasy', auth, (req,res)=>{
  const state=db(); const did=String(req.body.dateKey||''); const lineup=req.body.lineup;
  if(fantasyStatus(did)!=='open') return res.status(400).json({error:'Esa jornada no está abierta'});
  if(!lineup || lineup.dateKey!==did) return res.status(400).json({error:'Datos no válidos'});
  const pbi=Object.fromEntries(state.players.map(p=>[p.id,p]));
  const err=validateLineup(lineup, eligibleIds(did), pbi);
  if(err) return res.status(400).json({error:err});
  if(!state.fantasy[req.user]) state.fantasy[req.user]={};
  state.fantasy[req.user][did]={dateKey:did, formation:lineup.formation, captainId:lineup.captainId, slots:lineup.slots};
  save(true);
  res.json({ok:true});
});

/* ---------- ADMIN ---------- */
app.post('/api/admin/result', auth, adminOnly, (req,res)=>{
  const {mid,hg,ag,hcards,acards,corners,saves}=req.body;
  const m=db().matches.find(x=>x.id===mid); if(!m) return res.status(404).json({error:'Partido no encontrado'});
  const g=v=>{ if(v===''||v==null) return null; const n=Number(v); return (isNaN(n)||n<0)?null:Math.floor(n); };
  const HG=g(hg), AG=g(ag);
  if(HG==null||AG==null) return res.status(400).json({error:'Pon al menos los goles (local y visitante)'});
  m.finished=true;
  m.result={hg:HG, ag:AG, hcards:g(hcards), acards:g(acards), corners:g(corners), saves:g(saves), statsFinal:true};
  const n=settleBets(); save(true);
  res.json({ok:true, settled:n});
});
app.post('/api/admin/demo', auth, adminOnly, (req,res)=>{ db().meta.demoOpen=!!req.body.on; save(true); res.json({ok:true, demoOpen:db().meta.demoOpen}); });
app.post('/api/admin/price', auth, adminOnly, (req,res)=>{ const p=db().players.find(x=>x.id===req.body.playerId); if(!p) return res.status(404).json({error:'Jugador no encontrado'}); const pr=Number(req.body.price); if(!(pr>=1)) return res.status(400).json({error:'Precio no válido'}); p.price=pr; save(true); res.json({ok:true}); });

// Pre-registrar un participante (el admin crea la cuenta; contraseña por defecto = el nombre, se puede cambiar)
app.post('/api/admin/participant', auth, adminOnly, (req,res)=>{
  const name=String(req.body.name||'').trim().toLowerCase();
  if(!name) return res.status(400).json({error:'Falta el nombre'});
  if(name==='admin') return res.status(400).json({error:'Nombre reservado'});
  if(name.length>16) return res.status(400).json({error:'Nombre demasiado largo'});
  const state=db();
  if(state.users[name]) return res.status(409).json({error:'Ese participante ya existe'});
  const pass=String(req.body.pass||name);
  const bal=req.body.balance!=null?Number(req.body.balance):START_BALANCE;
  const group=GROUPS[req.body.group]?req.body.group:null;
  state.users[name]={ passHash:bcrypt.hashSync(pass,10), balance:+(isFinite(bal)?bal:START_BALANCE).toFixed(2), group, joined:Date.now() };
  save(true);
  res.json({ok:true, name, defaultPass:pass, group});
});

// Meter dinero / dar bono / ajustar (positivo o negativo). Queda en el Registro.
app.post('/api/admin/credit', auth, adminOnly, (req,res)=>{
  const name=String(req.body.user||'').trim().toLowerCase();
  const amount=Number(req.body.amount);
  const concept=String(req.body.concept||'Ajuste del administrador').slice(0,80);
  const u=db().users[name];
  if(!u) return res.status(404).json({error:'Participante no encontrado'});
  if(!isFinite(amount)||amount===0) return res.status(400).json({error:'Importe no válido'});
  u.balance=+((u.balance+amount).toFixed(2)); if(u.balance<0) u.balance=0;
  addTx(name, amount, amount>0?'bonus':'admin_adjust', concept, 'Por el administrador');
  save(true);
  if(amount>0) tgNotify(`💰 El admin dio <b>${amount.toFixed(2)} €</b> a <b>${name}</b> — ${concept}`);
  res.json({ok:true, balance:u.balance});
});

app.get('/api/health',(req,res)=>res.json({ok:true, provider:providerConfigured(), telegram:tgConfigured()}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));

const PORT=process.env.PORT||3000;
initDB().then(()=>{
  app.listen(PORT, ()=>{ console.log(`La Quiniela en http://localhost:${PORT}  (provider=${providerConfigured()}, telegram=${tgConfigured()})`); startJobs(); });
}).catch(e=>{ console.error('No se pudo iniciar la base de datos:', e.message); process.exit(1); });

for(const sig of ['SIGTERM','SIGINT']) process.on(sig, async ()=>{ await flush(); process.exit(0); });
