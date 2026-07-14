const arbolServicio = require('../servicios/arbol.servicio');
const { exito, respuestaError } = require('../utilidades/respuesta');

async function obtenerArbol(req, res, next) {
  try {
    const { institucion_id } = req.query;
    if (!institucion_id) {
      return res.status(400).json(respuestaError('institucion_id requerido', 400));
    }
    const resultado = await arbolServicio.obtenerArbol(institucion_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function obtenerGrupos(req, res, next) {
  try {
    const { institucion_id } = req.query;
    if (!institucion_id) {
      return res.status(400).json(respuestaError('institucion_id requerido', 400));
    }
    const resultado = await arbolServicio.obtenerGrupos(institucion_id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { obtenerArbol, obtenerGrupos };
