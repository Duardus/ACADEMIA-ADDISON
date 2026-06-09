// functions/api/livekit-token.js
// Genera tokens de LiveKit firmados con HS256
// Requiere variables de entorno en Cloudflare:
// LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL

import { SignJWT } from 'jose';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const room = url.searchParams.get('room');
  const identity = url.searchParams.get('identity');
  const name = url.searchParams.get('name') || identity;

  if (!room ||!identity) {
    return new Response(JSON.stringify({ error: 'room y identity requeridos' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  const livekitUrl = env.LIVEKIT_URL || 'wss://163.176.235.27:7880';

  if (!apiKey ||!apiSecret) {
    return new Response(JSON.stringify({ error: 'API Key/Secret no configurados' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 hora

  const payload = {
    iss: apiKey,
    sub: identity,
    nbf: now,
    exp: exp,
    name: name,
    video: {
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    }
  };

  const secret = new TextEncoder().encode(apiSecret);
  const token = await new SignJWT(payload)
   .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
   .sign(secret);

  return new Response(JSON.stringify({
    token,
    url: livekitUrl,
    room,
    identity
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}