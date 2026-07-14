// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas de Autenticacion (Passkeys unicamente)
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const passkeyControlador = require('../controladores/passkey.controlador');

// Passkeys
router.post('/passkey/registro/opciones', passkeyControlador.opcionesRegistro);
router.post('/passkey/registro/verificar', passkeyControlador.verificarRegistro);
router.post('/passkey/login/opciones', passkeyControlador.opcionesLogin);
router.post('/passkey/login/verificar', passkeyControlador.verificarLogin);
router.post('/passkey/recuperar', passkeyControlador.solicitarRecuperacion);
router.post('/passkey/recuperar/verificar', passkeyControlador.verificarRecuperacion);

module.exports = router;
