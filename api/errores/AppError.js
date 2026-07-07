/* ============================================
   🚨 CLASES DE ERROR PERSONALIZADAS
   Jerarquía de errores para manejo centralizado
   ============================================ */

class AppError extends Error {
  constructor(mensaje, codigoHttp = 500, codigoInterno = 'ERROR_INTERNO', detalle = null) {
    super(mensaje);
    this.codigoHttp = codigoHttp;
    this.codigoInterno = codigoInterno;
    this.detalle = detalle;
    this.esOperacional = true; // Error esperado, no bug del sistema
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorValidacion extends AppError {
  constructor(mensaje, detalle = null) {
    super(mensaje, 400, 'VALIDACION_FALLIDA', detalle);
  }
}

class ErrorAutenticacion extends AppError {
  constructor(mensaje, detalle = null) {
    super(mensaje, 401, 'AUTENTICACION_FALLIDA', detalle);
  }
}

class ErrorAutorizacion extends AppError {
  constructor(mensaje, detalle = null) {
    super(mensaje, 403, 'SIN_PERMISO', detalle);
  }
}

class ErrorNoEncontrado extends AppError {
  constructor(recurso, detalle = null) {
    super(`${recurso} no encontrado`, 404, 'NO_ENCONTRADO', detalle);
  }
}

class ErrorBaseDatos extends AppError {
  constructor(mensaje, detalle = null) {
    super(mensaje, 500, 'ERROR_BASE_DATOS', detalle);
  }
}

class ErrorConflicto extends AppError {
  constructor(mensaje, detalle = null) {
    super(mensaje, 409, 'CONFLICTO', detalle);
  }
}

module.exports = {
  AppError,
  ErrorValidacion,
  ErrorAutenticacion,
  ErrorAutorizacion,
  ErrorNoEncontrado,
  ErrorBaseDatos,
  ErrorConflicto
};
