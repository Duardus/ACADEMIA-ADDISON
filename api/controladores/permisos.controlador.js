const permisosServicio = require('./permisos.servicio');
const respuesta = require('../utilidades/respuesta');

class PermisosControlador {

  // ============================================
  // GET /api/v1/permisos/arbol - Árbol filtrado por permisos
  // ============================================
  async obtenerArbolPermitido(req, res, next) {
    try {
      const ctx = req.contexto_institucion;
      const usuario = req.usuario_autenticado;

      if (!ctx || !usuario) {
        return respuesta.error(res, 'Contexto requerido', 401, 'SIN_CONTEXTO');
      }

      const arbol = await permisosServicio.construirArbolPermitido(
        usuario.usuario_id,
        ctx.institucion_id,
        ctx.nivel
      );

      respuesta.exito(res, arbol, 'Arbol permitido obtenido');
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET /api/v1/permisos/subordinados - Lista de subordinados
  // ============================================
  async obtenerSubordinados(req, res, next) {
    try {
      const ctx = req.contexto_institucion;

      if (!ctx) {
        return respuesta.error(res, 'Contexto requerido', 401, 'SIN_CONTEXTO');
      }

      const subordinados = await permisosServicio.obtenerSubordinados(ctx.membresia_id);
      respuesta.exito(res, subordinados, 'Subordinados obtenidos');
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET /api/v1/permisos/salones - Salones del usuario
  // ============================================
  async obtenerSalones(req, res, next) {
    try {
      const ctx = req.contexto_institucion;
      const usuario = req.usuario_autenticado;

      if (!ctx || !usuario) {
        return respuesta.error(res, 'Contexto requerido', 401, 'SIN_CONTEXTO');
      }

      const salones = await permisosServicio.obtenerSalonesUsuario(
        usuario.usuario_id,
        ctx.institucion_id
      );

      respuesta.exito(res, salones, 'Salones obtenidos');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PermisosControlador();
