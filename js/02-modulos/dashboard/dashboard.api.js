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

// ============================================
// ARBOL - Con permisos filtrados por nivel
// ============================================
async function apiObtenerArbol() {
  return get('/permisos/arbol');
}

async function apiObtenerArbolCompleto() {
  return get('/arbol');
}

async function apiObtenerProgreso() {
  return get('/progreso');
}

// ============================================
// PERMISOS - Salones y subordinados
// ============================================
async function apiObtenerSalonesUsuario() {
  return get('/permisos/salones');
}

async function apiObtenerSubordinados() {
  return get('/permisos/subordinados');
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
