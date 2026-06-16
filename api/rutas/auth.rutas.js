const express = require('express');
const router = express.Router();
const { login, seleccionarContexto, cambiarContexto } = require('../controladores/auth.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

router.post('/login', login);
router.post('/seleccionar-contexto', seleccionarContexto);
router.post('/cambiar-contexto', middlewareAutenticar, middlewareContexto, cambiarContexto);

module.exports = router;
