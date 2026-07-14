// ═══════════════════════════════════════════════════════════════════════════
// Cloudflare Pages Function - Proxy a API Oracle
// Ruta: /api/*  →  proxy a http://163.176.235.27:3000/api/*
// ═══════════════════════════════════════════════════════════════════════════

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  // Construir URL del backend Oracle
  const apiUrl = new URL('http://163.176.235.27:3000' + url.pathname + url.search);
  
  // Crear nuevo request con headers del original
  const modifiedRequest = new Request(apiUrl, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers),
      'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
      'X-Forwarded-Proto': 'https',
      'Origin': 'https://academia-addison.pages.dev'
    },
    body: request.body
  });
  
  // Hacer fetch al backend y devolver respuesta
  const response = await fetch(modifiedRequest);
  
  // Crear nueva respuesta con headers CORS
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  // Agregar CORS headers
  modifiedResponse.headers.set('Access-Control-Allow-Origin', 'https://academia-addison.pages.dev');
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  modifiedResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return modifiedResponse;
}
