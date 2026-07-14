const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { listarPreguntas, crearPregunta, actualizarPregunta } = require('../controladores/pregunta.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, listarPreguntas);
router.post('/', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), crearPregunta);
router.put('/:pregunta_id', middlewareAutenticar, middlewareContexto, requerirRol('superadmin', 'director', 'professor'), actualizarPregunta);

module.exports = router;
