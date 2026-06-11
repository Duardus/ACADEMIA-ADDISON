export async function onRequest(context) {
  const { env } = context;
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  
  try {
    const url = new URL(context.request.url);
    const room = url.searchParams.get('room') || 'test';
    const identity = url.searchParams.get('identity') || 'test';
    
    // 1. Verifica secrets
    if (!env.LIVEKIT_API_KEY) throw new Error('Falta LIVEKIT_API_KEY');
    if (!env.LIVEKIT_API_SECRET) throw new Error('Falta LIVEKIT_API_SECRET');
    if (!env.LIVEKIT_URL) throw new Error('Falta LIVEKIT_URL');

    // 2. Crea token simple
    const now = Math.floor(Date.now()/1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = { 
      iss: env.LIVEKIT_API_KEY, 
      sub: identity, 
      iat: now, 
      exp: now+3600,
      video: { room, roomJoin: true }
    };

    const enc = obj => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const data = `${enc(header)}.${enc(payload)}`;
    
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.LIVEKIT_API_SECRET), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    
    const token = `${data}.${sigB64}`;
    
    return new Response(JSON.stringify({ ok:true, token, url: env.LIVEKIT_URL }), { headers: cors });
    
  } catch (e) {
    // ESTO es lo importante: ahora verás el error real
    return new Response(JSON.stringify({ 
      error: e.message, 
      stack: e.stack,
      hasKey: !!env.LIVEKIT_API_KEY,
      hasSecret: !!env.LIVEKIT_API_SECRET,
      hasUrl: !!env.LIVEKIT_URL
    }), { status: 500, headers: cors });
  }
}