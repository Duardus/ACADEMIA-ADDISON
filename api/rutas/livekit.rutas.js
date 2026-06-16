const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { generarTokenSala } = require('../controladores/livekit.controlador');

router.post('/token', middlewareAutenticar, middlewareContexto, generarTokenSala);

module.exports = router;
