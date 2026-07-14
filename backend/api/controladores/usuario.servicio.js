const usuarioRepositorio = require('./usuario.repositorio');
const { ErrorValidacion, ErrorConflicto } = require('../errores/AppError');

class UsuarioServicio {

  validarCampos(datos) {
    const { correo_electronico, nombre_completo, tipo_rol } = datos;
    if (!correo_electronico || !nombre_completo || !tipo_rol) {
      throw new ErrorValidacion('Correo, nombre y rol requeridos', 'DATOS_FALTANTES');
    }
  }

  normalizarCorreo(correo) {
    return correo.toLowerCase().trim();
  }

  async crearUsuario(datos, contexto) {
    this.validarCampos(datos);
    const correo = this.normalizarCorreo(datos.correo_electronico);
    const usuarioExistente = await usuarioRepositorio.buscarPorCorreo(correo);

    if (usuarioExistente) {
      const membresiaExistente = await usuarioRepositorio.verificarMembresia(usuarioExistente.usuario_id, contexto.institucion_id);
      if (membresiaExistente) {
        throw new ErrorConflicto('Usuario ya en esta institucion', 'MEMBRESIA_EXISTENTE');
      }
      await usuarioRepositorio.crearMembresia(usuarioExistente.usuario_id, contexto.institucion_id, datos.tipo_rol, contexto.usuario_id);
      return { tipo: 'asignacion_directa', usuario_id: usuarioExistente.usuario_id };
    }

    const uid_temp = await usuarioRepositorio.crearUsuarioConMembresia(correo, datos.nombre_completo, datos.tipo_rol, contexto.institucion_id, contexto.usuario_id);
    return { tipo: 'usuario_nuevo', usuario_id: uid_temp };
  }

  async listarUsuarios(institucionId) {
    return await usuarioRepositorio.listarPorInstitucion(institucionId);
  }
}

module.exports = new UsuarioServicio();
