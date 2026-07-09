const express = require('express');
const router = express.Router();
const controlador = require('../controladores/permisos.controlador');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

router.use(middlewareAutenticar);
router.use(middlewareContexto);

// GET /api/v1/permisos/arbol - Arbol filtrado por permisos
router.get('/arbol', (req, res) => controlador.obtenerArbolPermitido(req, res));

// GET /api/v1/permisos/subordinados - Subordinados del usuario
router.get('/subordinados', (req, res) => controlador.obtenerSubordinados(req, res));

// GET /api/v1/permisos/salones - Salones del usuario
router.get('/salones', (req, res) => controlador.obtenerSalones(req, res));

module.exports = router;
