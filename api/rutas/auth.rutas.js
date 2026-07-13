// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas de Autenticacion
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const authControlador = require('../controladores/auth.controlador');
const { verificarAuth } = require('../middlewares/verificar_auth');

router.post('/login', authControlador.login);
router.get('/perfil', verificarAuth, authControlador.perfil);

module.exports = router;
