/* ============================================
   🔌 CONFIGURACIÓN API - ACADEMIA ADDISON
   Si cambias de servidor, solo edita aquí.
   ============================================ */

const API_CONFIG = {
  BASE_URL: 'https://academia-addison.duckdns.org/api/v1',
  VERSION: 'v1',
  TIMEOUT: 15000,
  
  getHeaders() {
    const token = localStorage.getItem('token_sesion');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer ' + token : ''
    };
  }
};
