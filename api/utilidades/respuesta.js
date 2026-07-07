/* ============================================
   📦 FORMATO ESTÁNDAR DE RESPUESTA
   Todas las respuestas API usan la misma estructura
   ============================================ */

/**
 * Respuesta exitosa
 * @param {Object} res - Response de Express
 * @param {*} datos - Datos a devolver
 * @param {string} mensaje - Mensaje descriptivo
 * @param {number} codigoHttp - Código HTTP (default 200)
 */
function exito(res, datos = null, mensaje = 'Operacion exitosa', codigoHttp = 200) {
  const respuesta = {
    exito: true,
    mensaje,
    timestamp: new Date().toISOString()
  };
  if (datos !== null) {
    respuesta.datos = datos;
  }
  return res.status(codigoHttp).json(respuesta);
}

/**
 * Respuesta de error (usada por middleware de errores)
 * @param {Object} res - Response de Express
 * @param {number} codigoHttp - Código HTTP
 * @param {string} codigoInterno - Código interno del error
 * @param {string} mensaje - Mensaje descriptivo
 * @param {*} detalle - Detalles adicionales (solo en desarrollo)
 */
function error(res, codigoHttp, codigoInterno, mensaje, detalle = null) {
  const respuesta = {
    exito: false,
    error: mensaje,
    codigo: codigoInterno,
    timestamp: new Date().toISOString()
  };
  
  // Solo incluir detalle en desarrollo (no en producción)
  if (detalle && process.env.NODE_ENV !== 'production') {
    respuesta.detalle = detalle;
  }
  
  return res.status(codigoHttp).json(respuesta);
}

/**
 * Respuesta paginada
 */
function paginado(res, items, pagina, porPagina, total) {
  return exito(res, {
    items,
    paginacion: {
      pagina,
      por_pagina: porPagina,
      total,
      total_paginas: Math.ceil(total / porPagina)
    }
  });
}

module.exports = {
  exito,
  error,
  paginado
};
