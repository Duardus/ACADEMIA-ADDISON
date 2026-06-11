/**
 * ACADEMIA ADDISON - LiveKit Token Generator
 * Cloudflare Pages Function
 * 
 * === NO MODIFICAR LÓGICA DE FIRMA ===
 * Usa WebCrypto API nativa de Cloudflare Workers
 */

export async function onRequest({ request, env }) {
  // CORS para desarrollo
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    const url = new URL(request.url);
    const room = url.searchParams.get('room') || 'default';
    const identity = url.searchParams.get('identity') || 'guest';
    const name = url.searchParams.get('name') || identity;
    const isTeacher = url.searchParams.get('role') === 'teacher' || identity.includes('profesor') || identity.includes('eduardofloreshu');

    // === PAYLOAD JWT - ESTÁNDAR LIVEKIT ===
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: env.LIVEKIT_API_KEY,      // API Key
      sub: identity,                  // Usuario
      name: name,
      iat: now,
      exp: now + 7200,               // 2 horas (estándar clases)
      // Permisos granulares
      video: {
        room: room,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        // Profesores pueden moderar
        roomAdmin: isTeacher,
        roomCreate: isTeacher,
      },
      // Metadata para UI
      metadata: JSON.stringify({
        role: isTeacher ? 'teacher' : 'student',
        joinedAt: now
      })
    };

    // === FIRMA HS256 - NO MODIFICAR ===
    const header = { alg: 'HS256', typ: 'JWT' };
    const encode = obj => btoa(JSON.stringify(obj))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const data = `${encode(header)}.${encode(payload)}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(env.LIVEKIT_API_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
    const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const token = `${data}.${sig}`;

    return new Response(JSON.stringify({
      token,
      url: env.LIVEKIT_URL,
      identity,
      room
    }), { headers: cors });

  } catch (e) {
    return new Response(JSON.stringify({ 
      error: e.message,
      hint: 'Verifica LIVEKIT_API_KEY y LIVEKIT_API_SECRET en Cloudflare'
    }), { status: 500, headers: cors });
  }
}
