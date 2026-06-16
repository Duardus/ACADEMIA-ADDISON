const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USUARIO || 'addison',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_BASE_DE_DATOS || 'academia_addison',
  password: process.env.POSTGRES_CONTRASENA || '',
  port: parseInt(process.env.POSTGRES_PUERTO) || 5432,
  ssl: false
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
