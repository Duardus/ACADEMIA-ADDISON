/* ============================================
   SESION - ACADEMIA ADDISON
   ============================================ */

function guardarSesion(token, usuario) {
  try {
    localStorage.setItem('token_sesion', token);
    localStorage.setItem('usuario', JSON.stringify(usuario || {}));
    console.log('[SESION] Guardado exitoso');
  } catch (e) {
    console.error('[SESION] Error guardando:', e.message);
  }
}

function obtenerToken() {
  return localStorage.getItem('token_sesion');
}

function obtenerUsuario() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || '{}');
  } catch (e) {
    return {};
  }
}

function obtenerRol() {
  const usuario = obtenerUsuario();
  return usuario.rol || 'estudiante';
}

function esSuperAdmin() {
  return obtenerRol() === 'superadmin';
}

function tienePermiso(permiso) {
  const rol = obtenerRol();
  const permisos = {
    superadmin: ['*'],
    administrador: ['usuarios', 'instituciones', 'salones', 'cursos', 'examenes', 'grabaciones'],
    profesor: ['cursos', 'examenes', 'grabaciones'],
    estudiante: ['cursos', 'examenes']
  };
  const lista = permisos[rol] || [];
  return lista.includes('*') || lista.includes(permiso);
}

function limpiarSesion() {
  localStorage.removeItem('token_sesion');
  localStorage.removeItem('usuario');
}

function estaAutenticado() {
  return !!obtenerToken();
}
