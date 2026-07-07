/* ============================================
   🛡️ MANEJADOR CENTRALIZADO DE ERRORES
   Captura TODOS los errores y responde con formato estandar
   ============================================ */

const { AppError } = require("../errores/AppError");
const respuesta = require("../utilidades/respuesta");

function manejarErroresOperacionales(err, req, res, next) {
  if (err instanceof AppError && err.esOperacional) {
    console.error("[ERROR " + err.codigoInterno + "] " + err.message);
    return respuesta.error(res, err.codigoHttp, err.codigoInterno, err.message, err.detalle);
  }
  next(err);
}

function manejarErroresPostgres(err, req, res, next) {
  if (err.code && err.code.startsWith("08")) {
    console.error("[POSTGRES " + err.code + "] " + err.message);
    return respuesta.error(res, 500, "ERROR_BASE_DATOS", "Error de conexion con la base de datos", err.message);
  }
  if (err.code && err.code.startsWith("23")) {
    console.error("[POSTGRES " + err.code + "] " + err.message);
    return respuesta.error(res, 409, "VIOLACION_INTEGRIDAD", "Conflicto con los datos existentes", err.message);
  }
  if (err.code && err.code.startsWith("22")) {
    console.error("[POSTGRES " + err.code + "] " + err.message);
    return respuesta.error(res, 400, "DATO_INVALIDO", "Formato de datos incorrecto", err.message);
  }
  next(err);
}

function manejarErroresFirebase(err, req, res, next) {
  if (err.code && err.code.startsWith("auth/")) {
    console.error("[FIREBASE " + err.code + "] " + err.message);
    return respuesta.error(res, 401, "TOKEN_INVALIDO", "Token de autenticacion invalido", err.message);
  }
  next(err);
}

function manejarErroresGenerales(err, req, res, next) {
  console.error("[ERROR NO MANEJADO]", err);
  const esDesarrollo = process.env.NODE_ENV !== "production";
  return respuesta.error(res, 500, "ERROR_INTERNO", "Error interno del servidor", esDesarrollo ? err.stack : null);
}

module.exports = {
  manejarErroresOperacionales,
  manejarErroresPostgres,
  manejarErroresFirebase,
  manejarErroresGenerales
};
