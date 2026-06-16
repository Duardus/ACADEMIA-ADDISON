const { Pool } = require('pg');

const poolPostgres = new Pool({
  user: 'addison',
  password: 'Alejita*69',
  host: 'localhost',
  port: 5432,
  database: 'academia_addison',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

async function consulta(sql, parametros = []) {
  return await poolPostgres.query(sql, parametros);
}

module.exports = { consulta };
