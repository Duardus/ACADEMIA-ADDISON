/* ============================================
   🔄 ASYNC HANDLER
   Elimina necesidad de try/catch en cada controlador
   ============================================ */

const { AppError } = require('../errores/AppError');

/**
 * Wrapper que captura errores en funciones async
 * y los pasa al middleware de errores con next(err)
 * 
 * Uso: router.get('/', asyncHandler(controlador.metodo))
 */
function asyncHandler(fn) {
  return function(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
