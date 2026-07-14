// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Rutas de Sesion
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const { verificarAuth } = require('../middlewares/verificar_auth');

router.get('/verificar', verificarAuth, (req, res) => {
  res.json({
    exito: true,
    usuario: req.usuario,
    mensaje: 'Sesion valida'
  });
});

module.exports = router;
