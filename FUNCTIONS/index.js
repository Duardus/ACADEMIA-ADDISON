// Fallback para /api/* si api.js no captura
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  
  if (!url.pathname.startsWith('/api/')) {
    return context.env.ASSETS.fetch(request);
  }
  
  const apiUrl = new URL('http://163.176.235.27:3000' + url.pathname + url.search);
  
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
  
  const response = await fetch(modifiedRequest);
  
  const modifiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
  
  modifiedResponse.headers.set('Access-Control-Allow-Origin', 'https://academia-addison.pages.dev');
  modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  modifiedResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  modifiedResponse.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return modifiedResponse;
}
