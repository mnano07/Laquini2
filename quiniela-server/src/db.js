import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FIXTURES, buildPlayers } from './data.js';
import { buildOdds } from './odds.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const DATABASE_URL = process.env.DATABASE_URL || '';

let state = null;
let pool = null;           // conexión Postgres (si hay DATABASE_URL)
let saveTimer = null;
let writing = Promise.resolve();

function seed(){
  const useApi = !!process.env.API_FOOTBALL_KEY;
  const matches = useApi ? [] : FIXTURES.map((r,i)=>{
    const id='m'+(i+1);
    return {id, providerId:null, home:r[0], away:r[1], kickoff:new Date(r[2]).toISOString(),
      group:r[3], venue:r[4], finished:false, result:null, stats:null, odds:buildOdds(id,r[0],r[1])};
  });
  return {
    users:{}, matches, bets:[], fantasy:{}, players:buildPlayers(), tx:[], sessions:{},
    meta:{ demoOpen:false, admin:null, teamIds:{}, squadDone:{}, createdAt:Date.now() }
  };
}

// Asegura que el estado cargado tenga todas las piezas (y los partidos base)
function migrate(){
  const useApi = !!process.env.API_FOOTBALL_KEY;
  if(!state.users) state.users={};
  if(!Array.isArray(state.matches)) state.matches=[];
  if(!useApi && !state.matches.length) state.matches=seed().matches;
  if(!Array.isArray(state.bets)) state.bets=[];
  if(!state.fantasy) state.fantasy={};
  if(!state.players || !state.players.length) state.players=buildPlayers();
  if(!Array.isArray(state.tx)) state.tx=[];
  if(!state.sessions) state.sessions={};
  if(!state.meta) state.meta={demoOpen:false,admin:null,createdAt:Date.now()};
  if(!state.meta.teamIds) state.meta.teamIds={};
  if(!state.meta.squadDone) state.meta.squadDone={};
  if(!useApi) ensureSeedMatches();
}

// Inicialización asíncrona: usa Postgres si hay DATABASE_URL, si no, fichero local.
export async function initDB(){
  if(DATABASE_URL){
    const pg = (await import('pg')).default;
    pool = new pg.Pool({ connectionString: DATABASE_URL, ssl:{ rejectUnauthorized:false }, max:3 });
    await pool.query('CREATE TABLE IF NOT EXISTS app_state (id int PRIMARY KEY, data jsonb NOT NULL, updated_at timestamptz DEFAULT now())');
    const r = await pool.query('SELECT data FROM app_state WHERE id=1');
    if(r.rows.length){ state = r.rows[0].data; migrate(); await writeNow(); }
    else { state = seed(); await pool.query('INSERT INTO app_state(id,data) VALUES (1,$1)', [JSON.stringify(state)]); }
    console.log('[db] Postgres conectado (datos persistentes).');
  } else {
    loadFile();
    console.log('[db] Modo fichero local en', DB_FILE);
  }
  return state;
}

function loadFile(){
  try{
    if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
    if(fs.existsSync(DB_FILE)){ state = JSON.parse(fs.readFileSync(DB_FILE,'utf8')); migrate(); writeNow(); }
    else { state = seed(); writeNow(); }
  }catch(e){ console.error('DB load error, re-seeding:', e.message); state = seed(); writeNow(); }
}

function ensureSeedMatches(){
  const byKey = {};
  state.matches.forEach(m=>{ byKey[m.home+'|'+m.away+'|'+m.kickoff.slice(0,10)] = m; });
  FIXTURES.forEach((r)=>{
    const iso=new Date(r[2]).toISOString();
    const key=r[0]+'|'+r[1]+'|'+iso.slice(0,10);
    if(!byKey[key]){
      const id='m'+(state.matches.length+1)+'-'+Date.now().toString(36);
      state.matches.push({id, providerId:null, home:r[0], away:r[1], kickoff:iso, group:r[3], venue:r[4],
        finished:false, result:null, stats:null, odds:buildOdds(id,r[0],r[1])});
    }
  });
}

export function db(){ if(!state) throw new Error('BD no inicializada'); return state; }

export function save(immediate=false){
  if(immediate){ writeNow(); return; }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeNow, 250);
}

async function writeNow(){
  writing = (async ()=>{
    try{
      if(pool){
        await pool.query('INSERT INTO app_state(id,data,updated_at) VALUES (1,$1,now()) ON CONFLICT (id) DO UPDATE SET data=$1, updated_at=now()', [JSON.stringify(state)]);
      } else {
        if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
        const tmp = DB_FILE+'.tmp';
        fs.writeFileSync(tmp, JSON.stringify(state));
        fs.renameSync(tmp, DB_FILE);
      }
    }catch(e){ console.error('DB save error:', e.message); }
  })();
  return writing;
}

// Vuelca a disco/Postgres pendientes (se usa al cerrar el proceso)
export async function flush(){ try{ await writeNow(); await writing; }catch(e){} }

// helpers
export const playerById = ()=>Object.fromEntries(db().players.map(p=>[p.id,p]));
export const matchById = (id)=>db().matches.find(m=>m.id===id);

export function addTx(user, amount, type, concept, detail){
  const s=db();
  s.tx.unshift({ id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
    user, amount:+(+amount).toFixed(2), type, concept, detail:detail||'', ts:Date.now() });
  if(s.tx.length>1500) s.tx.length=1500;
}
