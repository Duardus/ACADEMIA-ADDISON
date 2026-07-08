const express = require('express');
const router = express.Router();
const progresoControlador = require('../controladores/progreso.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');
const { requerirRol } = require('../middleware/rbac');

router.get('/', middlewareAutenticar, middlewareContexto, requerirRol('student'), (req, res, next) => progresoControlador.obtenerProgreso(req, res, next));
router.get('/curso/:curso_id', middlewareAutenticar, middlewareContexto, requerirRol('student'), (req, res, next) => progresoControlador.obtenerDetalleCurso(req, res, next));
router.post('/teoria', middlewareAutenticar, middlewareContexto, requerirRol('student'), (req, res, next) => progresoControlador.completarTeoria(req, res, next));

module.exports = router;
