/* ============================================
   📡 API PASSKEYS - Academia Addison
   ============================================ */

async function apiPasskeyRegistroOpciones(correo, nombre) {
  return post('/passkey/registro/opciones', { correo, nombre });
}

async function apiPasskeyRegistroVerificar(correo, respuesta) {
  return post('/passkey/registro/verificar', { correo, respuesta });
}

async function apiPasskeyLoginOpciones(correo) {
  return post('/passkey/login/opciones', { correo });
}

async function apiPasskeyLoginVerificar(correo, respuesta) {
  return post('/passkey/login/verificar', { correo, respuesta });
}

async function apiPasskeyRecuperacion(correo) {
  return post('/passkey/recuperacion', { correo });
}

async function apiPasskeyRecuperacionVerificar(token) {
  return post('/passkey/recuperacion/verificar', { token });
}

async function apiVerificarSesion() {
  return get('/auth/perfil');
}
