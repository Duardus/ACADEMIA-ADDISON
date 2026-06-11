const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function signJwt(payload, secret) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = (obj) => btoa(JSON.stringify(obj)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  const data = `${enc(header)}.${enc(payload)}`;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const sigEnc = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
  return `${data}.${sigEnc}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, {headers:corsHeaders});

  const url = new URL(request.url);
  const room = url.searchParams.get('room');
  const identity = url.searchParams.get('identity');
  const name = url.searchParams.get('name') || identity;

  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  const livekitUrl = env.LIVEKIT_URL;

  if (!room || !identity) return new Response(JSON.stringify({error:'faltan params'}), {status:400, headers:{...corsHeaders,'Content-Type':'application/json'}});
  if (!apiKey || !apiSecret || !livekitUrl) return new Response(JSON.stringify({error:'Faltan secrets'}), {status:500, headers:{...corsHeaders,'Content-Type':'application/json'}});

  const now = Math.floor(Date.now()/1000);
  const payload = { iss: apiKey, sub: identity, name, nbf: now-5, iat: now, exp: now+3600, video:{ room, roomJoin:true, canPublish:true, canSubscribe:true } };

  const token = await signJwt(payload, apiSecret);
  return new Response(JSON.stringify({ token, url: livekitUrl }), { headers:{...corsHeaders,'Content-Type':'application/json'} });
}