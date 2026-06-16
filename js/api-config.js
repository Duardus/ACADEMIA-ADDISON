// ============================================
// CONFIGURACION API ACADEMIA ADDISON v3.0
// ============================================

const API_CONFIG = {
  // URL del backend (tu servidor Oracle)
  // NOTA: Si usas HTTPS en el frontend, el navegador bloquea HTTP.
  // Solucion: Configurar Caddy/Cloudflare Tunnel para HTTPS en el backend.
  // Por ahora, para desarrollo local funciona. Para produccion necesita HTTPS.
  BASE_URL: 'http://163.176.235.27:3000/api/v1',
  
  // Headers por defecto
  getHeaders: function() {
    const token = localStorage.getItem('token_addison');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    };
  }
};
