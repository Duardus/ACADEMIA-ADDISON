const express = require('express');
const router = express.Router();
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');
const { marcarTeoriaCompletada, obtenerProgreso } = require('../controladores/progreso.controlador');

router.get('/', middlewareAutenticar, middlewareContexto, requerirRol('student'), obtenerProgreso);
router.post('/teoria', middlewareAutenticar, middlewareContexto, requerirRol('student'), marcarTeoriaCompletada);

module.exports = router;
