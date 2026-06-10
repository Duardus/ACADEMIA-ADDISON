// functions/api/livekit-token.js
// (Este archivo vive en Cloudflare y crea el pase de entrada a tu servidor LiveKit en Oracle)

import { SignJWT } from '../jose.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const room = url.searchParams.get('room');
  const identity = url.searchParams.get('identity');
  const name = url.searchParams.get('name') || identity;

  if (!room || !identity) {
    return new Response(JSON.stringify({ error: 'room y identity requeridos' }), {
      status: 400, headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  // CORREGIDO: ahora lee la variable que SÍ tienes en Cloudflare
  const livekitUrl = env.NEXT_PUBLIC_LIVEKIT_URL || env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return new Response(JSON.stringify({ error: 'Faltan variables en Cloudflare' }), {
      status: 500, headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: apiKey,
    sub: identity,
    iat: now,
    nbf: now,
    exp: now + 3600,
    name,
    video: { room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true }
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(new TextEncoder().encode(apiSecret));

  return new Response(JSON.stringify({ token, url: livekitUrl, room, identity }), {
    headers: {...corsHeaders, 'Content-Type': 'application/json' }
  });
}