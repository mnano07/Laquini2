// El token y el chat se leen de variables de entorno: NUNCA viajan al navegador.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT  = process.env.TELEGRAM_CHAT_ID || '';

export async function tgNotify(text){
  if(!TOKEN || !CHAT){ console.log('[telegram] sin configurar; mensaje:', text); return false; }
  try{
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ chat_id: CHAT, text, parse_mode:'HTML' })
    });
    if(!res.ok) console.error('[telegram] error', res.status, await res.text());
    return res.ok;
  }catch(e){ console.error('[telegram] fallo', e.message); return false; }
}
export const tgConfigured = ()=>!!(TOKEN && CHAT);
