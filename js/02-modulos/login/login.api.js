/* ============================================
   📁 ARCHIVO: login.api.js
   📂 MÓDULO: login
   🔗 DEPENDENCIAS: peticiones.js (01-nucleo)
   📝 CONTRATO:
     - Entrada: tokenFirebase (string)
     - Salida: { token_sesion, usuario, institucion } o error
     - NO toca localStorage, NO toca DOM
   🚫 NO TOCAR: UI, sesion.js, firebase
   ============================================ */

async function apiLogin(tokenFirebase) {
  return post('/auth/login', { token_firebase: tokenFirebase });
}

async function apiSeleccionarContexto(tokenPreliminar, membresiaId) {
  return post('/auth/seleccionar-contexto', {
    token_preliminar: tokenPreliminar,
    membresia_id: membresiaId
  });
}

async function apiSwitchContext(membresiaId) {
  return post('/auth/switch-context', { membresia_id: membresiaId });
}
