# 🏆 La Quiniela del Mundial 2026 (versión con servidor)

Apuestas sin dinero entre amigos, casino, Fantasy y ranking — **compartido de verdad**: lo
subes **una vez** y todos tus amigos entran al **mismo enlace** y ven lo mismo (mismos
partidos, mismo ranking, mismos movimientos). Incluye **registro de movimientos**, **rol de
administrador** (contraseña por defecto **051909**), **avisos por Telegram** y **actualización
automática de partidos y resultados** desde una API de fútbol.

> Importante: enviar el archivo HTML suelto **no** sirve para jugar juntos. Para compartir de
> verdad hay que **desplegar este servidor** y repartir su enlace.

---

## ✅ Qué hace cada cosa

- **Cuentas y saldos** en el servidor (todos empiezan con 100 €).
- **Partidos como menú** → entras y ves todos los mercados (1X2, ambos marcan, goles, margen,
  ambos reciben tarjeta, tarjetas, córners, paradas) y montas **combinadas**.
- **Casino**: salas de **Ruleta** y **Blackjack** (resultados calculados en el servidor).
- **Fantasy por jornadas**: 11 por día, 100 M de presupuesto, máx. 5 por selección, capitán ×2,
  abre **2 días antes**, puntos automáticos al estilo SofaScore (o reales si conectas la API).
- **Registro de movimientos**: el dinero que gana/pierde cada uno (apuestas, ruleta, blackjack)
  y el dinero/bonos que mete el administrador, con **+ en verde** y **− en rojo**.
- **Administrador** (contraseña 051909): pre-registra participantes, mete dinero, da bonos
  (por ejemplo por ganar una jornada del Fantasy), introduce resultados y abre el "modo libre".
- **Telegram**: te llega un mensaje al móvil cuando alguien se registra (token oculto y seguro).
- **Auto-actualización**: cada pocos minutos sincroniza partidos/resultados; la web de cada
  amigo se refresca sola sin recargar.

---

## 🚀 Probarlo en tu ordenador (5 min)

1. Instala **Node.js 18 o superior** desde https://nodejs.org
2. Abre una terminal en esta carpeta y ejecuta:
   ```
   npm install
   npm start
   ```
3. Abre http://localhost:3000 en el navegador.
4. Entra como **Administrador** (contraseña **051909**) o crea un **Participante**.

Sin claves de Telegram/API funciona igual: usa los partidos incluidos y los resultados se
meten a mano en el panel de Admin.

---

## 🌐 Subirlo a internet para jugar con amigos (recomendado: Render o Railway)

### Opción GRATIS (Render gratis + base de datos Neon gratis)
La base de datos va en **Neon** (Postgres gratis y permanente) y el servidor en el plan
**gratis** de Render. Coste: 0 €. Único "pero": el servidor gratis se duerme tras 15 min
sin uso, así que la primera visita tras un rato tarda ~1 minuto en despertar.

1. **Crea la base de datos en Neon:**
   - Entra en https://neon.tech y regístrate (gratis, con Google/GitHub).
   - **Create project** (deja lo de por defecto, región Europa si puedes).
   - Te muestra una **Connection string** tipo `postgresql://usuario:clave@...neon.tech/...`.
     Pulsa **Copy** y guárdala.
2. **Sube el código a GitHub** (igual que en la guía de abajo, Parte B).
3. **En Render:** New + → **Web Service** → tu repo. Build `npm install`, Start `npm start`,
   e **Instance Type: Free**.
4. En **Environment Variables** añade:
   - `DATABASE_URL` = *(la connection string de Neon)*
   - `ADMIN_PASSWORD` = `051909`
   - `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` (opcional, ver más abajo)
   - **No** añadas disco ni `DATA_DIR`: los datos viven en Neon.
5. **Create Web Service**. Cuando ponga *Live*, comparte la URL.

> Con Neon, aunque el servidor gratis se reinicie, **no se pierde nada** (saldos, apuestas,
> fantasy y movimientos siguen ahí).



Estos servicios tienen plan gratuito y despliegan desde GitHub o subiendo la carpeta.

### Opción A — Render (https://render.com)
**Lo más fácil: con el Blueprint incluido (`render.yaml`).**
1. Sube el código a GitHub (Parte B, más abajo).
2. En Render: **New +  →  Blueprint  →** conecta tu repo. Render lee `render.yaml` y
   prepara el servicio **Starter (7 $/mes)** con su **disco** de 1 GB y casi todas las
   variables ya puestas.
3. Te pedirá rellenar solo: `API_FOOTBALL_KEY` (tu clave) y, si quieres, `TELEGRAM_BOT_TOKEN`
   y `TELEGRAM_CHAT_ID`. Pulsa **Apply**.
4. Cuando esté **Live**, comparte la URL. (Contraseña de admin: **051909**.)

**A mano (sin Blueprint):**
1. Sube esta carpeta a un repositorio de GitHub (o usa "Deploy from Git").
2. En Render: **New → Web Service** → elige el repo.
3. Build Command: `npm install` · Start Command: `npm start`.
4. En **Environment** añade las variables (ver abajo). Como mínimo nada es obligatorio.
5. **Importante**: para que no se borre la base de datos en cada despliegue, añade un
   **Disk** (Render → Disks) montado en `/opt/render/project/src/data` y pon la variable
   `DATA_DIR=/opt/render/project/src/data`.
6. Deploy. Te dan una URL tipo `https://tuquiniela.onrender.com` → ese es el enlace que
   repartes a tus amigos.

### Opción B — Railway (https://railway.app)
1. **New Project → Deploy from GitHub repo** (o sube la carpeta).
2. Añade un **Volume** y monta en `/app/data`, con variable `DATA_DIR=/app/data`.
3. Añade las variables de entorno y despliega. Railway te da la URL pública.

### Opción C — Tu propio servidor (VPS)
```
npm install
npm install -g pm2
pm2 start src/server.js --name quiniela
pm2 save
```
Pon un dominio/proxy (Nginx) delante si quieres HTTPS.

---

## 🔧 Variables de entorno

Copia `.env.example` a `.env` (o ponlas en el panel del hosting):

| Variable | Para qué |
|---|---|
| `ADMIN_PASSWORD` | Contraseña del administrador (por defecto **051909**) |
| `TELEGRAM_BOT_TOKEN` | Token de tu bot (con @BotFather) |
| `TELEGRAM_CHAT_ID` | Tu chat ID (con @userinfobot) |
| `API_FOOTBALL_KEY` | Clave de api-sports.io para datos y **fotos reales** |
| `WC_LEAGUE_ID` / `WC_SEASON` | Liga (Mundial = 1) y temporada (2026) |
| `DATA_DIR` | Carpeta persistente de la base de datos |

---

## 📲 Telegram en 2 minutos
1. En Telegram abre **@BotFather** → `/newbot` → te da un **token**.
2. Abre **@userinfobot** → te da tu **chat ID** (un número).
3. Pon ambos en las variables y reinicia. Listo: cada registro te llega al móvil.

## ⚽ Datos y fotos reales (opcional)
1. Crea cuenta en **https://www.api-football.com** y copia tu **API key**.
2. Ponla en `API_FOOTBALL_KEY`. El servidor traerá calendario, resultados y fotos solo.
3. Nota: el plan gratuito tiene límite de peticiones; para el Mundial entero puede que
   necesites un plan de pago. Sin API, todo sigue funcionando con datos incluidos.

---

## 🛡️ Notas
- El token de Telegram y la clave de la API viven **solo en el servidor**: nunca llegan al
  navegador de tus amigos.
- Las plantillas de jugadores y los precios incluidos son reales y editables (`src/data.js`).
  Si conectas la API, se añaden fotos y jugadores que falten.
- Los puntos del Fantasy, sin la API con estadísticas por jugador, son una simulación
  determinista coherente con el resultado (mismo número para todos).
