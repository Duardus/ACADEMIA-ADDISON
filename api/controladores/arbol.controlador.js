const arbolServicio = require('./arbol.servicio');
const respuesta = require('../utilidades/respuesta');

class ArbolControlador {

  async obtenerArbol(req, res, next) {
    try {
      const institucion_id = req.usuario_autenticado?.institucion_id || req.query.institucion_id || null;
      const resultado = await arbolServicio.obtenerArbol(institucion_id);
      respuesta.exito(res, resultado.datos, 'Arbol academico obtenido', 200, resultado.totales);
    } catch (error) {
      next(error);
    }
  }

  async crearCurso(req, res, next) {
    try {
      const institucion_id = req.usuario_autenticado?.institucion_id || req.body.institucion_id;
      const resultado = await arbolServicio.crearCurso(institucion_id, req.body);
      respuesta.exito(res, resultado, 'Curso creado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async actualizarCurso(req, res, next) {
    try {
      const resultado = await arbolServicio.actualizarCurso(req.params.id, req.body);
      respuesta.exito(res, resultado, 'Curso actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async eliminarCurso(req, res, next) {
    try {
      await arbolServicio.eliminarCurso(req.params.id);
      respuesta.exito(res, { eliminado: true }, 'Curso eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async crearTema(req, res, next) {
    try {
      const resultado = await arbolServicio.crearTema(req.body);
      respuesta.exito(res, resultado, 'Tema creado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async actualizarTema(req, res, next) {
    try {
      const resultado = await arbolServicio.actualizarTema(req.params.id, req.body);
      respuesta.exito(res, resultado, 'Tema actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async eliminarTema(req, res, next) {
    try {
      await arbolServicio.eliminarTema(req.params.id);
      respuesta.exito(res, { eliminado: true }, 'Tema eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async crearSubtema(req, res, next) {
    try {
      const resultado = await arbolServicio.crearSubtema(req.body);
      respuesta.exito(res, resultado, 'Subtema creado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async actualizarSubtema(req, res, next) {
    try {
      const resultado = await arbolServicio.actualizarSubtema(req.params.id, req.body);
      respuesta.exito(res, resultado, 'Subtema actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }

  async eliminarSubtema(req, res, next) {
    try {
      await arbolServicio.eliminarSubtema(req.params.id);
      respuesta.exito(res, { eliminado: true }, 'Subtema eliminado correctamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ArbolControlador();
