/* ============================================
   📁 ARCHIVO: sesion.js
   📂 CAPA: 01-nucleo
   🔗 DEPENDENCIAS: NINGUNA
   📝 CONTRATO:
     - Lee/escribe localStorage
     - Parsea token JWT (sin verificar firma)
     - NO hace fetch, NO toca DOM
   🚫 NO TOCAR: peticiones.js, UI, Firebase
   ============================================ */

const CLAVES = {
  TOKEN: 'token_sesion',
  INSTITUCION: 'institucion_activa',
  USUARIO: 'usuario_activo'
};

function guardarToken(token) {
  localStorage.setItem(CLAVES.TOKEN, token);
}

function obtenerToken() {
  return localStorage.getItem(CLAVES.TOKEN);
}

function guardarInstitucion(datos) {
  localStorage.setItem(CLAVES.INSTITUCION, JSON.stringify(datos));
}

function obtenerInstitucion() {
  try {
    const raw = localStorage.getItem(CLAVES.INSTITUCION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function guardarUsuario(datos) {
  localStorage.setItem(CLAVES.USUARIO, JSON.stringify(datos));
}

function obtenerUsuario() {
  try {
    const raw = localStorage.getItem(CLAVES.USUARIO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function limpiarSesion() {
  localStorage.removeItem(CLAVES.TOKEN);
  localStorage.removeItem(CLAVES.INSTITUCION);
  localStorage.removeItem(CLAVES.USUARIO);
}

function haySesionActiva() {
  return !!obtenerToken() && !!obtenerInstitucion();
}

// Decodificar payload del JWT (sin verificar firma)
function decodificarToken(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function obtenerDatosToken() {
  const token = obtenerToken();
  return token ? decodificarToken(token) : null;
}
