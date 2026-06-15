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

function legState(sel){
  const m=db().matches.find(x=>x.id===sel.mid);
  if(!m || !m.finished) return 'pending';
  const r=resultFor(m.result, sel.market);
  if(r==null) return (m.result && m.result.statsFinal) ? 'void' : 'pending'; // sin dato: espera al admin; si cerró sin dato -> anulada
  return r===sel.sel ? 'won' : 'lost';
}

function betDetail(b){
  const legs=b.selections.map(s=>s.selLabel).join(' + ');
  return `${b.type==='combinada'?'Combinada':'Apuesta'}: ${legs} · ${b.stake.toFixed(2)}€ @ ${b.totalOdd.toFixed(2)}`;
}

// Liquida apuestas. Selecciones sin datos = anuladas (cuota 1.0). Devuelve nº liquidadas.
export function settleBets(){
  const state=db(); let count=0;
  for(const b of state.bets){
    if(b.status!=='pending') continue;
    const states=b.selections.map(legState);
    if(states.includes('pending')) continue;          // aún no se puede resolver
    const u=state.users[b.user];
    if(states.includes('lost')){
      b.status='lost'; count++;
      addTx(b.user, -b.stake, 'bet_lose', 'Apuesta perdida', betDetail(b));
    } else if(states.includes('won')){
      b.status='won';
      // gana en las patas acertadas; las anuladas cuentan como cuota 1.0
      const effOdd = +b.selections.reduce((a,s,i)=> a*(states[i]==='won'? s.odd : 1), 1).toFixed(2);
      if(u) u.balance=+((u.balance + b.stake*effOdd).toFixed(2));
      const profit=+(b.stake*effOdd - b.stake).toFixed(2);
      const voided = states.includes('void');
      addTx(b.user, profit, 'bet_win', 'Apuesta ganada', betDetail(b)+(voided?' (con selección anulada)':''));
      count++;
    } else {
      // todas anuladas -> devolución íntegra
      b.status='void';
      if(u) u.balance=+((u.balance + b.stake).toFixed(2));
      addTx(b.user, 0, 'bet_void', 'Apuesta anulada (devuelta)', betDetail(b));
      count++;
    }
  }
  if(count) save(true);
  return count;
}

export { legState as evalSel };
