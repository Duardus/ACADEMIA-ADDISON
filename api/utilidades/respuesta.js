// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Respuestas HTTP estandarizadas
// Regla Oro: Toda respuesta del backend usa esta estructura.
// ═══════════════════════════════════════════════════════════════════════════

function exito(datos = null, mensaje = 'Operacion exitosa', meta = null) {
  const respuesta = {
    exito: true,
    mensaje,
    datos,
  };
  if (meta) respuesta.meta = meta;
  return respuesta;
}

function error(mensaje = 'Error interno del servidor', codigo = 500, detalles = null) {
  const respuesta = {
    exito: false,
    error: {
      mensaje,
      codigo,
    },
  };
  if (detalles && process.env.NODE_ENV !== 'production') {
    respuesta.error.detalles = detalles;
  }
  return respuesta;
}

function paginado(datos, pagina, porPagina, total) {
  return exito(datos, 'Listado paginado', {
    pagina: parseInt(pagina, 10),
    por_pagina: parseInt(porPagina, 10),
    total,
    total_paginas: Math.ceil(total / porPagina),
  });
}

module.exports = {
  exito,
  error,
  paginado,
};
