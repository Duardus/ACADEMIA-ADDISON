const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { iniciarIntento, guardarRespuesta, finalizarIntento } = require('../controladores/intento.controlador');

router.post('/iniciar', middlewareAutenticar, middlewareContexto, requerirRol('student'), iniciarIntento);
router.post('/respuesta', middlewareAutenticar, middlewareContexto, requerirRol('student'), guardarRespuesta);
router.post('/finalizar', middlewareAutenticar, middlewareContexto, requerirRol('student'), finalizarIntento);

module.exports = router;
