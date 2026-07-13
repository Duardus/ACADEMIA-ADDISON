// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Middleware global de manejo de errores
// ═══════════════════════════════════════════════════════════════════════════

const { error } = require('../utilidades/respuesta');
const { ErrorApp } = require('../utilidades/errores');

function manejadorErrores(err, req, res, next) {
  // Si ya se envio respuesta, no hacer nada
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
    // Violacion unique constraint PostgreSQL
    codigoHttp = 409;
    mensaje = 'El recurso ya existe (duplicado)';
    codigoInterno = 'ERR_DUPLICADO';
  } else if (err.code === '23503') {
    // Violacion foreign key PostgreSQL
    codigoHttp = 400;
    mensaje = 'Referencia invalida a otro recurso';
    codigoInterno = 'ERR_REFERENCIA';
  } else if (err.code === '22P02') {
    // Tipo de dato invalido PostgreSQL
    codigoHttp = 400;
    mensaje = 'Tipo de dato invalido';
    codigoInterno = 'ERR_TIPO_DATO';
  }

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV !== 'production') {
    detalles = {
      stack: err.stack,
      original: err.message,
      codigo: err.code || null,
    };
  }

  console.error(`[ERROR] ${codigoInterno} | ${codigoHttp} | ${mensaje} | ${req.method} ${req.path}`);

  res.status(codigoHttp).json(error(mensaje, codigoHttp, detalles));
}

function rutaNoEncontrada(req, res) {
  const { error: respError } = require('../utilidades/respuesta');
  res.status(404).json(respError(`Ruta no encontrada: ${req.method} ${req.path}`, 404));
}

module.exports = {
  manejadorErrores,
  rutaNoEncontrada,
};
