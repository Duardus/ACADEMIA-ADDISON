// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Agregador de Rutas
// ═══════════════════════════════════════════════════════════════════════════

const express = require('express');

function configurarRutas(app) {
  app.use('/api/v1/auth', require('./auth.rutas'));
  app.use('/api/v1/arbol', require('./arbol.rutas'));
  app.use('/api/v1/usuarios', require('./usuario.rutas'));

  // Health check
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      exito: true,
      mensaje: 'API ACADEMIA-ADDISON operativa',
      timestamp: new Date().toISOString(),
      version: '3.0.0-phoenix',
    });
  });
}

module.exports = { configurarRutas };
