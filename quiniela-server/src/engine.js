import { db, save, addTx } from './db.js';
import { resultFor } from './odds.js';

export function matchStatus(m){
  if(m.finished) return 'finished';
  if(db().meta.demoOpen) return 'open';
  const ko=new Date(m.kickoff).getTime(), now=Date.now(), dayBefore=ko-24*3600*1000;
  if(now<dayBefore) return 'upcoming';
  if(now<ko) return 'open';
  return 'live';
}

function evalSel(sel){
  const m=db().matches.find(x=>x.id===sel.mid);
  if(!m || !m.finished) return 'pending';
  return resultFor(m.result, sel.market)===sel.sel ? 'won' : 'lost';
}

function betDetail(b){
  const legs=b.selections.map(s=>s.selLabel).join(' + ');
  return `${b.type==='combinada'?'Combinada':'Apuesta'}: ${legs} · ${b.stake.toFixed(2)}€ @ ${b.totalOdd.toFixed(2)}`;
}

// Liquida todas las apuestas pendientes que ya se pueden resolver. Devuelve nº liquidadas.
export function settleBets(){
  const state=db(); let count=0;
  for(const b of state.bets){
    if(b.status!=='pending') continue;
    const states=b.selections.map(evalSel);
    if(states.includes('lost')){
      b.status='lost'; count++;
      addTx(b.user, -b.stake, 'bet_lose', 'Apuesta perdida', betDetail(b));
    }
    else if(states.every(s=>s==='won')){
      b.status='won';
      const u=state.users[b.user];
      const net=+(b.stake*b.totalOdd - b.stake).toFixed(2);
      if(u) u.balance=+((u.balance + b.stake*b.totalOdd).toFixed(2));
      addTx(b.user, net, 'bet_win', 'Apuesta ganada', betDetail(b));
      count++;
    }
  }
  if(count) save(true);
  return count;
}

export { evalSel };
