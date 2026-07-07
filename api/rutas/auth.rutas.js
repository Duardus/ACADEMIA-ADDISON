const express = require('express');
const router = express.Router();
const { login, seleccionarContexto, switchContext } = require('../controladores/auth.controlador');
const { asyncHandler } = require('../middleware/async_handler');
const { middlewareAutenticar } = require('../middleware/autenticar');

// Auth - No requiere autenticación previa
router.post('/login', asyncHandler(login));
router.post('/seleccionar-contexto', asyncHandler(seleccionarContexto));

// Switch context - Requiere token válido
router.post('/switch-context', middlewareAutenticar, asyncHandler(switchContext));

module.exports = router;
