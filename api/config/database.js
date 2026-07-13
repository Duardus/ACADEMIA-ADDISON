// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Conexion PostgreSQL con Pool
// ═══════════════════════════════════════════════════════════════════════════

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const configuracionPool = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'academia_addison',
  user: process.env.DB_USER || 'addison',
  password: process.env.DB_PASSWORD || 'addison',
  max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(configuracionPool);

pool.on('connect', () => {
  console.log('[DB] Nueva conexion establecida al pool PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool:', err.message);
});

async function probarConexion() {
  let cliente;
  try {
    cliente = await pool.connect();
    const resultado = await cliente.query('SELECT NOW() as hora_servidor, current_database() as base_datos');
    console.log('[DB] ✅ Conexion OK —', resultado.rows[0].base_datos, '@', resultado.rows[0].hora_servidor);
    return true;
  } catch (error) {
    console.error('[DB] ❌ Fallo conexion:', error.message);
    return false;
  } finally {
    if (cliente) cliente.release();
  }
}

module.exports = {
  pool,
  probarConexion,
  query: (texto, parametros) => pool.query(texto, parametros),
};
