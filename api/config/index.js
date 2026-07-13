// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Agregador de configuraciones
// ═══════════════════════════════════════════════════════════════════════════

const baseDatos = require('./database');
const firebase = require('./firebase');

module.exports = {
  baseDatos,
  firebase,
  entorno: {
    nodeEnv: process.env.NODE_ENV || 'development',
    puerto: parseInt(process.env.PORT, 10) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
