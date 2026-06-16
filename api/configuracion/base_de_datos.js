const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function consulta(sql, parametros = []) {
  const cliente = await pool.connect();
  try {
    const resultado = await cliente.query(sql, parametros);
    return resultado;
  } finally {
    cliente.release();
  }
}

async function transaccion(operaciones) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultados = [];
    for (const op of operaciones) {
      const resultado = await cliente.query(op.sql, op.parametros);
      resultados.push(resultado);
    }
    await cliente.query('COMMIT');
    return resultados;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { consulta, transaccion, pool };
