const { Pool } = require('pg');

const poolPostgres = new Pool({
  user: process.env.POSTGRES_USUARIO,
  password: process.env.POSTGRES_CONTRASENA,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PUERTO || '5432'),
  database: process.env.POSTGRES_BASE_DE_DATOS,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function probarConexion() {
  const cliente = await poolPostgres.connect();
  const resultado = await cliente.query('SELECT NOW() as ahora');
  cliente.release();
  return resultado.rows[0].ahora;
}

async function consulta(sql, parametros = []) {
  const resultado = await poolPostgres.query(sql, parametros);
  return resultado;
}

async function transaccion(operaciones) {
  const cliente = await poolPostgres.connect();
  try {
    await cliente.query('BEGIN');
    const resultados = [];
    for (const op of operaciones) {
      const res = await cliente.query(op.sql, op.parametros || []);
      resultados.push(res);
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

module.exports = {
  poolPostgres,
  probarConexion,
  consulta,
  transaccion
};
