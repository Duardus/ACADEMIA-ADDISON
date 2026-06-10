// functions/api/livekit-token.js
// Generador de tokens puro mediante WebCrypto nativo (Sin librerías externas = Cero errores de Cloudflare)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Función auxiliar nativa para firmar en formato HMAC SHA256 requerido por LiveKit
async function signJwt(payload, secret) {
  const encoder = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const dataToSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const keyData = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

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

  const now = Math.floor(Date.now() / 1000);
  
  // Estructura de Payload corregida según los estándares estrictos de LiveKit Server
  const payload = {
    iss: apiKey,
    sub: identity,
    nbf: now - 5, // Margen de 5 segundos por retrasos de reloj
    iat: now,
    exp: now + 3600, // Expira en 1 hora
    name: name,
    video: {
      room: room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    }
  };

  try {
    // Firmamos de manera nativa usando el motor de Cloudflare
    const token = await signJwt(payload, apiSecret);

    return new Response(JSON.stringify({ token, url: livekitUrl, room, identity }), {
      headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error criptográfico nativo' }), {
      status: 500, headers: {...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}