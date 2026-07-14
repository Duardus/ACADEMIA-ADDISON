const express = require('express');
const router = express.Router();
const progresoControlador = require('../controladores/progreso.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

// Todos los roles autenticados pueden ver progreso
// El servicio filtra segun rol: student ve solo suyo, admin ve todos
router.get('/', middlewareAutenticar, middlewareContexto, (req, res, next) => progresoControlador.obtenerProgreso(req, res, next));
router.get('/curso/:curso_id', middlewareAutenticar, middlewareContexto, (req, res, next) => progresoControlador.obtenerDetalleCurso(req, res, next));
router.post('/teoria', middlewareAutenticar, middlewareContexto, (req, res, next) => progresoControlador.completarTeoria(req, res, next));

module.exports = router;
