/* ===== La Quiniela — cliente conectado al servidor ===== */
const FLAG={'Brasil':'🇧🇷','Argentina':'🇦🇷','Francia':'🇫🇷','España':'🇪🇸','Alemania':'🇩🇪','Países Bajos':'🇳🇱','Uruguay':'🇺🇾','Suiza':'🇨🇭','Marruecos':'🇲🇦','Senegal':'🇸🇳','Japón':'🇯🇵','Estados Unidos':'🇺🇸','Australia':'🇦🇺','Egipto':'🇪🇬','Irán':'🇮🇷','Arabia Saudí':'🇸🇦','Catar':'🇶🇦','Escocia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿','Haití':'🇭🇹','Curazao':'🇨🇼','Cabo Verde':'🇨🇻','Argelia':'🇩🇿','Austria':'🇦🇹','Jordania':'🇯🇴','Nueva Zelanda':'🇳🇿','Sudáfrica':'🇿🇦','Corea del Sur':'🇰🇷','Noruega':'🇳🇴'};
const TEAM_COLOR={'Brasil':'#f7d046','Argentina':'#6cace4','Francia':'#1f3a93','España':'#c8102e','Alemania':'#222','Uruguay':'#5cb1e6','Suiza':'#d52b1e','Marruecos':'#0e6b3e','Senegal':'#1c8a4a','Estados Unidos':'#2a4b9b','Egipto':'#c8102e','Australia':'#0b8a3a','Irán':'#1c8a4a','Arabia Saudí':'#137a3b','Catar':'#7a1031','Escocia':'#0a2a66','Haití':'#1c3a8a','Curazao':'#1f3a93','Cabo Verde':'#1f3a93','Argelia':'#0e6b3e','Austria':'#c8102e','Jordania':'#7a1031','Nueva Zelanda':'#222','Sudáfrica':'#0b8a3a','Corea del Sur':'#1f3a93'};
const flag=t=>FLAG[t]||'⚽';
const MARKETS=[{key:'winner',label:'Ganador del partido',cols:3,special:true},{key:'btts',label:'Ambos equipos marcan',cols:2},{key:'goals',label:'Número total de goles',cols:4},{key:'margin',label:'Margen de victoria',cols:4},{key:'bothCards',label:'Ambos reciben tarjeta',cols:2},{key:'cards',label:'Total de tarjetas',cols:3},{key:'corners',label:'Total de córners',cols:3},{key:'saves',label:'Total de paradas (ambos porteros)',cols:3}];
const MK_LABEL=Object.fromEntries(MARKETS.map(m=>[m.key,m.label]));
const POS_LABEL={POR:'Portero',DEF:'Defensa',MED:'Medio',DEL:'Delantero'};

const $=s=>document.querySelector(s);
const money=n=>Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials=n=>{const w=n.trim().split(/\s+/);return((w[0]||'')[0]||'')+((w[w.length-1]||'')[0]||'');};
let toastT;function toast(msg,kind){const el=$('#toast');el.textContent=msg;el.className='toast show'+(kind?' '+kind:'');clearTimeout(toastT);toastT=setTimeout(()=>el.className='toast',3200);}

let TOKEN=localStorage.getItem('wc_token')||null;
let S=null;          // último estado del servidor
const UI={tab:'apuestas',authMode:'login',openMatch:null,slip:{picks:[],stake:10},casino:{game:null},
  rl:{stake:5,picks:[],spinning:false,history:[],angle:0},bj:null,fanDate:null,fan:null,expandedTx:{},showResults:false};

async function api(method,path,body){
  const r=await fetch(path,{method,headers:{'Content-Type':'application/json',...(TOKEN?{'Authorization':'Bearer '+TOKEN}:{})},body:body?JSON.stringify(body):undefined});
  let j={};try{j=await r.json();}catch(e){}
  if(!r.ok) throw new Error(j.error||('Error '+r.status));
  return j;
}
async function refresh(){ S=await api('GET','/api/state'); }

/* ===== AUTH ===== */
/* ===== AUTH (con animación de Mundial) ===== */
function injectFloaters(host){
  if(!host || host.querySelector('.floaters')) return;
  const f=document.createElement('div'); f.className='floaters';
  const icons=['⚽','🏆','🎉','🥅','🧤','✨','⚽','🏅'];
  for(let i=0;i<9;i++){const s=document.createElement('span');s.textContent=icons[i%icons.length];s.style.left=(5+Math.random()*90)+'%';s.style.animationDuration=(7+Math.random()*8)+'s';s.style.animationDelay=(-Math.random()*10)+'s';s.style.fontSize=(16+Math.random()*22)+'px';f.appendChild(s);}
  host.prepend(f);
}
function confettiBurst(){
  const c=document.createElement('div'); c.className='confetti';
  const cols=['#F3C969','#35D08A','#FF5C72','#6cace4','#fff'];
  for(let i=0;i<80;i++){const p=document.createElement('i');p.style.left=Math.random()*100+'%';p.style.background=cols[i%cols.length];p.style.animationDelay=(Math.random()*0.4)+'s';p.style.transform=`translateY(-10vh) rotate(${Math.random()*360}deg)`;c.appendChild(p);}
  document.body.appendChild(c); setTimeout(()=>c.remove(),2600);
}
function renderAuth(){
  injectFloaters(document.querySelector('.auth'));
  const login=UI.authMode==='login';
  const rs=$('#roleSwitch'); if(rs) rs.remove();
  const nameField=document.querySelectorAll('.auth-card .field')[0]; if(nameField) nameField.style.display='';
  $('#authTitle').textContent=login?'Entra a la liga':'Crea tu jugador';
  $('#authTitle').classList.add('shimmer');
  $('#authLead').textContent=login?'Apuestas del Mundial entre amigos. Sin dinero real, todo el orgullo del mundo.':'Empiezas con 100,00 € para apostar.';
  $('#authPass').placeholder='••••••';
  $('#authBtn').textContent=login?'Entrar':'Registrarme';
  $('#authSwitch').innerHTML=login?`¿Aún no juegas? <button id="toReg">Regístrate</button>`:`¿Ya tienes jugador? <button id="toLog">Inicia sesión</button>`;
  $('#authErr').textContent='';
  const sw=$('#toReg')||$('#toLog');if(sw)sw.onclick=()=>{UI.authMode=login?'register':'login';renderAuth();};
}
async function doAuth(){
  const err=$('#authErr'); const pass=$('#authPass').value;
  const name=$('#authUser').value.trim().toLowerCase();
  if(!name||!pass){err.textContent='Rellena nombre y contraseña.';return;}
  try{
    const out=await api('POST',UI.authMode==='register'?'/api/register':'/api/login',{name,pass});
    TOKEN=out.token;localStorage.setItem('wc_token',TOKEN);await refresh();
    if(!S.me.group) showGroupSelect(); else showApp();
  }catch(e){err.textContent=e.message;}
}
function logout(){TOKEN=null;localStorage.removeItem('wc_token');S=null;UI.tab='apuestas';UI.openMatch=null;UI.casino.game=null;UI.slip.picks=[];UI.fan=null;UI.fanDate=null;const gv=$('#groupView');if(gv)gv.classList.add('hidden');$('#appView').classList.add('hidden');$('#authView').classList.remove('hidden');$('#authUser').value='';$('#authPass').value='';UI.authMode='login';renderAuth();}
function showApp(){const gv=$('#groupView');if(gv)gv.classList.add('hidden');$('#authView').classList.add('hidden');$('#appView').classList.remove('hidden');UI.tab='apuestas';render();}

/* ===== SELECCIÓN DE GRUPO ===== */
function showGroupSelect(){
  $('#authView').classList.add('hidden');$('#appView').classList.add('hidden');
  let gv=$('#groupView');
  if(!gv){gv=document.createElement('div');gv.id='groupView';gv.className='auth';document.body.appendChild(gv);}
  gv.classList.remove('hidden');
  gv.innerHTML=`<div class="group-wrap fade-in">
    <div class="crest-big" style="margin:0 auto 14px">🏆</div>
    <h2 class="shimmer" style="font-family:'Bebas Neue';font-size:42px;text-align:center;letter-spacing:.03em">Elige tu grupo</h2>
    <p class="lead" style="color:var(--muted);text-align:center;margin-bottom:24px">Cada grupo compite por separado: su propio ranking de dinero y su propio Fantasy.</p>
    <div class="group-cards">
      <button class="group-card cruz" data-group="cruz_roja"><div class="gc-ico">✚</div><div class="gc-name">Cruz Roja</div><div class="gc-sub">Entrar con este grupo</div></button>
      <button class="group-card hook" data-group="hookeros"><div class="gc-ico">🪝</div><div class="gc-name">Hookeros</div><div class="gc-sub">Entrar con este grupo</div></button>
    </div></div>`;
  injectFloaters(gv);
  gv.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>openGroupPass(b.dataset.group));
}
const GROUP_LABEL={cruz_roja:'Cruz Roja',hookeros:'Hookeros'};
function openGroupPass(g){
  const name=GROUP_LABEL[g]||g;
  $('#modalRoot').innerHTML=`<div class="modal-bg" id="gpBg"><div class="slip card" style="max-width:360px;text-align:center">
    <div style="font-size:40px;margin-bottom:6px">${g==='cruz_roja'?'✚':'🪝'}</div>
    <h3>${esc(name)}</h3>
    <p class="section-sub" style="margin:4px 0 14px">Introduce la contraseña del grupo para entrar.</p>
    <input class="stk" id="gpPass" type="password" inputmode="numeric" placeholder="contraseña" autocomplete="off" style="text-align:center;letter-spacing:.3em">
    <div class="err" id="gpErr" style="text-align:center"></div>
    <div class="slip-actions" style="margin-top:12px"><button class="btn btn-ghost" id="gpCancel" style="flex:1">Cancelar</button><button class="btn btn-gold" id="gpGo" style="flex:1.4">Entrar</button></div>
  </div></div>`;
  const go=()=>pickGroup(g, $('#gpPass').value);
  $('#gpGo').onclick=go;
  $('#gpPass').addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  $('#gpCancel').onclick=closeModal;
  $('#gpBg').onclick=e=>{if(e.target.id==='gpBg')closeModal();};
  setTimeout(()=>{const i=$('#gpPass');if(i)i.focus();},50);
}
async function pickGroup(g,pass){
  try{ await api('POST','/api/group',{group:g,pass}); closeModal(); confettiBurst(); await refresh(); setTimeout(showApp,650); }
  catch(e){ const er=$('#gpErr'); if(er){er.textContent=e.message;} else toast(e.message,'lose'); }
}

/* ===== ROUTER ===== */
const TABS=[{id:'apuestas',label:'⚽ Partidos'},{id:'misapuestas',label:'🎟️ Mis apuestas'},{id:'registro',label:'📒 Registro'},{id:'fantasy',label:'🧠 Fantasy'},{id:'casino',label:'🎰 Casino'},{id:'ranking',label:'🏆 Ranking'}];
function paintTop(){$('#balanceTop').textContent=money(S.me.balance);$('#avatarTop').textContent=S.me.name.slice(0,2).toUpperCase();const sm=document.querySelector('.brand small');if(sm)sm.textContent=S.me.groupName?S.me.groupName:'Mundial 2026';}
function renderTabs(){const list=TABS.concat([{id:'admin',label:'⚙️ Admin'}]);$('#tabs').innerHTML=list.map(t=>`<button class="tab ${UI.tab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('');$('#tabs').querySelectorAll('.tab').forEach(b=>b.onclick=()=>{UI.tab=b.dataset.tab;UI.openMatch=null;UI.casino.game=null;UI.fan=null;UI.fanDate=null;render();});}
function render(){
  if(!S)return;paintTop();renderTabs();const v=$('#view');
  try{
    if(UI.tab==='apuestas')v.innerHTML=UI.openMatch?viewMatchDetail():viewMatchMenu();
    else if(UI.tab==='misapuestas')v.innerHTML=viewMisApuestas();
    else if(UI.tab==='registro')v.innerHTML=viewRegistro();
    else if(UI.tab==='fantasy')v.innerHTML=UI.fanDate?viewFantasyDay():viewFantasyLobby();
    else if(UI.tab==='casino')v.innerHTML=UI.casino.game?viewGame():viewLobby();
    else if(UI.tab==='ranking')v.innerHTML=viewRanking();
    else if(UI.tab==='admin')v.innerHTML=S.me.admin?viewAdmin():viewAdminGate();
  }catch(e){v.innerHTML=`<div class="card empty">Error al pintar: ${esc(e.message)}</div>`;console.error(e);}
  renderSlipBar();wireView();
}
function viewAdminGate(){
  return `<h2 class="section-title">Administrador</h2><p class="section-sub">Esta zona es para gestionar la liga. Introduce la contraseña de administrador para entrar.</p>
  <div class="card" style="padding:24px;max-width:420px"><div class="field"><label>Contraseña</label><input id="admPass" type="password" placeholder="••••••" autocomplete="off"></div><div class="err" id="admErr"></div><button class="btn btn-gold" id="admUnlock" style="width:100%">Entrar como administrador</button></div>`;
}

/* ===== HELPERS ===== */
const statusPill=s=>s==='open'?'<span class="pill open">Abierta</span>':s==='upcoming'?'<span class="pill soon">Próxima</span>':s==='live'?'<span class="pill live">En juego</span>':'<span class="pill done">Finalizado</span>';
const fanPill=s=>s==='open'?'<span class="pill open">Abierto</span>':s==='upcoming'?'<span class="pill soon">Próximamente</span>':s==='live'?'<span class="pill live">En juego</span>':'<span class="pill done">Finalizado</span>';
function fmtDate(iso){const d=new Date(iso);return d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short'})+' · '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});}
function dayKey(iso){const d=new Date(iso);return d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});}
const matchById=id=>S.matches.find(m=>m.id===id);
function resultFor(m,market){if(!m.finished)return null;const r=m.result;if(market==='winner')return r.hg>r.ag?'1':r.hg<r.ag?'2':'X';if(market==='btts')return(r.hg>=1&&r.ag>=1)?'Sí':'No';if(market==='goals'){const t=r.hg+r.ag;return t<=1?'0-1':t<=3?'2-3':t<=5?'4-5':'6+';}if(market==='margin'){const d=Math.abs(r.hg-r.ag);return d===0?'Empate':d===1?'Por 1 gol':d===2?'Por 2 goles':'Por 3+';}if(market==='bothCards')return(r.hcards>=1&&r.acards>=1)?'Sí':'No';if(market==='cards'){const c=r.hcards+r.acards;return c<=2?'≤ 2':c<=4?'3 - 4':'5+';}if(market==='corners'){const c=r.corners;return c<=8?'≤ 8':c<=11?'9 - 11':'12+';}if(market==='saves'){const s=r.saves;return s<=5?'≤ 5':s<=9?'6 - 9':'10+';}}

/* ===== MATCH MENU / DETAIL ===== */
function viewMatchMenu(){
  let html=`<h2 class="section-title">Partidos del Mundial</h2><p class="section-sub">Toca un partido para ver los mercados. La lista se actualiza sola: los que terminan pasan a "Resultados" abajo. Apuestas: abren el día antes y cierran al empezar.</p>`;
  const active=S.matches.filter(m=>!m.finished);
  const finished=S.matches.filter(m=>m.finished);
  if(!active.length) html+=`<div class="card empty">No hay próximos partidos por ahora. ¡Atento, que se actualiza solo!</div>`;
  const groups={};active.forEach(m=>{const dk=dayKey(m.kickoff);(groups[dk]=groups[dk]||[]).push(m);});
  for(const dk of Object.keys(groups)){
    html+=`<div class="day-head">${esc(dk)}</div><div class="card" style="margin-bottom:6px">`;
    html+=groups[dk].map(m=>{const t=new Date(m.kickoff).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});
      return `<div class="menu-match" data-openmatch="${m.id}"><div class="menu-teams"><div class="tt"><span class="flag">${flag(m.home)}</span>${esc(m.home)} <span style="color:var(--muted)">vs</span> <span class="flag">${flag(m.away)}</span>${esc(m.away)}</div><div class="mt">${t} · ${esc(m.group||'')} ${m.venue?'· '+esc(m.venue):''}</div></div>${statusPill(m.status)}<span class="chev">›</span></div>`;}).join('');
    html+=`</div>`;
  }
  if(finished.length){
    const open=UI.showResults;
    html+=`<button id="resToggle" style="width:100%;text-align:left;padding:12px 14px;margin-top:12px;background:var(--panel);border:1px solid var(--line);border-radius:10px;color:var(--muted);font-weight:700;cursor:pointer">${open?'▾':'▸'} Resultados (${finished.length})</button>`;
    if(open){
      const fin=finished.slice().sort((a,b)=>new Date(b.kickoff)-new Date(a.kickoff));
      html+=`<div class="card" style="margin-top:6px">`+fin.map(m=>{const t=new Date(m.kickoff).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
        return `<div class="menu-match" data-openmatch="${m.id}"><div class="menu-teams"><div class="tt"><span class="flag">${flag(m.home)}</span>${esc(m.home)} <span style="color:var(--muted)">vs</span> <span class="flag">${flag(m.away)}</span>${esc(m.away)}</div><div class="mt">${t} · ${esc(m.group||'')}</div></div><span class="menu-score">${m.result.hg} – ${m.result.ag}</span><span class="chev">›</span></div>`;}).join('')+`</div>`;
    }
  }
  return html;
}
const isPicked=(mid,market,sel)=>UI.slip.picks.some(p=>p.mid===mid&&p.market===market&&p.sel===sel);
function oddCell(m,market,sel,val,label){const res=resultFor(m,market);const win=res&&res===sel;const on=isPicked(m.id,market,sel);return `<button class="odd ${on?'sel-on':''} ${win?'win-res':''}" ${m.status!=='open'?'disabled':''} data-pick="1" data-mid="${m.id}" data-market="${market}" data-sel="${esc(sel)}" data-odd="${val}"><span class="sel">${esc(label)}</span><span class="val">${val.toFixed(2)}</span></button>`;}
function viewMatchDetail(){
  const m=matchById(UI.openMatch);if(!m)return viewMatchMenu();
  const scoreMid=m.finished?`<span class="sc">${m.result.hg} – ${m.result.ag}</span>`:'vs';
  let body='';
  if(m.status==='open'||m.status==='finished'){
    body=MARKETS.map(mk=>{const o=m.odds[mk.key];let cells;
      if(mk.special){cells=oddCell(m,'winner','1',o['1'],m.home)+oddCell(m,'winner','X',o['X'],'Empate')+oddCell(m,'winner','2',o['2'],m.away);}
      else{cells=Object.entries(o).map(([k,v])=>oddCell(m,mk.key,k,v,k)).join('');}
      return `<div class="market"><h4>${mk.label}</h4><div class="odds-row c${mk.cols}">${cells}</div></div>`;}).join('');
  }else if(m.status==='upcoming')body=`<div class="closed-note">Las apuestas se abren el día antes del inicio.</div>`;
  else body=`<div class="closed-note">Apuestas cerradas: el partido ya ha comenzado.</div>`;
  return `<button class="back" data-back="1">‹ Volver a partidos</button><div class="detail-head card"><div class="detail-teams"><div class="side"><span class="flag">${flag(m.home)}</span><span class="nm">${esc(m.home)}</span></div><div class="mid">${scoreMid}</div><div class="side"><span class="flag">${flag(m.away)}</span><span class="nm">${esc(m.away)}</span></div></div><div class="detail-meta">${fmtDate(m.kickoff)} ${m.group?'· '+esc(m.group):''} ${statusPill(m.status)}</div></div><div class="card">${body}</div><p class="section-sub" style="margin-top:14px">Toca varias cuotas (de este o de otros partidos) para crear una <b>combinada</b>.</p>`;
}
function togglePick(mid,market,sel,odd){const m=matchById(mid);const i=UI.slip.picks.findIndex(p=>p.mid===mid&&p.market===market);if(i>=0&&UI.slip.picks[i].sel===sel)UI.slip.picks.splice(i,1);else{const selLabel=market==='winner'?(sel==='1'?m.home:sel==='2'?m.away:'Empate'):sel;const pick={mid,market,sel,odd:+odd,match:`${m.home} – ${m.away}`,marketLabel:MK_LABEL[market],selLabel};if(i>=0)UI.slip.picks[i]=pick;else UI.slip.picks.push(pick);}render();}
const comboOdd=()=>+UI.slip.picks.reduce((a,p)=>a*p.odd,1).toFixed(2);
function renderSlipBar(){const root=$('#slipBarRoot');if(!S||!UI.slip.picks.length){root.innerHTML='';return;}const n=UI.slip.picks.length;root.innerHTML=`<div class="slipbar" id="slipBar">🎟️ Boleto · ${n} ${n===1?'selección':'selecciones'} <span class="cuota">${comboOdd().toFixed(2)}</span><span class="go">Apostar</span></div>`;$('#slipBar').onclick=openCombo;}
function openCombo(){const n=UI.slip.picks.length;const co=comboOdd();const legs=UI.slip.picks.map((p,i)=>`<div class="leg"><div class="lx"><div class="mk">${esc(p.marketLabel)}</div><div class="sl">${esc(p.selLabel)} <span class="od">@ ${p.odd.toFixed(2)}</span></div><div class="mm">${esc(p.match)}</div></div><button class="rm" data-rmpick="${i}">✕</button></div>`).join('');const isCombo=n>1;
  $('#modalRoot').innerHTML=`<div class="modal-bg" id="comboBg"><div class="slip card"><h3>${isCombo?'Combinada':'Apuesta simple'}</h3>${isCombo?`<span class="combo-tag">${n} selecciones · cuota ${co.toFixed(2)}</span>`:''}${legs}<label class="section-sub" style="margin:6px 0 0">Importe</label><div class="stake-row">${[5,10,25,50].map(v=>`<button class="chip" data-stk="${v}">${v}€</button>`).join('')}</div><input class="stk" id="comboStake" type="number" min="1" value="${UI.slip.stake}"><div class="ret"><span>Cuota total</span><b>${co.toFixed(2)}</b></div><div class="ret"><span>Ganancia potencial</span><b id="comboRet">${money(UI.slip.stake*co)}</b></div><div class="slip-actions"><button class="btn btn-ghost" id="comboClear" style="flex:1">Vaciar</button><button class="btn btn-gold" id="comboPlace" style="flex:1.6">Confirmar</button></div></div></div>`;
  const inp=$('#comboStake'),ret=$('#comboRet');const upd=()=>{const s=Math.max(0,+inp.value||0);UI.slip.stake=s;ret.textContent=money(s*comboOdd());};inp.oninput=upd;
  $('#modalRoot').querySelectorAll('[data-stk]').forEach(b=>b.onclick=()=>{inp.value=b.dataset.stk;upd();});
  $('#modalRoot').querySelectorAll('[data-rmpick]').forEach(b=>b.onclick=()=>{UI.slip.picks.splice(+b.dataset.rmpick,1);if(!UI.slip.picks.length){closeModal();render();}else{openCombo();render();}});
  $('#comboClear').onclick=()=>{UI.slip.picks=[];closeModal();render();};
  $('#comboBg').onclick=e=>{if(e.target.id==='comboBg')closeModal();};
  $('#comboPlace').onclick=placeCombo;
}
const closeModal=()=>{$('#modalRoot').innerHTML='';};
async function placeCombo(){const picks=UI.slip.picks;if(!picks.length)return;
  try{const out=await api('POST','/api/bets',{stake:UI.slip.stake,selections:picks.map(p=>({mid:p.mid,market:p.market,sel:p.sel}))});
    UI.slip.picks=[];closeModal();await refresh();toast('Apuesta confirmada ✓','win');UI.tab='misapuestas';render();}
  catch(e){toast(e.message,'lose');}}

/* ===== MIS APUESTAS ===== */
function viewMisApuestas(){const mine=S.myBets;let head=`<h2 class="section-title">Mis apuestas</h2><p class="section-sub">Las combinadas solo pagan si aciertas todas. Se liquidan solas con los resultados. Si un mercado (tarjetas, córners, paradas) aún no tiene dato, la selección queda <b>pendiente</b> hasta que el administrador lo meta; si lo cierra sin dato, se <b>anula y se devuelve</b>.</p>`;if(!mine.length)return head+`<div class="card empty">Aún no has apostado.</div>`;const ico={won:'✅',lost:'❌',pending:'⏳',void:'↩️'};
  const rows=mine.map(b=>{const legs=b.selections.map((s,i)=>`<div class="leg-line"><span class="ic">${ico[b.legStates[i]]||'⏳'}</span><div class="lt"><b>${esc(s.selLabel)}</b><div class="mm">${esc(s.marketLabel||MK_LABEL[s.market])} · ${esc(s.match)}${b.legStates[i]==='void'?' · <span style="color:var(--gold)">anulada</span>':''}</div></div><span class="lo">@ ${s.odd.toFixed(2)}</span></div>`).join('');const effOdd=b.selections.reduce((a,s,i)=>a*(b.legStates[i]==='won'?s.odd:1),1);const stTxt=b.status==='pending'?'Pendiente':b.status==='won'?'Ganada +'+money(b.stake*effOdd-b.stake):b.status==='void'?'Anulada (devuelta)':'Perdida −'+money(b.stake);
    return `<div class="bet-card"><div class="bh"><span class="typ">${b.type==='combinada'?'🔗 Combinada ('+b.selections.length+')':'Simple'}</span><span class="to">${b.totalOdd.toFixed(2)}</span></div>${legs}<div class="bet-foot"><span>Apostado ${money(b.stake)}</span><span class="st ${b.status}">${stTxt}</span></div></div>`;}).join('');
  return head+`<div class="card">${rows}</div>`;}

/* ===== RANKING ===== */
function viewRanking(){const arr=S.ranking;const medals=['🥇','🥈','🥉'];let head=`<h2 class="section-title">Ranking de saldos</h2><p class="section-sub">Todos empezamos con ${money(S.meta.startBalance)}.</p>`;if(!arr.length)return head+`<div class="card empty">Sin jugadores.</div>`;const rows=arr.map((p,i)=>{const d=p.balance-S.meta.startBalance;const dc=d>0?'up':d<0?'down':'';const dt=(d>0?'+':'')+money(d);const pos=i<3?`<span class="medal">${medals[i]}</span>`:`<span class="rank-pos">${i+1}</span>`;return `<div class="rank-row ${p.name===S.me.name?'me':''}">${pos}<span class="nm">${esc(p.name)}${p.name===S.me.name?'<span class="me-tag">TÚ</span>':''}</span><span class="delta ${dc}">${dt}</span><span class="bal">${money(p.balance)}</span></div>`;}).join('');return head+`<div class="card">${rows}</div>`;}

/* ===== CASINO ===== */
function viewLobby(){return `<h2 class="section-title">Casino</h2><p class="section-sub">Elige una sala y entra a jugar. Saldo: ${money(S.me.balance)}.</p><div class="lobby"><div class="card game-tile" data-enter="ruleta"><div class="ico">🎡</div><h3>Sala de Ruleta</h3><p>Europea, un cero. Pleno ×36, color ×2, docenas ×3.</p><button class="btn btn-gold" style="margin-top:14px">Entrar a jugar</button></div><div class="card game-tile" data-enter="blackjack"><div class="ico">🃏</div><h3>Sala de Blackjack</h3><p>Acércate a 21. Blackjack 3:2. Crupier se planta en 17.</p><button class="btn btn-gold" style="margin-top:14px">Entrar a jugar</button></div></div>`;}
function viewGame(){return `<button class="back" data-leavegame="1">‹ Salir al casino</button>${UI.casino.game==='ruleta'?viewRuleta():viewBlackjack()}`;}
const WHEEL=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const colorOf=n=>n===0?'g':REDS.has(n)?'r':'b';
const RL_OUTSIDE=[{id:'red',label:'Rojo',cls:'red'},{id:'black',label:'Negro',cls:'black'},{id:'even',label:'Par'},{id:'odd',label:'Impar'},{id:'low',label:'1–18'},{id:'high',label:'19–36'},{id:'d1',label:'1ª doc.'},{id:'d2',label:'2ª doc.'},{id:'d3',label:'3ª doc.'}];
const wheelGradient=()=>{const seg=360/WHEEL.length;return`conic-gradient(${WHEEL.map((n,i)=>{const c=colorOf(n)==='g'?'#2e9e6e':colorOf(n)==='r'?'#c2283d':'#1a2440';return`${c} ${(i*seg).toFixed(2)}deg ${((i+1)*seg).toFixed(2)}deg`;}).join(',')})`;};
function viewRuleta(){const last=UI.rl.history.length?UI.rl.history[UI.rl.history.length-1]:null;const hub=last==null?'⚡':last;const hubColor=last==null?'var(--gold)':(colorOf(last)==='g'?'var(--grass)':colorOf(last)==='r'?'#ff8b9b':'var(--text)');
  return `<h2 class="section-title">Mesa de ruleta</h2><p class="section-sub">Pon fichas y gira. Saldo: ${money(S.me.balance)}.</p><div class="casino-grid"><div class="card wheel-stage"><div class="wheel-outer"><div class="wheel-ptr"></div><div class="wheel" id="wheel" style="background:${wheelGradient()};transform:rotate(${UI.rl.angle}deg)"></div><div class="wheel-hub" style="color:${hubColor}">${hub}</div></div><div class="rl-history">${UI.rl.history.slice(-10).map(n=>{const c=colorOf(n);const bg=c==='g'?'rgba(53,208,138,.3)':c==='r'?'rgba(214,48,73,.45)':'rgba(20,28,46,.95)';return`<span class="rl-hist" style="background:${bg}">${n}</span>`;}).join('')||'<span class="section-sub">Sin tiradas aún</span>'}</div></div><div class="card rl-controls"><h4 style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Apuestas exteriores</h4><div class="rl-bets">${RL_OUTSIDE.map(o=>`<button class="rl-bet ${o.cls||''} ${UI.rl.picks.includes(o.id)?'sel':''}" data-rlbet="${o.id}">${o.label}</button>`).join('')}</div><h4 style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px">Pleno a número (×36)</h4><div class="num-grid"><button class="num g ${UI.rl.picks.includes(0)?'sel':''}" data-rlnum="0">0</button>${Array.from({length:36},(_,i)=>i+1).map(n=>`<button class="num ${colorOf(n)==='r'?'r':'b'} ${UI.rl.picks.includes(n)?'sel':''}" data-rlnum="${n}">${n}</button>`).join('')}</div><div class="stake-control"><span class="section-sub" style="margin:0">Ficha por apuesta:</span><input id="rlStake" type="number" min="1" value="${UI.rl.stake}"></div><div class="slip-actions"><button class="btn btn-ghost" id="rlClear" style="flex:1">Limpiar</button><button class="btn btn-gold" id="rlSpin" style="flex:1.6" ${UI.rl.spinning?'disabled':''}>Girar 🎡</button></div></div></div>`;}
function rlToggle(v){const i=UI.rl.picks.indexOf(v);if(i>=0)UI.rl.picks.splice(i,1);else UI.rl.picks.push(v);render();}
async function rlSpin(){if(UI.rl.spinning)return;const stake=Math.max(1,+($('#rlStake').value)||0);UI.rl.stake=stake;if(!UI.rl.picks.length){toast('Elige al menos una apuesta');return;}
  let out;try{out=await api('POST','/api/casino/roulette',{bets:UI.rl.picks.map(t=>({type:t,amount:stake}))});}catch(e){toast(e.message,'lose');return;}
  UI.rl.spinning=true;const result=out.result;const idx=WHEEL.indexOf(result);const seg=360/WHEEL.length;const finalOrient=(360-(idx*seg+seg/2)%360+360)%360;const cur=UI.rl.angle;const delta=(finalOrient-(cur%360)+360)%360;const target=cur+360*5+delta;const w=$('#wheel');if(w)w.style.transform=`rotate(${target}deg)`;UI.rl.angle=target;const btn=$('#rlSpin');if(btn)btn.disabled=true;
  setTimeout(async()=>{UI.rl.history.push(result);UI.rl.spinning=false;UI.rl.angle=target%360;await refresh();render();if(out.winnings>0)toast(`Salió ${result}. Ganas ${money(out.winnings)} · neto ${out.net>=0?'+':''}${money(out.net)}`,'win');else toast(`Salió ${result}. Perdiste ${money(stake*UI.rl.picks.length)}`,'lose');},4800);}

function cardHTML(c){if(c.hidden)return `<div class="pcard back"></div>`;return `<div class="pcard ${c.red?'red':''}"><span class="rk">${c.r}</span><span class="st2">${c.s}</span></div>`;}
function viewBlackjack(){const g=UI.bj;let inner='';
  if(!g){inner=`<div style="padding:6px 0 0"><label class="section-sub" style="margin:0">Apuesta</label><div style="display:flex;gap:8px;margin:8px 0">${[5,10,25,50].map(v=>`<button class="chip" data-bjbet="${v}" style="flex:1;padding:9px 0;border-radius:9px;background:#0c1322;border:1px solid var(--line);font-weight:700">${v}€</button>`).join('')}</div><div class="stake-control"><input id="bjStake" type="number" min="1" value="10"><button class="btn btn-gold" id="bjDeal">Repartir 🃏</button></div>${UI.bjLast?`<div class="bj-msg ${UI.bjLast.cls}">${UI.bjLast.msg}</div>`:''}</div>`;}
  else{const dv=g.dealerValue==null?'?':g.dealerValue;inner=`<div class="bj-hand"><div class="lbl"><span>Crupier</span><span class="mono">${dv}</span></div><div class="bj-cards">${g.dealer.map(cardHTML).join('')}</div></div><div class="bj-hand"><div class="lbl"><span>Tú · apuesta ${money(g.bet)}</span><span class="mono">${g.playerValue}</span></div><div class="bj-cards">${g.player.map(cardHTML).join('')}</div></div>${g.msg?`<div class="bj-msg ${g.outcome==='win'?'win':g.outcome==='lose'?'lose':g.outcome==='push'?'push':''}">${g.msg}</div>`:''}<div class="bj-actions">${g.phase==='player'?`<button class="btn btn-gold" id="bjHit" style="flex:1">Pedir</button><button class="btn btn-ghost" id="bjStand" style="flex:1">Plantarse</button>${g.player.length===2?`<button class="btn btn-ghost" id="bjDouble" style="flex:1">Doblar</button>`:''}`:`<button class="btn btn-gold" id="bjAgain" style="flex:1">Jugar otra mano</button>`}</div>`;}
  return `<h2 class="section-title">Mesa de blackjack</h2><p class="section-sub">Saldo: ${money(S.me.balance)}.</p><div class="card bj-table">${inner}</div>`;}
async function bjCall(path,body){try{const g=await api('POST',path,body);UI.bj=g;if(g.phase==='done')UI.bjLast={msg:g.msg,cls:g.outcome==='win'?'win':g.outcome==='lose'?'lose':'push'};await refresh();render();}catch(e){toast(e.message,'lose');}}
async function bjDeal(){const bet=Math.max(1,+($('#bjStake').value)||0);UI.bjLast=null;await bjCall('/api/casino/bj/deal',{bet});}

/* ===== FANTASY ===== */
function avatarHTML(p,size){if(p.photo)return `<img src="${esc(p.photo)}" class="pavatar" style="width:${size}px;height:${size}px;object-fit:cover" onerror="this.replaceWith(document.createRange().createContextualFragment(this.dataset.fb))" data-fb='${avatarFallback(p,size)}'>`;return avatarFallback(p,size);}
function avatarFallback(p,size){const c=TEAM_COLOR[p.team]||'#3a4a6b';const fs=Math.round(size*0.36);return `<div class="pavatar" style="width:${size}px;height:${size}px;font-size:${fs}px;background:radial-gradient(circle at 50% 30%, ${c}, #0c1322)">${esc(initials(p.name).toUpperCase())}<span class="fl">${flag(p.team)}</span></div>`;}
const playerById=()=>Object.fromEntries(S.players.map(p=>[p.id,p]));
function dayByKey(did){return S.fantasy.days.find(d=>d.dateKey===did);}
function eligibleForDay(did){const d=dayByKey(did);const teams=new Set();d.matches.forEach(m=>{teams.add(m.home);teams.add(m.away);});return S.players.filter(p=>teams.has(p.team));}
function viewFantasyLobby(){
  let head=`<h2 class="section-title">Fantasy por jornadas</h2><p class="section-sub">Monta tu 11 con ${S.fantasy.budget} M (máx. ${S.fantasy.maxPerTeam} por selección). Cada día abre <b>2 días antes</b>. Puntos al estilo SofaScore. ${S.meta.provider?'Datos y fotos reales conectados.':'Modo semilla: fotos = avatar y puntos automáticos hasta conectar la API.'}</p>`;
  const rows=S.fantasy.days.map(d=>{const dd=dayKey(d.matches[0].kickoff);const teams=[...new Set(d.matches.flatMap(m=>[m.home,m.away]))];let extra='';if(d.mine){extra=`<span class="ptpts">${d.mine.points.total} pts${d.mine.points.allScored?'':' (prov.)'}</span>`;}
    return `<div class="day-tile" data-fanday="${d.dateKey}"><div class="dl"><div class="dd">${esc(dd)}</div><div class="dm">${d.matches.length} partido(s) · ${teams.map(t=>flag(t)).join(' ')} ${d.mine?'· ✅ 11 puesto':''}</div></div>${extra}${fanPill(d.status)}<span class="chev">›</span></div>`;}).join('');
  const lb=S.fantasy.ranking;const medals=['🥇','🥈','🥉'];
  const lbHtml=lb.length?`<div class="card">${lb.map((x,i)=>`<div class="rank-row ${x.name===S.me.name?'me':''}">${i<3?`<span class="medal">${medals[i]}</span>`:`<span class="rank-pos">${i+1}</span>`}<span class="nm">${esc(x.name)}${x.name===S.me.name?'<span class="me-tag">TÚ</span>':''}</span><span class="bal">${x.points} pts</span></div>`).join('')}</div>`:`<div class="card empty">Sin puntos todavía.</div>`;
  return head+`<div class="card">${rows}</div><div style="margin-top:16px"><h2 class="section-title" style="margin-top:8px">Clasificación Fantasy</h2><p class="section-sub">Puntos acumulados.</p>${lbHtml}</div>`;
}
function ensureFan(did){if(UI.fan&&UI.fan.dateKey===did)return;const d=dayByKey(did);if(d.mine){UI.fan=JSON.parse(JSON.stringify({dateKey:did,formation:d.mine.formation,captainId:d.mine.captainId,slots:d.mine.slots}));}else UI.fan=newLineup(did,'4-3-3');}
function newLineup(did,formation){const f=S.fantasy.formations[formation];const slots=[{pos:'POR',id:null}];['DEF','MED','DEL'].forEach(pos=>{for(let i=0;i<f[pos];i++)slots.push({pos,id:null});});return{dateKey:did,formation,captainId:null,slots};}
const fanSpent=()=>UI.fan.slots.reduce((a,s)=>a+(s.id?playerById()[s.id].price:0),0);
const fanTeamCount=team=>UI.fan.slots.filter(s=>s.id&&playerById()[s.id].team===team).length;
const fanCount=()=>UI.fan.slots.filter(s=>s.id).length;
function viewFantasyDay(){
  const did=UI.fanDate;ensureFan(did);const d=dayByKey(did);const st=d.status;const PBI=playerById();
  const editable=(st==='open');const rem=S.fantasy.budget-fanSpent();const cnt=fanCount();const need=UI.fan.slots.length;
  const rowOf={POR:[],DEF:[],MED:[],DEL:[]};UI.fan.slots.forEach((s,i)=>rowOf[s.pos].push({s,i}));
  const minePts=d.mine?d.mine.points:null;
  const renderRow=arr=>`<div class="pitch-row">${arr.map(({s,i})=>{if(s.id){const p=PBI[s.id];const cap=s.id===UI.fan.captainId;let sub=editable?p.price+' M':'—';return `<div class="slot ${cap?'cap':''}" data-slot="${i}">${avatarHTML(p,50)}<span class="nm">${esc(p.name.split(' ').slice(-1)[0])}</span><span class="pr">${sub}</span></div>`;}return `<div class="slot" data-slot="${i}"><span class="ph">＋</span><span class="nm" style="color:rgba(255,255,255,.7)">${POS_LABEL[s.pos]}</span><span class="pr">vacío</span></div>`;}).join('')}</div>`;
  const pitch=`<div class="pitch">${renderRow(rowOf.DEL)}${renderRow(rowOf.MED)}${renderRow(rowOf.DEF)}${renderRow(rowOf.POR)}</div>`;
  const forms=`<div class="form-select">${Object.keys(S.fantasy.formations).map(f=>`<button class="form-opt ${UI.fan.formation===f?'on':''}" data-form="${f}" ${editable?'':'disabled'}>${f}</button>`).join('')}</div>`;
  let scoreLine='';if(st!=='open'&&st!=='upcoming'&&minePts){scoreLine=`<div class="fan-stat" style="flex:1 0 100%"><div class="k">Puntos de la jornada</div><div class="v ok">${minePts.total} pts ${minePts.allScored?'(definitivo)':'(provisional)'}</div></div>`;}
  const bar=`<div class="fan-bar"><div class="fan-stat"><div class="k">Presupuesto restante</div><div class="v ${rem<0?'bad':'ok'}">${rem} M</div></div><div class="fan-stat"><div class="k">Jugadores</div><div class="v">${cnt}/${need}</div></div><div class="fan-stat"><div class="k">Capitán (×2)</div><div class="v">${UI.fan.captainId?esc(PBI[UI.fan.captainId].name.split(' ').slice(-1)[0]):'—'}</div></div>${scoreLine}</div>`;
  const matchesLine=d.matches.map(m=>`${flag(m.home)} ${esc(m.home)} vs ${esc(m.away)} ${flag(m.away)}`).join(' · ');
  const actions=editable?`<div class="slip-actions" style="padding:0 16px 16px"><button class="btn btn-ghost" id="fanClear" style="flex:1">Vaciar</button><button class="btn btn-gold" id="fanSave" style="flex:1.6">Guardar 11</button></div>`:'';
  let note='';if(st==='upcoming')note=`<div class="closed-note">Abre 2 días antes del primer partido.</div>`;else if(st==='live')note=`<div class="closed-note">Jornada en juego: 11 bloqueado.</div>`;else if(st==='finished')note=`<div class="closed-note">Jornada finalizada.</div>`;
  const capPicker=editable&&cnt>0?`<div class="market"><h4>Elige capitán (×2)</h4><div style="display:flex;gap:8px;flex-wrap:wrap">${UI.fan.slots.filter(s=>s.id).map(s=>{const p=PBI[s.id];return `<button class="form-opt ${UI.fan.captainId===s.id?'on':''}" data-cap="${s.id}">${esc(p.name.split(' ').slice(-1)[0])}</button>`;}).join('')}</div></div>`:'';
  return `<button class="back" data-fanback="1">‹ Volver a jornadas</button><h2 class="section-title">${esc(dayKey(d.matches[0].kickoff))}</h2><p class="section-sub">${matchesLine} ${fanPill(st)}</p><div class="card">${bar}${forms}<div style="padding:0 12px 12px">${pitch}</div>${capPicker}${actions}${note}</div>`;
}
function openPlayerPicker(slotIdx){const did=UI.fan.dateKey;const slot=UI.fan.slots[slotIdx];const pos=slot.pos;const PBI=playerById();const elig=eligibleForDay(did).filter(p=>p.pos===pos);const usedIds=new Set(UI.fan.slots.filter(s=>s.id).map(s=>s.id));const rem=S.fantasy.budget-fanSpent()+(slot.id?PBI[slot.id].price:0);
  const list=elig.sort((a,b)=>b.price-a.price).map(p=>{const already=usedIds.has(p.id)&&p.id!==slot.id;const teamFull=fanTeamCount(p.team)>=S.fantasy.maxPerTeam&&!(slot.id&&PBI[slot.id].team===p.team);const tooExp=p.price>rem;const dis=already||teamFull||tooExp;const why=already?'Ya en tu 11':teamFull?'Máx '+S.fantasy.maxPerTeam+'/equipo':tooExp?'Sin presupuesto':'';return `<div class="prow">${avatarHTML(p,40)}<div class="pn"><div class="nm">${esc(p.name)}</div><div class="tm">${flag(p.team)} ${esc(p.team)} · ${POS_LABEL[p.pos]}</div></div><span class="pp">${p.price} M</span><button data-pick-player="${p.id}" ${dis?'disabled':''}>${dis?why:'Fichar'}</button></div>`;}).join('')||`<div class="empty">No hay ${POS_LABEL[pos].toLowerCase()}s disponibles.</div>`;
  $('#modalRoot').innerHTML=`<div class="modal-bg" id="pkBg"><div class="slip card"><h3>Elegir ${POS_LABEL[pos]}</h3><p class="section-sub" style="margin:4px 0">Disponible: <b style="color:var(--gold)">${rem} M</b></p>${slot.id?`<button class="btn btn-ghost" id="pkRemove" style="width:100%;margin-bottom:6px">Quitar a ${esc(PBI[slot.id].name)}</button>`:''}<div class="picker-list">${list}</div></div></div>`;
  $('#pkBg').onclick=e=>{if(e.target.id==='pkBg')closeModal();};
  if($('#pkRemove'))$('#pkRemove').onclick=()=>{const rid=UI.fan.slots[slotIdx].id;UI.fan.slots[slotIdx].id=null;if(UI.fan.captainId===rid)UI.fan.captainId=null;closeModal();render();};
  $('#modalRoot').querySelectorAll('[data-pick-player]').forEach(b=>b.onclick=()=>{UI.fan.slots[slotIdx].id=b.dataset.pickPlayer;closeModal();render();});
}
async function fanSave(){if(fanCount()<UI.fan.slots.length){toast('Completa los 11');return;}if(fanSpent()>S.fantasy.budget){toast('Te pasas del presupuesto','lose');return;}if(!UI.fan.captainId){toast('Elige capitán');return;}
  try{await api('POST','/api/fantasy',{dateKey:UI.fan.dateKey,lineup:UI.fan});await refresh();toast('11 guardado ✓','win');render();}catch(e){toast(e.message,'lose');}}

/* ===== REGISTRO / HISTORIAL ===== */
function txIcon(t){return ({bet_win:'⚽',bet_lose:'⚽',bet_void:'↩️',roulette:'🎡',blackjack:'🃏',bonus:'🎁',admin_adjust:'🛠️'}[t])||'💶';}
function fmtDateTime(ts){const d=new Date(ts);return d.toLocaleDateString('es-ES',{day:'numeric',month:'short'})+' · '+d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});}
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
function txHeadline(t){const amt=money(Math.abs(t.amount));const pos=t.amount>=0;const u=cap(t.user);
  switch(t.type){
    case'bet_win':return `${u} ha ganado +${amt}`;
    case'bet_lose':return `${u} ha perdido −${amt}`;
    case'bet_void':return `${u}: apuesta anulada (devuelta)`;
    case'roulette':return `${u} ${pos?'ha ganado +':'ha perdido −'}${amt} en la ruleta`;
    case'blackjack':return `${u} ${pos?'ha ganado +':'ha perdido −'}${amt} al blackjack`;
    case'bonus':return `${u} ha recibido un bono de +${amt}`;
    case'admin_adjust':return `${u}: ${t.concept} (−${amt})`;
    default:return `${u} ${pos?'+':'−'}${amt}`;
  }
}
function viewRegistro(){
  const tx=S.ledger||[];
  let head=`<h2 class="section-title">Historial · ${esc(S.me.groupName||'')}</h2><p class="section-sub">Toca cualquier línea para ver la apuesta o la jugada que hay detrás. Solo veis lo de vuestro grupo.</p>`;
  if(!tx.length)return head+`<div class="card empty">Todavía no hay movimientos en tu grupo.</div>`;
  const rows=tx.map(t=>{const pos=t.amount>=0;const open=!!UI.expandedTx[t.id];
    return `<div class="tx-acc ${open?'open':''}" data-tx="${t.id}"><div class="tx-head"><div class="tx-ic">${txIcon(t.type)}</div><div class="tx-hl">${esc(txHeadline(t))}</div><div class="tx-amt ${pos?'pos':'neg'}">${pos?'+':'−'}${money(Math.abs(t.amount))}</div><span class="tx-arrow">${open?'▾':'▸'}</span></div>${open?`<div class="tx-body"><div class="tx-detail">${esc(t.detail||t.concept||'Sin detalle')}</div><div class="tx-time">${fmtDateTime(t.ts)}</div></div>`:''}</div>`;}).join('');
  return head+`<div class="card">${rows}</div>`;
}

/* ===== ADMIN ===== */
function viewAdmin(){let head=`<h2 class="section-title">Administración</h2><p class="section-sub">Estás en modo administrador. Telegram ${S.meta.telegram?'✅':'⚪'} · Datos: ${S.meta.provider?'✅ '+esc(S.meta.providerName||''):'⚪ manual'}. <button class="adm-lock" id="admLock">Salir del modo admin</button></p>`;
  const opts=(S.participants||[]).map(p=>`<option value="${esc(p.name)}">${esc(p.name)} · ${esc(p.groupName)} (${money(p.balance)})</option>`).join('');
  const gopts=Object.entries(S.groups||{}).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('');
  const partRows=(S.participants||[]).map(p=>`<div class="rank-row"><span class="nm">${esc(p.name)} <span class="me-tag" style="color:var(--muted)">${esc(p.groupName)}</span> ${p.claimed?'':'<span class="me-tag" style="color:var(--coral)">SIN CLAVE</span>'}</span><span class="bal">${money(p.balance)}</span></div>`).join('')||'<div class="empty">Sin participantes aún.</div>';
  const manage=`<div class="card adminbox" style="margin-bottom:16px">
    <h4>➕ Pre-registrar participante</h4>
    <div class="arow"><input id="npName" placeholder="nombre"><select id="npGroup">${gopts}</select><input id="npPass" placeholder="contraseña (opcional)"><input id="npBal" type="number" placeholder="saldo (100)"><button class="btn btn-gold" id="npAdd">Crear</button></div>
    <p class="section-sub" style="margin:6px 0 16px">Si no pones contraseña, será el propio nombre. El participante también puede registrarse solo y elegir grupo.</p>
    <h4>💰 Meter dinero / dar bono / castigar</h4>
    <div class="arow"><select id="cdUser">${opts}</select><input id="cdAmt" type="number" placeholder="importe (+ premio / − castigo)"><input id="cdConcept" placeholder="concepto (ej. Bono jornada Fantasy)"><button class="btn btn-gold" id="cdGo">Aplicar</button></div>
    <p class="section-sub" style="margin:6px 0 14px">Pon el importe en <b>negativo</b> para un castigo (ej. −20). Todo aparece en el Historial del grupo.</p>
    <h4>Participantes</h4>${partRows}
  </div>`;
  const toggle=`<div class="card" style="margin-bottom:16px"><div class="toggle-row"><div class="switch ${S.meta.demoOpen?'on':''}" id="demoToggle"></div><div><div style="font-weight:700">Modo libre</div><div class="section-sub" style="margin:0">Abre apuestas y Fantasy sin esperar a la fecha (para probar).</div></div></div></div>`;
  const rows=S.matches.map(m=>{const r=m.result||{};return `<div class="admin-match" data-amid="${m.id}"><div class="nm">${flag(m.home)} ${esc(m.home)} vs ${esc(m.away)} ${flag(m.away)}<div class="section-sub" style="margin:0">${fmtDate(m.kickoff)} ${m.finished?'· ✅':''}</div></div><div class="admin-grid"><label>Goles *</label><input class="am-hg" type="number" min="0" value="${r.hg??''}" placeholder="L"><input class="am-ag" type="number" min="0" value="${r.ag??''}" placeholder="V"><label>Tarj. (opc)</label><input class="am-hc" type="number" min="0" value="${r.hcards??''}" placeholder="—"><input class="am-ac" type="number" min="0" value="${r.acards??''}" placeholder="—"><label>Córn. (opc)</label><input class="am-co" type="number" min="0" value="${r.corners??''}" placeholder="—"><label>Parad. (opc)</label><input class="am-sv" type="number" min="0" value="${r.saves??''}" placeholder="—"><button class="btn btn-gold am-save">${m.finished?'Re-guardar':'Guardar'}</button></div></div>`;}).join('');
  return head+manage+toggle+`<h4 style="font-family:'Bebas Neue';font-size:20px;letter-spacing:.04em;margin:8px 4px">Resultados</h4><p class="section-sub" style="margin:0 4px 8px">Solo los <b>goles</b> son obligatorios (*). Tarjetas, córners y paradas son opcionales: si los dejas vacíos, esas apuestas se <b>anulan y se devuelve el dinero</b>. Con la API conectada, los resultados entran solos.</p><div class="card">${rows}</div>`;}

/* ===== WIRING ===== */
function wireView(){
  document.querySelectorAll('[data-openmatch]').forEach(b=>b.onclick=()=>{UI.openMatch=b.dataset.openmatch;render();});
  if($('#resToggle'))$('#resToggle').onclick=()=>{UI.showResults=!UI.showResults;render();};
  const back=document.querySelector('[data-back]');if(back)back.onclick=()=>{UI.openMatch=null;render();};
  document.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>togglePick(b.dataset.mid,b.dataset.market,b.dataset.sel,b.dataset.odd));
  document.querySelectorAll('[data-enter]').forEach(b=>b.onclick=()=>{UI.casino.game=b.dataset.enter;if(b.dataset.enter==='blackjack'){UI.bj=null;}render();});
  const lg=document.querySelector('[data-leavegame]');if(lg)lg.onclick=()=>{UI.casino.game=null;UI.bj=null;render();};
  document.querySelectorAll('[data-rlbet]').forEach(b=>b.onclick=()=>rlToggle(b.dataset.rlbet));
  document.querySelectorAll('[data-rlnum]').forEach(b=>b.onclick=()=>rlToggle(+b.dataset.rlnum));
  if($('#rlSpin'))$('#rlSpin').onclick=rlSpin;if($('#rlClear'))$('#rlClear').onclick=()=>{UI.rl.picks=[];render();};
  if($('#rlStake'))$('#rlStake').onchange=e=>UI.rl.stake=Math.max(1,+e.target.value||1);
  if($('#bjDeal'))$('#bjDeal').onclick=bjDeal;
  document.querySelectorAll('[data-bjbet]').forEach(b=>b.onclick=()=>{if($('#bjStake'))$('#bjStake').value=b.dataset.bjbet;});
  if($('#bjHit'))$('#bjHit').onclick=()=>bjCall('/api/casino/bj/hit',{gameId:UI.bj.gameId});
  if($('#bjStand'))$('#bjStand').onclick=()=>bjCall('/api/casino/bj/stand',{gameId:UI.bj.gameId});
  if($('#bjDouble'))$('#bjDouble').onclick=()=>bjCall('/api/casino/bj/double',{gameId:UI.bj.gameId});
  if($('#bjAgain'))$('#bjAgain').onclick=()=>{UI.bj=null;render();};
  document.querySelectorAll('[data-fanday]').forEach(b=>b.onclick=()=>{UI.fanDate=b.dataset.fanday;UI.fan=null;render();});
  const fb=document.querySelector('[data-fanback]');if(fb)fb.onclick=()=>{UI.fanDate=null;UI.fan=null;render();};
  document.querySelectorAll('[data-form]').forEach(b=>b.onclick=()=>{if(b.disabled)return;UI.fan=newLineup(UI.fan.dateKey,b.dataset.form);render();});
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{const d=dayByKey(UI.fan.dateKey);if(d.status!=='open'){toast('Jornada no abierta');return;}openPlayerPicker(+b.dataset.slot);});
  document.querySelectorAll('[data-cap]').forEach(b=>b.onclick=()=>{UI.fan.captainId=b.dataset.cap;render();});
  if($('#fanClear'))$('#fanClear').onclick=()=>{UI.fan=newLineup(UI.fan.dateKey,UI.fan.formation);render();};
  if($('#fanSave'))$('#fanSave').onclick=fanSave;
  if($('#admUnlock'))$('#admUnlock').onclick=async()=>{const p=$('#admPass').value;if(!p){$('#admErr').textContent='Introduce la contraseña.';return;}try{await api('POST','/api/admin/unlock',{pass:p});await refresh();render();}catch(e){$('#admErr').textContent=e.message;}};
  if($('#admLock'))$('#admLock').onclick=async()=>{try{await api('POST','/api/admin/lock',{});await refresh();UI.tab='apuestas';render();}catch(e){toast(e.message,'lose');}};
  document.querySelectorAll('[data-tx]').forEach(b=>b.onclick=()=>{const id=b.dataset.tx;UI.expandedTx[id]=!UI.expandedTx[id];render();});
  if($('#demoToggle'))$('#demoToggle').onclick=async()=>{try{await api('POST','/api/admin/demo',{on:!S.meta.demoOpen});await refresh();render();}catch(e){toast(e.message,'lose');}};
  if($('#npAdd'))$('#npAdd').onclick=async()=>{const name=$('#npName').value.trim();if(!name){toast('Pon un nombre');return;}const body={name,group:$('#npGroup').value};const pp=$('#npPass').value;if(pp)body.pass=pp;if($('#npBal').value!=='')body.balance=Number($('#npBal').value);try{const o=await api('POST','/api/admin/participant',body);await refresh();toast(`"${o.name}" creado · contraseña: ${o.defaultPass}`,'win');render();}catch(e){toast(e.message,'lose');}};
  if($('#cdGo'))$('#cdGo').onclick=async()=>{const user=$('#cdUser').value;const amount=Number($('#cdAmt').value);const concept=$('#cdConcept').value.trim()||'Ajuste del administrador';if(!user){toast('Elige participante');return;}if(!amount){toast('Pon un importe (+ o −)');return;}try{await api('POST','/api/admin/credit',{user,amount,concept});await refresh();toast('Aplicado ✓','win');render();}catch(e){toast(e.message,'lose');}};
  document.querySelectorAll('.admin-match').forEach(row=>{const btn=row.querySelector('.am-save');if(!btn)return;btn.onclick=async()=>{const raw=s=>row.querySelector(s).value.trim();const hg=raw('.am-hg'),ag=raw('.am-ag');if(hg===''||ag===''||isNaN(+hg)||isNaN(+ag)||+hg<0||+ag<0){toast('Pon al menos los goles (local y visitante)','lose');return;}const body={mid:row.dataset.amid,hg,ag,hcards:raw('.am-hc'),acards:raw('.am-ac'),corners:raw('.am-co'),saves:raw('.am-sv')};try{const o=await api('POST','/api/admin/result',body);await refresh();toast(`Guardado · ${o.settled} liquidada(s)`,'win');render();}catch(e){toast(e.message,'lose');}};});
}

/* ===== AUTO-REFRESH ===== */
function canAuto(){if(!S)return false;if($('#modalRoot').innerHTML)return false;if(UI.rl.spinning)return false;if(UI.casino.game==='blackjack'&&UI.bj&&UI.bj.phase==='player')return false;if(UI.tab==='apuestas'&&UI.openMatch)return false;if(UI.tab==='fantasy'&&UI.fanDate&&dayByKey(UI.fanDate)&&dayByKey(UI.fanDate).status==='open')return false;return true;}
setInterval(async()=>{if(!TOKEN||!S)return;try{await refresh();if(canAuto())render();else paintTop();}catch(e){}},10000);

/* ===== BOOT ===== */
$('#authBtn').onclick=doAuth;
$('#authPass').addEventListener('keydown',e=>{if(e.key==='Enter')doAuth();});
$('#logoutBtn').onclick=logout;
(async function init(){renderAuth();if(TOKEN){try{await refresh();if(!S.me.group)showGroupSelect();else showApp();}catch(e){logout();}}})();
