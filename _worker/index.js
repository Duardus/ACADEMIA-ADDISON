// Cloudflare Pages Function - Proxy a API Oracle
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Solo redirigir /api/* al backend
    if (url.pathname.startsWith('/api/')) {
      // Reemplazar con tu IP de Oracle
      const apiUrl = 'http://163.176.235.27:3000' + url.pathname + url.search;
      
      const modifiedRequest = new Request(apiUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers),
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP'),
          'Origin': 'https://academia-addison.pages.dev'
        },
        body: request.body
      });
      
      return await fetch(modifiedRequest);
    }
    
    // Servir el sitio estático normalmente
    return env.ASSETS.fetch(request);
  }
};
