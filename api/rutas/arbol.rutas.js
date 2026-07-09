const express = require('express');
const router = express.Router();
const controlador = require('../controladores/arbol.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');

router.use(middlewareAutenticar);

// GET /api/v1/arbol - Arbol academico completo
router.get('/', (req, res) => controlador.obtenerArbol(req, res));

// CURSOS
router.post('/cursos', (req, res) => controlador.crearCurso(req, res));
router.put('/cursos/:id', (req, res) => controlador.actualizarCurso(req, res));
router.delete('/cursos/:id', (req, res) => controlador.eliminarCurso(req, res));

// TEMAS
router.post('/temas', (req, res) => controlador.crearTema(req, res));
router.put('/temas/:id', (req, res) => controlador.actualizarTema(req, res));
router.delete('/temas/:id', (req, res) => controlador.eliminarTema(req, res));

// SUBTEMAS
router.post('/subtemas', (req, res) => controlador.crearSubtema(req, res));
router.put('/subtemas/:id', (req, res) => controlador.actualizarSubtema(req, res));
router.delete('/subtemas/:id', (req, res) => controlador.eliminarSubtema(req, res));

module.exports = router;
