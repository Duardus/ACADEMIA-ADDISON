// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas de Passkeys
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const passkeyControlador = require('../controladores/passkey.controlador');

// Registro
router.post('/registro/opciones', (req, res, next) => passkeyControlador.opcionesRegistro(req, res, next));
router.post('/registro/verificar', (req, res, next) => passkeyControlador.verificarRegistro(req, res, next));

// Login
router.post('/login/opciones', (req, res, next) => passkeyControlador.opcionesLogin(req, res, next));
router.post('/login/verificar', (req, res, next) => passkeyControlador.verificarLogin(req, res, next));

// Recuperación
router.post('/recuperacion', (req, res, next) => passkeyControlador.solicitarRecuperacion(req, res, next));
router.post('/recuperacion/verificar', (req, res, next) => passkeyControlador.verificarRecuperacion(req, res, next));

module.exports = router;
