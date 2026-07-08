const servicio = require('./progreso.servicio');
const respuesta = require('../utilidades/respuesta');

class ProgresoControlador {

  async obtenerProgreso(req, res, next) {
    try {
      const alumnoId = req.usuario_autenticado?.usuario_id;
      if (!alumnoId) {
        return respuesta.error(res, 400, 'SIN_USUARIO', 'Usuario no identificado');
      }

      const resultado = await servicio.obtenerProgreso(alumnoId);
      respuesta.exito(res, { cursos: resultado });
    } catch (error) {
      next(error);
    }
  }

  async obtenerDetalleCurso(req, res, next) {
    try {
      const alumnoId = req.usuario_autenticado?.usuario_id;
      const cursoId = parseInt(req.params.curso_id);

      if (!alumnoId) {
        return respuesta.error(res, 400, 'SIN_USUARIO', 'Usuario no identificado');
      }

      const resultado = await servicio.obtenerDetalleCurso(alumnoId, cursoId);
      respuesta.exito(res, { detalle: resultado });
    } catch (error) {
      next(error);
    }
  }

  async completarTeoria(req, res, next) {
    try {
      const alumnoId = req.usuario_autenticado?.usuario_id;
      const { teoria_id, curso_id } = req.body;

      if (!alumnoId) {
        return respuesta.error(res, 400, 'SIN_USUARIO', 'Usuario no identificado');
      }

      const resultado = await servicio.completarTeoria(alumnoId, teoria_id, curso_id);
      respuesta.exito(res, resultado, 'Teoria completada', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProgresoControlador();
