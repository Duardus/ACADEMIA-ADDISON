const { respuestaError } = require('../utilidades/respuesta');
const { ErrorApp } = require('../utilidades/errores');

function manejadorErrores(err, req, res, next) {
  if (res.headersSent) return next(err);

  let codigoHttp = 500;
  let mensaje = 'Error interno del servidor';
  let codigoInterno = 'ERR_DESCONOCIDO';
  let detalles = null;

  if (err instanceof ErrorApp) {
    codigoHttp = err.codigoHttp;
    mensaje = err.message;
    codigoInterno = err.codigoInterno;
  } else if (err.code === '23505') {
    codigoHttp = 409;
    mensaje = 'El recurso ya existe';
    codigoInterno = 'ERR_DUPLICADO';
  } else if (err.code === '23503') {
    codigoHttp = 400;
    mensaje = 'Referencia invalida';
    codigoInterno = 'ERR_REFERENCIA';
  }

  if (process.env.NODE_ENV !== 'production') {
    detalles = { stack: err.stack, original: err.message, codigo: err.code || null };
  }

  console.error(`[ERROR] ${codigoInterno} | ${codigoHttp} | ${mensaje} | ${req.method} ${req.path}`);
  res.status(codigoHttp).json(respuestaError(mensaje, codigoHttp, detalles));
}

function rutaNoEncontrada(req, res) {
  res.status(404).json(respuestaError(`Ruta no encontrada: ${req.method} ${req.path}`, 404));
}

module.exports = { manejadorErrores, rutaNoEncontrada };
