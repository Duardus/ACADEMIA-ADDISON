/* ============================================
   📡 CONFIGURACIÓN API - Academia Addison
   ============================================ */

var API_CONFIG = {
  // URL relativa - el Worker proxy redirige al backend
  BASE_URL: '/api/v1',
  
  TIMEOUT: 15000,
  
  getHeaders: function() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
};
