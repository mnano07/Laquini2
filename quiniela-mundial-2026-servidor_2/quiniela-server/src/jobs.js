import cron from 'node-cron';
import { providerConfigured, syncMatches, enrichPhotos } from './provider.js';
import { settleBets } from './engine.js';
import { tgNotify } from './telegram.js';

const SYNC_MIN = Math.max(5, parseInt(process.env.SYNC_MINUTES||'30',10));
let running=false;

async function tick(label){
  if(running) return; running=true;
  try{
    if(providerConfigured()){
      const m = await syncMatches().catch(e=>({error:e.message}));
      const n = settleBets();
      const ph = await enrichPhotos(3).catch(e=>({error:e.message}));
      console.log(`[sync ${label}] partidos=${JSON.stringify(m)} liquidadas=${n} fotos=${JSON.stringify(ph)}`);
      if(m && m.finished && m.finished.length && n>0) tgNotify(`📊 Resultados actualizados: ${m.finished.length} partido(s) · ${n} apuesta(s) liquidada(s).`);
    }else{
      const n = settleBets();
      if(n) console.log(`[sync ${label}] liquidadas=${n}`);
    }
  }catch(e){ console.error('[sync] error', e.message); }
  finally{ running=false; }
}

export function startJobs(){
  tick('arranque');
  cron.schedule(`*/${SYNC_MIN} * * * *`, ()=>tick('cron'));
  console.log(`[jobs] sincronización cada ${SYNC_MIN} min (provider=${providerConfigured()})`);
}
