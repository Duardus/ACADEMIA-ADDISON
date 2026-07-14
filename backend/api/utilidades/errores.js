// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Clases de error personalizadas
// ═══════════════════════════════════════════════════════════════════════════

class ErrorApp extends Error {
  constructor(mensaje, codigoHttp = 500, codigoInterno = 'ERR_DESCONOCIDO') {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigoHttp = codigoHttp;
    this.codigoInterno = codigoInterno;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorValidacion extends ErrorApp {
  constructor(mensaje = 'Datos de entrada invalidos') {
    super(mensaje, 400, 'ERR_VALIDACION');
  }
}

class ErrorAutenticacion extends ErrorApp {
  constructor(mensaje = 'No autorizado') {
    super(mensaje, 401, 'ERR_AUTENTICACION');
  }
}

class ErrorPermiso extends ErrorApp {
  constructor(mensaje = 'Permiso denegado') {
    super(mensaje, 403, 'ERR_PERMISO');
  }
}

class ErrorNoEncontrado extends ErrorApp {
  constructor(mensaje = 'Recurso no encontrado') {
    super(mensaje, 404, 'ERR_NO_ENCONTRADO');
  }
}

class ErrorConflicto extends ErrorApp {
  constructor(mensaje = 'Conflicto de datos') {
    super(mensaje, 409, 'ERR_CONFLICTO');
  }
}

module.exports = {
  ErrorApp,
  ErrorValidacion,
  ErrorAutenticacion,
  ErrorPermiso,
  ErrorNoEncontrado,
  ErrorConflicto,
};
