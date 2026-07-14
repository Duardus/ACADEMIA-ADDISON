// Cloudflare Worker - Proxy a API Oracle (legacy _worker.js en raíz)
// Más confiable que FUNCTIONS/ para static sites

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Solo interceptar /api/*
    if (url.pathname.startsWith('/api/')) {
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
    
    // Servir assets estáticos
    return env.ASSETS.fetch(request);
  }
};
