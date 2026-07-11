const servicio = require('./jerarquia.usuarios.servicio');
const respuesta = require('../utilidades/respuesta');
const { obtenerAuth } = require('../configuracion/firebase');

class JerarquiaUsuariosControlador {
  async crearUsuarioHijo(req, res, next) {
    try {
      const contexto = {
        membresia_id: req.contexto_institucion?.membresia_id,
        usuario_id: req.usuario_autenticado?.usuario_id,
        institucion_id: req.contexto_institucion?.institucion_id
      };
      if (!contexto.membresia_id || !contexto.usuario_id || !contexto.institucion_id) {
        return respuesta.error(res, 400, 'SIN_CONTEXTO', 'Falta contexto');
      }
      const resultado = await servicio.crearUsuarioHijo(req.body, contexto);
      respuesta.exito(res, resultado, 'Usuario creado exitosamente', 201);
    } catch (error) { next(error); }
  }

  async obtenerMisSubordinados(req, res, next) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      if (!membresia_id) return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      const resultado = await servicio.obtenerMisSubordinados(membresia_id, institucion_id);
      respuesta.exito(res, resultado);
    } catch (error) { next(error); }
  }

  async desactivarSubordinado(req, res, next) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (!creador_membresia_id) return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      const resultado = await servicio.desactivarSubordinado(creador_membresia_id, creador_usuario_id, objetivo_membresia_id);
      respuesta.exito(res, resultado, 'Usuario desactivado y sesion cerrada');
    } catch (error) { next(error); }
  }

  async cambiarEstado(req, res, next) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      const { estado } = req.body;
      if (!creador_membresia_id) return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      if (!estado || !['active','suspended'].includes(estado)) return respuesta.error(res, 400, 'ESTADO_INVALIDO', 'Estado invalido');
      const resultado = await servicio.cambiarEstadoSubordinado(creador_membresia_id, creador_usuario_id, objetivo_membresia_id, estado);
      respuesta.exito(res, resultado, 'Estado cambiado');
    } catch (error) { next(error); }
  }

  async eliminarUsuarioCompleto(req, res, next) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (!creador_membresia_id) return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      const resultado = await servicio.eliminarUsuarioCompleto(creador_membresia_id, creador_usuario_id, objetivo_membresia_id);
      try { const auth = obtenerAuth(); await auth.deleteUser(resultado.usuario_id); } catch(e){ console.warn('Firebase:', e.message); }
      respuesta.exito(res, resultado, 'Usuario eliminado permanentemente');
    } catch (error) { next(error); }
  }

  async obtenerSuperiores(req, res, next) {
    try {
      const membresia_id = req.params.membresia_id;
      const resultado = await servicio.obtenerSuperiores(membresia_id);
      respuesta.exito(res, { superiores: resultado });
    } catch (error) { next(error); }
  }

  async editarUsuario(req, res, next) {
    try {
      const objetivo_id = parseInt(req.params.membresia_id);
      const ctx = req.contexto_institucion;
      if (!ctx?.membresia_id) return respuesta.error(res, 400, 'SIN_CONTEXTO', 'Falta contexto');
      if (!objetivo_id) return respuesta.error(res, 400, 'ID_INVALIDO', 'membresia_id requerido');
      const datos = { ...req.body, membresia_id: objetivo_id };
      const resultado = await servicio.editarUsuario(datos, ctx);
      respuesta.exito(res, resultado, 'Usuario actualizado correctamente');
    } catch (error) { next(error); }
  }
}

module.exports = new JerarquiaUsuariosControlador();
