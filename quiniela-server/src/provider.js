// Adaptador de datos REALES (API-FOOTBALL / api-sports.io), optimizado para el plan
// GRATIS (100 peticiones/día). Trae el calendario y los resultados, y añade fotos
// reales a los jugadores poco a poco. Si no hay clave, todo queda en modo semilla.
//
// Variables de entorno:
//   API_FOOTBALL_KEY  -> clave de tu cuenta en api-football.com (dashboard.api-football.com)
//   WC_LEAGUE_ID      -> 1 (Mundial)   ·   WC_SEASON -> 2026
import { buildOdds } from './odds.js';
import { db, save } from './db.js';

const KEY = process.env.API_FOOTBALL_KEY || '';
const BASE = 'https://v3.football.api-sports.io';
const LEAGUE = process.env.WC_LEAGUE_ID || '1';
const SEASON = process.env.WC_SEASON || '2026';

export const providerConfigured = ()=>!!KEY;

const NAME_MAP = {
  'Spain':'España','Brazil':'Brasil','Argentina':'Argentina','France':'Francia','Germany':'Alemania',
  'Uruguay':'Uruguay','Switzerland':'Suiza','Morocco':'Marruecos','Senegal':'Senegal','Qatar':'Catar',
  'Australia':'Australia','Egypt':'Egipto','Iran':'Irán','Saudi Arabia':'Arabia Saudí','Scotland':'Escocia',
  'Haiti':'Haití','Curacao':'Curazao','Curaçao':'Curazao','Cape Verde':'Cabo Verde','Cabo Verde':'Cabo Verde',
  'Algeria':'Argelia','Austria':'Austria','Jordan':'Jordania','New Zealand':'Nueva Zelanda',
  'South Africa':'Sudáfrica','South Korea':'Corea del Sur','Korea Republic':'Corea del Sur',
  'USA':'Estados Unidos','United States':'Estados Unidos'
};
const mapName = n => NAME_MAP[n] || n;
const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g,'-');

async function call(endpoint){
  const res = await fetch(BASE+endpoint, { headers:{ 'x-apisports-key': KEY } });
  if(!res.ok) throw new Error('API '+res.status+' en '+endpoint);
  const json = await res.json();
  if(json.errors && (Array.isArray(json.errors)? json.errors.length : Object.keys(json.errors).length))
    throw new Error('API: '+JSON.stringify(json.errors));
  return json.response || [];
}

// 1 sola llamada de /fixtures por ciclo: añade partidos nuevos Y marca los terminados.
export async function syncMatches(){
  if(!KEY) return {skipped:true};
  const state = db();
  if(!state.meta.teamIds) state.meta.teamIds={};
  const fixtures = await call(`/fixtures?league=${LEAGUE}&season=${SEASON}`);
  let added=0; const finished=[];
  for(const f of fixtures){
    const pid = String(f.fixture.id);
    const home = mapName(f.teams.home.name);
    const away = mapName(f.teams.away.name);
    const kickoff = new Date(f.fixture.date).toISOString();
    state.meta.teamIds[home]=f.teams.home.id;
    state.meta.teamIds[away]=f.teams.away.id;
    let m = state.matches.find(x=>x.providerId===pid)
         || state.matches.find(x=>x.home===home && x.away===away && x.kickoff.slice(0,10)===kickoff.slice(0,10));
    if(!m){
      const id='wc'+pid;
      m={id, providerId:pid, home, away, kickoff,
         group:(f.league.round||'').replace('Group ','Grupo '),
         venue:(f.fixture.venue && (f.fixture.venue.name+(f.fixture.venue.city?' · '+f.fixture.venue.city:'')))||'',
         finished:false, result:null, stats:null, odds:buildOdds(id,home,away)};
      state.matches.push(m); added++;
    }else{ m.providerId=pid; m.kickoff=kickoff; }
    const short=f.fixture.status.short;
    if(['FT','AET','PEN'].includes(short) && !m.finished){
      const hg=f.goals.home ?? 0, ag=f.goals.away ?? 0;
      let hcards=0,acards=0,corners=0,saves=0;
      try{
        const stats = await call(`/fixtures/statistics?fixture=${pid}`);
        const val=(team,type)=>{const t=stats.find(s=>s.team.id===team.id);if(!t)return 0;const it=t.statistics.find(z=>z.type===type);return Number(it&&it.value)||0;};
        hcards=val(f.teams.home,'Yellow Cards')+val(f.teams.home,'Red Cards');
        acards=val(f.teams.away,'Yellow Cards')+val(f.teams.away,'Red Cards');
        corners=val(f.teams.home,'Corner Kicks')+val(f.teams.away,'Corner Kicks');
        saves=val(f.teams.home,'Goalkeeper Saves')+val(f.teams.away,'Goalkeeper Saves');
      }catch(e){ /* sin stats: 0 (el admin puede ajustar) */ }
      m.finished=true; m.result={hg,ag,hcards,acards,corners,saves};
      finished.push(m.id);
    }
  }
  save(true);
  return {added, finished, total:fixtures.length};
}

// Añade FOTOS reales a jugadores ya existentes, poco a poco (gasta pocas peticiones).
// No crea jugadores nuevos para no descuadrar precios/plantillas del Fantasy.
export async function enrichPhotos(maxTeams=3){
  if(!KEY) return {skipped:true};
  const state = db();
  if(!state.meta.squadDone) state.meta.squadDone={};
  const teamIds = state.meta.teamIds||{};
  // equipos que juegan en los próximos 4 días y aún no tienen fotos sincronizadas
  const soon = Date.now()+4*24*3600*1000;
  const pending = [...new Set(state.matches
      .filter(m=>new Date(m.kickoff).getTime()<soon)
      .flatMap(m=>[m.home,m.away]))]
    .filter(t=>teamIds[t] && !state.meta.squadDone[t]);
  let photos=0, done=0;
  for(const team of pending.slice(0,maxTeams)){
    try{
      const squad = await call(`/players/squads?team=${teamIds[team]}`);
      const players = (squad[0] && squad[0].players) || [];
      for(const pl of players){
        const id = norm(team+'-'+pl.name);
        const ex = state.players.find(p=>p.id===id) || state.players.find(p=>norm(p.name)===norm(pl.name) && p.team===team);
        if(ex && pl.photo && !ex.photo){ ex.photo=pl.photo; ex.providerId=String(pl.id); photos++; }
      }
      state.meta.squadDone[team]=true; done++;
    }catch(e){ /* lo intentará otro día */ }
  }
  if(done) save(true);
  return {teams:done, photos};
}
