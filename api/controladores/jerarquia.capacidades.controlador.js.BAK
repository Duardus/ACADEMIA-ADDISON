const servicio = require('./jerarquia.capacidades.servicio');
const respuesta = require('../utilidades/respuesta');

class JerarquiaCapacidadesControlador {

  async obtenerMisCapacidadesDelegables(req, res, next) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) {
        return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      }

      const resultado = await servicio.obtenerMisCapacidadesDelegables(membresia_id);
      respuesta.exito(res, resultado);
    } catch (error) {
      next(error);
    }
  }

  async modificarCapacidadesSubordinado(req, res, next) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      const { capacidades_ids, puede_crear_hijos } = req.body;

      if (!creador_membresia_id) {
        return respuesta.error(res, 400, 'SIN_MEMBRESIA', 'Sin membresia');
      }

      const resultado = await servicio.modificarCapacidadesSubordinado(
        creador_membresia_id, creador_usuario_id, objetivo_membresia_id,
        capacidades_ids, puede_crear_hijos
      );
      respuesta.exito(res, resultado, 'Capacidades modificadas');
    } catch (error) {
      next(error);
    }
  }

  async obtenerEtiquetasFrecuentes(req, res, next) {
    try {
      const institucion_id = req.contexto_institucion?.institucion_id;
      if (!institucion_id) {
        return respuesta.error(res, 400, 'SIN_INSTITUCION', 'Sin institucion');
      }

      const resultado = await servicio.obtenerEtiquetasFrecuentes(institucion_id);
      respuesta.exito(res, { etiquetas: resultado });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JerarquiaCapacidadesControlador();
