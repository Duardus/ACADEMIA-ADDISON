/* ============================================
   📡 CONFIGURACIÓN API - Academia Addison
   ============================================ */

var API_CONFIG = {
  // URL base del backend
  BASE_URL: 'https://academia-addison.duckdns.org/api/v1',
  
  // Fallback a IP directa si DuckDNS no resuelve
  BASE_URL_FALLBACK: 'https://163.176.235.27/api/v1',
  
  TIMEOUT: 15000,
  
  getHeaders: function() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  },
  
  // Detectar si estamos en desarrollo local
  esLocalhost: function() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
};
