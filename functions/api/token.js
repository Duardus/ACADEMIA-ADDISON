export async function onRequest({ request, env }) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  try {
    const url = new URL(request.url);
    const room = url.searchParams.get('room');
    const identity = url.searchParams.get('identity');
    const name = url.searchParams.get('name') || identity;

    const now = Math.floor(Date.now()/1000);
    const header = { alg:'HS256', typ:'JWT' };
    const payload = {
      iss: env.LIVEKIT_API_KEY,
      sub: identity,
      name,
      iat: now,
      exp: now + 3600,
      video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true }
    };

    const enc = o => btoa(JSON.stringify(o)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const data = `${enc(header)}.${enc(payload)}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.LIVEKIT_API_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sig64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    
    return new Response(JSON.stringify({ token: `${data}.${sig64}`, url: env.LIVEKIT_URL }), { headers: cors });
  } catch(e) {
    return new Response(JSON.stringify({error:e.message}), {status:500, headers:cors});
  }
}