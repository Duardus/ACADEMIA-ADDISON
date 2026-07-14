// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Agregador de Rutas
// ═══════════════════════════════════════════════════════════════════════════

function configurarRutas(app) {
  app.use('/api/v1/auth', require('./auth.rutas'));        // Legacy Firebase (temporal)
  app.use('/api/v1/sesion', require('./sesion.rutas'));
  app.use('/api/v1/passkey', require('./passkey.rutas'));  // Nuevo Passkeys
  app.use('/api/v1/arbol', require('./arbol.rutas'));
  app.use('/api/v1/usuarios', require('./usuario.rutas'));

  // Health check
  app.get('/api/v1/health', (req, res) => {
    res.status(200).json({
      exito: true,
      mensaje: 'API ACADEMIA-ADDISON operativa',
      timestamp: new Date().toISOString(),
      version: '3.1.0-passkeys',
    });
  });
}

module.exports = { configurarRutas };
