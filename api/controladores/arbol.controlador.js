const arbolServicio = require('./arbol.servicio');
const respuesta = require('../utilidades/respuesta');

class ArbolControlador {

  async obtenerArbol(req, res, next) {
    const institucion_id = req.usuario_autenticado?.institucion_id || req.query.institucion_id || null;
    const resultado = await arbolServicio.obtenerArbol(institucion_id);
    respuesta.exito(res, resultado.datos, 'Arbol academico obtenido');
  }

}

module.exports = new ArbolControlador();
