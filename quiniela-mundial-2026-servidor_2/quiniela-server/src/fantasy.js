import { mulberry32, hashStr } from './odds.js';

export const FORMATIONS={'4-3-3':{DEF:4,MED:3,DEL:3},'4-4-2':{DEF:4,MED:4,DEL:2},'3-5-2':{DEF:3,MED:5,DEL:2},'3-4-3':{DEF:3,MED:4,DEL:3},'5-3-2':{DEF:5,MED:3,DEL:2},'4-5-1':{DEF:4,MED:5,DEL:1}};
export const FAN_BUDGET=100;
export const MAX_PER_TEAM=5;

// Si el partido trae estadísticas reales por jugador (stats), se usa la fórmula real.
// Si no, se usa el motor determinista (mismo número para todos) modulado por el resultado.
export function playerMatchPoints(player, match){
  if(!match || !match.finished || !match.result) return null;
  const r=match.result;
  const home = player.team===match.home;
  const gf = home? r.hg : r.ag;
  const ga = home? r.ag : r.hg;

  // ---- Modo REAL: si hay stats[player.id], puntúa por eventos ----
  const st = match.stats && match.stats[player.id];
  if(st){
    let pts=0;
    if(st.minutes>0) pts+=2; else return 0;
    if(st.minutes>=60) pts+=1;
    if(player.pos==='POR'||player.pos==='DEF'){ if(ga===0 && st.minutes>=60) pts+=4; pts-=Math.floor(ga/2); }
    if(player.pos==='MED' && ga===0 && st.minutes>=60) pts+=1;
    const goalVal = {POR:6,DEF:6,MED:5,DEL:4}[player.pos];
    pts += (st.goals||0)*goalVal;
    pts += (st.assists||0)*3;
    if(player.pos==='POR'){ pts += Math.floor((st.saves||0)/3); if(st.penaltySaved) pts+=5; }
    pts -= (st.yellow||0)*1;
    pts -= (st.red||0)*3;
    pts += (st.motm? 3:0);
    return Math.max(-4, pts);
  }

  // ---- Modo automático (sin stats): determinista por jugador+partido ----
  const won=gf>ga, draw=gf===ga;
  const rnd=mulberry32(hashStr(player.id+'|'+match.id));
  let pts=2+Math.floor(rnd()*6);
  if(won)pts+=3; else if(draw)pts+=1;
  if((player.pos==='POR'||player.pos==='DEF')&&ga===0)pts+=4;
  if(player.pos==='POR')pts+=Math.min(3,Math.floor(rnd()*(ga+1)));
  if(gf>0&&(player.pos==='DEL'||player.pos==='MED')){
    const w=player.pos==='DEL'?0.5:0.32; let cr=0;
    for(let g=0;g<gf;g++){ if(rnd()<w) cr++; }
    pts+=cr*(player.pos==='DEL'?4:5);
    if(rnd()<0.25)pts+=3;
  }
  if(player.pos==='DEF'&&ga>=2)pts-=1;
  return Math.max(0,pts);
}

export function newLineup(dateKey, formation='4-3-3'){
  const f=FORMATIONS[formation];
  const slots=[{pos:'POR',id:null}];
  ['DEF','MED','DEL'].forEach(pos=>{ for(let i=0;i<f[pos];i++) slots.push({pos,id:null}); });
  return {dateKey, formation, captainId:null, slots};
}

// valida un lineup contra el presupuesto, tope por equipo, posiciones y elegibilidad
export function validateLineup(lineup, eligibleById, playerById){
  const f=FORMATIONS[lineup.formation];
  if(!f) return 'Formación no válida';
  const want=[{pos:'POR',n:1},{pos:'DEF',n:f.DEF},{pos:'MED',n:f.MED},{pos:'DEL',n:f.DEL}];
  const counts={POR:0,DEF:0,MED:0,DEL:0};
  const seen=new Set(); const teamCount={}; let spent=0;
  for(const s of lineup.slots){
    if(!s.id) return 'Faltan jugadores por elegir';
    const p=playerById[s.id];
    if(!p) return 'Jugador inexistente';
    if(p.pos!==s.pos) return 'Posición incorrecta';
    if(!eligibleById[s.id]) return `${p.name} no juega ese día`;
    if(seen.has(s.id)) return 'Jugador repetido';
    seen.add(s.id);
    teamCount[p.team]=(teamCount[p.team]||0)+1;
    if(teamCount[p.team]>MAX_PER_TEAM) return `Máximo ${MAX_PER_TEAM} jugadores de ${p.team}`;
    counts[p.pos]++; spent+=p.price;
  }
  for(const w of want) if(counts[w.pos]!==w.n) return 'No cuadra con la formación';
  if(spent>FAN_BUDGET) return `Te pasas del presupuesto (${spent} M)`;
  if(!lineup.captainId || !seen.has(lineup.captainId)) return 'Elige un capitán de tu 11';
  return null;
}
