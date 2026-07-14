/* ============================================
   🔄 ASYNC HANDLER
   Elimina necesidad de try/catch en cada controlador
   ============================================ */

const { AppError } = require('../errores/AppError');

function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Exportar como función directa Y como objeto con propiedad
// para compatibilidad con todos los patrones de import
module.exports = asyncHandler;
module.exports.asyncHandler = asyncHandler;
