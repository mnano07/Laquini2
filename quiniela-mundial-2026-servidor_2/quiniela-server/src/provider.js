// Fuente de datos REALES. Soporta dos proveedores (elige según la variable que pongas):
//   · FOOTBALL_DATA_TOKEN  -> football-data.org  (GRATIS, incluye el Mundial 2026)  ← recomendado
//   · API_FOOTBALL_KEY     -> api-sports.io      (el plan gratis NO tiene 2026; necesita pago)
// Las CUOTAS las genera la app (no vienen de la API). Lo que el proveedor no dé
// (tarjetas, córners, paradas) queda sin dato -> esas apuestas se anulan y se devuelven.
import { buildOdds } from './odds.js';
import { db, save } from './db.js';

const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN || '';
const AF_KEY   = process.env.API_FOOTBALL_KEY || '';
const MODE = FD_TOKEN ? 'fd' : (AF_KEY ? 'af' : 'none');

export const providerConfigured = ()=> MODE!=='none';
export const providerName = ()=> MODE==='fd' ? 'football-data.org' : (MODE==='af' ? 'API-Football' : 'ninguno');

// inglés -> español (para que cuadren banderas/fuerza/plantillas de la app)
const NAME_MAP = {
  'Spain':'España','Brazil':'Brasil','Argentina':'Argentina','France':'Francia','Germany':'Alemania',
  'England':'Inglaterra','Portugal':'Portugal','Netherlands':'Países Bajos','Holland':'Países Bajos',
  'Belgium':'Bélgica','Italy':'Italia','Croatia':'Croacia','Uruguay':'Uruguay','Colombia':'Colombia',
  'Mexico':'México','United States':'Estados Unidos','USA':'Estados Unidos','Canada':'Canadá',
  'Switzerland':'Suiza','Denmark':'Dinamarca','Morocco':'Marruecos','Senegal':'Senegal','Japan':'Japón',
  'South Korea':'Corea del Sur','Korea Republic':'Corea del Sur','Australia':'Australia','Qatar':'Catar',
  'Saudi Arabia':'Arabia Saudí','Iran':'Irán','Egypt':'Egipto','Ghana':'Ghana','Nigeria':'Nigeria',
  'Cameroon':'Camerún','Ivory Coast':'Costa de Marfil',"Cote d'Ivoire":'Costa de Marfil','Algeria':'Argelia',
  'Tunisia':'Túnez','South Africa':'Sudáfrica','Cape Verde':'Cabo Verde','Ecuador':'Ecuador','Peru':'Perú',
  'Paraguay':'Paraguay','Chile':'Chile','Costa Rica':'Costa Rica','Panama':'Panamá','Honduras':'Honduras',
  'Jamaica':'Jamaica','Haiti':'Haití','Curacao':'Curazao','Poland':'Polonia','Austria':'Austria',
  'Scotland':'Escocia','Wales':'Gales','Norway':'Noruega','Sweden':'Suecia','Serbia':'Serbia',
  'Turkey':'Turquía','Türkiye':'Turquía','Ukraine':'Ucrania','Greece':'Grecia','Czech Republic':'Chequia',
  'Czechia':'Chequia','Hungary':'Hungría','Romania':'Rumanía','Slovakia':'Eslovaquia','Slovenia':'Eslovenia',
  'New Zealand':'Nueva Zelanda','Uzbekistan':'Uzbekistán','Jordan':'Jordania','Iraq':'Irak','UAE':'EAU',
  'Bolivia':'Bolivia','Venezuela':'Venezuela','DR Congo':'R.D. Congo','Mali':'Malí'
};
const mapName = n => (n && NAME_MAP[n]) || n;
const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-');

const FD_STAGE = { GROUP_STAGE:'Fase de grupos', LAST_32:'1/16', LAST_16:'Octavos',
  QUARTER_FINALS:'Cuartos', SEMI_FINALS:'Semifinales', THIRD_PLACE:'3.º y 4.º', FINAL:'Final' };

export async function syncMatches(){
  if(MODE==='fd') return syncFootballData();
  if(MODE==='af') return syncApiFootball();
  return {skipped:true};
}
export async function enrichPhotos(maxTeams=3){
  if(MODE==='af') return enrichApiFootball(maxTeams);
  return {skipped:true}; // football-data gratis no da plantillas con foto
}

/* ---------- football-data.org (GRATIS) ---------- */
async function syncFootballData(){
  const comp = process.env.FD_COMPETITION || 'WC';
  const res = await fetch(`https://api.football-data.org/v4/competitions/${comp}/matches`, { headers:{ 'X-Auth-Token': FD_TOKEN } });
  if(!res.ok){ const t=await res.text().catch(()=> ''); throw new Error('football-data '+res.status+' '+t.slice(0,120)); }
  const json = await res.json();
  const list = json.matches || [];
  const state = db(); let added=0; const finished=[];
  for(const f of list){
    const hn=f.homeTeam&&f.homeTeam.name, an=f.awayTeam&&f.awayTeam.name;
    if(!hn||!an) continue;                       // eliminatoria aún sin definir equipos
    const pid='fd'+f.id;
    const home=mapName(hn), away=mapName(an);
    const kickoff=new Date(f.utcDate).toISOString();
    const grp = f.group ? f.group.replace('GROUP_','Grupo ') : (FD_STAGE[f.stage]||'');
    let m = state.matches.find(x=>x.providerId===pid)
         || state.matches.find(x=>x.home===home && x.away===away && x.kickoff.slice(0,10)===kickoff.slice(0,10));
    if(!m){
      const id=pid;
      m={id, providerId:pid, home, away, kickoff, group:grp, venue:'',
         finished:false, result:null, stats:null, odds:buildOdds(id,home,away)};
      state.matches.push(m); added++;
    } else { m.providerId=pid; m.kickoff=kickoff; if(grp) m.group=grp; }
    const done = (f.status==='FINISHED' || f.status==='AWARDED');
    if(done && !m.finished){
      const ft=f.score&&f.score.fullTime||{};
      const hg=ft.home ?? 0, ag=ft.away ?? 0;
      m.finished=true;
      m.result={ hg, ag, hcards:null, acards:null, corners:null, saves:null }; // sin stats -> esas apuestas se anulan
      finished.push(m.id);
    }
  }
  save(true);
  return { source:'fd', added, finished, total:list.length };
}

/* ---------- API-Football (api-sports.io) ---------- */
const AF_BASE='https://v3.football.api-sports.io';
const AF_LEAGUE=process.env.WC_LEAGUE_ID||'1';
const AF_SEASON=process.env.WC_SEASON||'2026';
async function afCall(endpoint){
  const res=await fetch(AF_BASE+endpoint,{headers:{'x-apisports-key':AF_KEY}});
  if(!res.ok) throw new Error('API '+res.status+' en '+endpoint);
  const json=await res.json();
  if(json.errors && (Array.isArray(json.errors)?json.errors.length:Object.keys(json.errors).length))
    throw new Error('API: '+JSON.stringify(json.errors));
  return json.response||[];
}
async function syncApiFootball(){
  const state=db(); if(!state.meta.teamIds) state.meta.teamIds={};
  const fixtures=await afCall(`/fixtures?league=${AF_LEAGUE}&season=${AF_SEASON}`);
  let added=0; const finished=[];
  for(const f of fixtures){
    const pid=String(f.fixture.id);
    const home=mapName(f.teams.home.name), away=mapName(f.teams.away.name);
    const kickoff=new Date(f.fixture.date).toISOString();
    state.meta.teamIds[home]=f.teams.home.id; state.meta.teamIds[away]=f.teams.away.id;
    let m=state.matches.find(x=>x.providerId===pid)
       || state.matches.find(x=>x.home===home&&x.away===away&&x.kickoff.slice(0,10)===kickoff.slice(0,10));
    if(!m){ const id='wc'+pid;
      m={id,providerId:pid,home,away,kickoff,group:(f.league.round||'').replace('Group ','Grupo '),
         venue:(f.fixture.venue&&f.fixture.venue.name)||'',finished:false,result:null,stats:null,odds:buildOdds(id,home,away)};
      state.matches.push(m); added++;
    } else { m.providerId=pid; m.kickoff=kickoff; }
    if(['FT','AET','PEN'].includes(f.fixture.status.short) && !m.finished){
      const hg=f.goals.home??0, ag=f.goals.away??0; let hcards=0,acards=0,corners=0,saves=0;
      try{ const stats=await afCall(`/fixtures/statistics?fixture=${pid}`);
        const val=(team,type)=>{const t=stats.find(s=>s.team.id===team.id);if(!t)return 0;const it=t.statistics.find(z=>z.type===type);return Number(it&&it.value)||0;};
        hcards=val(f.teams.home,'Yellow Cards')+val(f.teams.home,'Red Cards');
        acards=val(f.teams.away,'Yellow Cards')+val(f.teams.away,'Red Cards');
        corners=val(f.teams.home,'Corner Kicks')+val(f.teams.away,'Corner Kicks');
        saves=val(f.teams.home,'Goalkeeper Saves')+val(f.teams.away,'Goalkeeper Saves');
        m.result={hg,ag,hcards,acards,corners,saves};
      }catch(e){ m.result={hg,ag,hcards:null,acards:null,corners:null,saves:null}; }
      m.finished=true; finished.push(m.id);
    }
  }
  save(true);
  return {source:'af', added, finished, total:fixtures.length};
}
async function enrichApiFootball(maxTeams){
  const state=db(); if(!state.meta.squadDone) state.meta.squadDone={};
  const teamIds=state.meta.teamIds||{};
  const soon=Date.now()+4*24*3600*1000;
  const pending=[...new Set(state.matches.filter(m=>new Date(m.kickoff).getTime()<soon).flatMap(m=>[m.home,m.away]))]
    .filter(t=>teamIds[t]&&!state.meta.squadDone[t]);
  let photos=0,done=0;
  for(const team of pending.slice(0,maxTeams)){
    try{ const squad=await afCall(`/players/squads?team=${teamIds[team]}`);
      const players=(squad[0]&&squad[0].players)||[];
      for(const pl of players){ const id=norm(team+'-'+pl.name);
        const ex=state.players.find(p=>p.id===id)||state.players.find(p=>norm(p.name)===norm(pl.name)&&p.team===team);
        if(ex&&pl.photo&&!ex.photo){ ex.photo=pl.photo; photos++; } }
      state.meta.squadDone[team]=true; done++;
    }catch(e){}
  }
  if(done) save(true);
  return {teams:done, photos};
}
