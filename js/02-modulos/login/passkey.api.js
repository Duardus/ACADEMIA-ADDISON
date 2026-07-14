/* ============================================
   📡 API PASSKEYS - Academia Addison
   ============================================ */

async function apiPasskeyRegistroOpciones(correo, nombre) {
  return post(API_CONFIG.BASE_URL + '/passkey/registro/opciones', { correo, nombre });
}

async function apiPasskeyRegistroVerificar(correo, respuesta) {
  return post(API_CONFIG.BASE_URL + '/passkey/registro/verificar', { correo, respuesta });
}

async function apiPasskeyLoginOpciones(correo) {
  return post(API_CONFIG.BASE_URL + '/passkey/login/opciones', { correo });
}

async function apiPasskeyLoginVerificar(correo, respuesta) {
  return post(API_CONFIG.BASE_URL + '/passkey/login/verificar', { correo, respuesta });
}

async function apiPasskeyRecuperacion(correo) {
  return post(API_CONFIG.BASE_URL + '/passkey/recuperacion', { correo });
}

async function apiPasskeyRecuperacionVerificar(token) {
  return post(API_CONFIG.BASE_URL + '/passkey/recuperacion/verificar', { token });
}

async function apiVerificarSesion() {
  return get(API_CONFIG.BASE_URL + '/auth/perfil');
}
