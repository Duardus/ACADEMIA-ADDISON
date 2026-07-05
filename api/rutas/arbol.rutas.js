const express = require('express');
const router = express.Router();
const controlador = require('../controladores/arbol.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');

// GET /api/v1/arbol - Arbol academico completo
router.get('/', middlewareAutenticar, (req, res) => controlador.obtenerArbol(req, res));

module.exports = router;
