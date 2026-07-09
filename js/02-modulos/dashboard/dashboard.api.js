/* ============================================
   ARCHIVO: dashboard.api.js
   MODULO: dashboard
   CONTRATO:
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

// ============================================
// LIVEKIT - Clases en vivo
// ============================================
async function apiObtenerTokenLivekit(nombreSala, rolSala) {
  return post('/livekit/token', { nombre_sala: nombreSala, rol_sala: rolSala });
}

// ============================================
// GRABACIONES
// ============================================
async function apiIniciarGrabacion(salaId, nombreSala) {
  return post('/grabaciones/iniciar', { sala_id: salaId, nombre_sala: nombreSala });
}

async function apiDetenerGrabacion(grabacionId) {
  return post('/grabaciones/detener', { grabacion_id: grabacionId });
}

async function apiListarGrabaciones() {
  return get('/grabaciones');
}
