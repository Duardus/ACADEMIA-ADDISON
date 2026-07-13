// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas del Arbol Academico
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const arbolControlador = require('../controladores/arbol.controlador');

router.get('/', arbolControlador.obtenerArbol);
router.get('/grupos', arbolControlador.obtenerGrupos);

module.exports = router;
