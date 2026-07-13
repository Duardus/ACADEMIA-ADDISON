// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio de Usuarios
// ═══════════════════════════════════════════════════════════════════════════

const usuarioRepositorio = require('../repositorios/usuario.repositorio');
const { ErrorNoEncontrado, ErrorValidacion, ErrorConflicto } = require('../utilidades/errores');

async function listarUsuarios(institucionId, pagina = 1, porPagina = 20) {
  const offset = (pagina - 1) * porPagina;
  const resultado = await usuarioRepositorio.listarPorInstitucion(institucionId, porPagina, offset);
  const total = await usuarioRepositorio.contar();
  return {
    usuarios: resultado.rows,
    pagina,
    porPagina,
    total,
  };
}

async function obtenerUsuario(id) {
  const usuario = await usuarioRepositorio.obtenerPorId(id);
  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }
  return usuario;
}

async function actualizarRol(id, nuevoRol) {
  const rolesPermitidos = ['superadmin', 'admin', 'profesor', 'estudiante'];
  if (!rolesPermitidos.includes(nuevoRol)) {
    throw new ErrorValidacion('Rol invalido. Permitidos: ' + rolesPermitidos.join(', '));
  }

  const usuario = await usuarioRepositorio.actualizarRol(id, nuevoRol);
  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }
  return usuario;
}

async function asignarInstitucion(id, institucionId) {
  const usuario = await usuarioRepositorio.actualizar(id, { institucion_id: institucionId });
  if (!usuario) {
    throw new ErrorNoEncontrado('Usuario no encontrado');
  }
  return usuario;
}

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  actualizarRol,
  asignarInstitucion,
};
