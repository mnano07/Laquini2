import { STR } from './data.js';

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const MARGIN=0.07;
const oddFromProb=p=>Math.max(1.02,+(1/(p*(1+MARGIN))).toFixed(2));
const normalize=o=>{const s=Object.values(o).reduce((a,b)=>a+b,0);const r={};for(const k in o)r[k]=o[k]/s;return r;};
const jitter=(base,rnd)=>{const o={};for(const k in base)o[k]=base[k]*(0.85+rnd()*0.3);return normalize(o);};
const strength=t=>STR[t]||60;

const GOAL_BANDS={'0-1':0.27,'2-3':0.46,'4-5':0.20,'6+':0.07};
const MARGIN_BANDS={'Empate':0.26,'Por 1 gol':0.34,'Por 2 goles':0.22,'Por 3+':0.18};
const CORNER_BANDS={'≤ 8':0.34,'9 - 11':0.40,'12+':0.26};
const CARD_BANDS={'≤ 2':0.30,'3 - 4':0.42,'5+':0.28};
const BTTS_BANDS={'Sí':0.54,'No':0.46};
const BOTHCARDS_BANDS={'Sí':0.60,'No':0.40};
const SAVES_BANDS={'≤ 5':0.33,'6 - 9':0.42,'10+':0.25};

export const MARKETS=[
  {key:'winner',label:'Ganador del partido',cols:3,special:true},
  {key:'btts',label:'Ambos equipos marcan',cols:2},
  {key:'goals',label:'Número total de goles',cols:4},
  {key:'margin',label:'Margen de victoria',cols:4},
  {key:'bothCards',label:'Ambos reciben tarjeta',cols:2},
  {key:'cards',label:'Total de tarjetas',cols:3},
  {key:'corners',label:'Total de córners',cols:3},
  {key:'saves',label:'Total de paradas (ambos porteros)',cols:3},
];
export const MK_LABEL=Object.fromEntries(MARKETS.map(m=>[m.key,m.label]));

export function buildOdds(matchId, home, away){
  const rnd=mulberry32(hashStr(matchId));
  const sh=strength(home)*1.12, sa=strength(away); const expH=sh/(sh+sa);
  const p=normalize({'1':expH*0.74,'X':0.26,'2':(1-expH)*0.74});
  const winner={'1':oddFromProb(p['1']),'X':oddFromProb(p['X']),'2':oddFromProb(p['2'])};
  const mk=base=>{const pp=jitter(base,rnd);const o={};for(const k in pp)o[k]=oddFromProb(pp[k]);return o;};
  return {winner,btts:mk(BTTS_BANDS),goals:mk(GOAL_BANDS),margin:mk(MARGIN_BANDS),bothCards:mk(BOTHCARDS_BANDS),cards:mk(CARD_BANDS),corners:mk(CORNER_BANDS),saves:mk(SAVES_BANDS)};
}

// Resultado ganador de un mercado dado el resultado real {hg,ag,hcards,acards,corners,saves}
export function resultFor(r, market){
  if(!r) return null;
  if(market==='winner')return r.hg>r.ag?'1':r.hg<r.ag?'2':'X';
  if(market==='btts')return(r.hg>=1&&r.ag>=1)?'Sí':'No';
  if(market==='goals'){const t=r.hg+r.ag;return t<=1?'0-1':t<=3?'2-3':t<=5?'4-5':'6+';}
  if(market==='margin'){const d=Math.abs(r.hg-r.ag);return d===0?'Empate':d===1?'Por 1 gol':d===2?'Por 2 goles':'Por 3+';}
  if(market==='bothCards'){ if(r.hcards==null||r.acards==null) return null; return(r.hcards>=1&&r.acards>=1)?'Sí':'No'; }
  if(market==='cards'){ if(r.hcards==null||r.acards==null) return null; const c=r.hcards+r.acards;return c<=2?'≤ 2':c<=4?'3 - 4':'5+'; }
  if(market==='corners'){ if(r.corners==null) return null; const c=r.corners;return c<=8?'≤ 8':c<=11?'9 - 11':'12+'; }
  if(market==='saves'){ if(r.saves==null) return null; const s=r.saves;return s<=5?'≤ 5':s<=9?'6 - 9':'10+'; }
  return null;
}
export { mulberry32, hashStr };
