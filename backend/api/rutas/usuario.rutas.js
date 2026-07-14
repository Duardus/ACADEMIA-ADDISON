// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas de Usuarios
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const usuarioControlador = require('../controladores/usuario.controlador');
const { verificarAuth, requerirRol } = require('../middlewares/verificar_auth');

router.get('/', verificarAuth, usuarioControlador.listar);
router.get('/:id', verificarAuth, usuarioControlador.obtener);
router.patch('/:id/rol', verificarAuth, requerirRol('superadmin', 'admin'), usuarioControlador.actualizarRol);

module.exports = router;
