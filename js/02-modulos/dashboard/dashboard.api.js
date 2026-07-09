/* ============================================
   📁 ARCHIVO: dashboard.api.js
   📂 MÓDULO: dashboard
   🔗 DEPENDENCIAS: peticiones.js (01-nucleo)
   📝 CONTRATO:
     - Solo llamadas HTTP a endpoints del dashboard
     - NO toca DOM, NO toca localStorage
   ============================================ */

async function apiVerificarSesion() {
  return get('/sesion/verificar');
}

async function apiObtenerArbol() {
  return get('/arbol');
}

async function apiObtenerProgreso() {
  return get('/progreso');
}
