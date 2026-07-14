/* ============================================
   📡 CONFIGURACIÓN API - Academia Addison
   ============================================ */

var API_CONFIG = {
  // DuckDNS - funciona para 99% de usuarios
  BASE_URL: 'https://academia-addison.duckdns.org/api/v1',
  
  TIMEOUT: 15000,
  
  getHeaders: function() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
};
