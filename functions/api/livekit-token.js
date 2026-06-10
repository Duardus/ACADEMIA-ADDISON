import { AccessToken } from 'livekit-server-sdk';

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
  const livekitUrl = env.NEXT_PUBLIC_LIVEKIT_URL || env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !livekitUrl) {
    return new Response(JSON.stringify({ error: 'Faltan variables en Cloudflare' }), {
      status: 500, headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: name,
      ttl: '1h'
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    });

    const token = await at.toJwt();

    return new Response(JSON.stringify({ token, url: livekitUrl, room, identity }), {
      headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error interno generando el token oficial' }), {
      status: 500, headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}