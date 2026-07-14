// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio Base (queries genericas reutilizables)
// Todas las queries usan parametrizacion para prevenir SQL injection.
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');

class RepositorioBase {
  constructor(nombreTabla, columnas = []) {
    this.nombreTabla = nombreTabla;
    this.columnas = columnas;
  }

  async listarTodos(limite = 100, offset = 0) {
    const sql = `SELECT * FROM ${this.nombreTabla} ORDER BY id DESC LIMIT $1 OFFSET $2`;
    return await query(sql, [limite, offset]);
  }

  async obtenerPorId(id) {
    const sql = `SELECT * FROM ${this.nombreTabla} WHERE id = $1 LIMIT 1`;
    const resultado = await query(sql, [id]);
    return resultado.rows[0] || null;
  }

  async obtenerPorCampo(campo, valor) {
    const sql = `SELECT * FROM ${this.nombreTabla} WHERE ${campo} = $1 LIMIT 1`;
    const resultado = await query(sql, [valor]);
    return resultado.rows[0] || null;
  }

  async crear(datos) {
    const campos = Object.keys(datos).filter(k => this.columnas.includes(k));
    const valores = campos.map(k => datos[k]);
    const marcadores = campos.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO ${this.nombreTabla} (${campos.join(', ')}) VALUES (${marcadores}) RETURNING *`;
    const resultado = await query(sql, valores);
    return resultado.rows[0];
  }

  async actualizar(id, datos) {
    const campos = Object.keys(datos).filter(k => this.columnas.includes(k) && k !== 'id');
    if (campos.length === 0) return null;
    const valores = campos.map(k => datos[k]);
    const setClause = campos.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const sql = `UPDATE ${this.nombreTabla} SET ${setClause}, actualizado_en = NOW() WHERE id = $${campos.length + 1} RETURNING *`;
    const resultado = await query(sql, [...valores, id]);
    return resultado.rows[0] || null;
  }

  async eliminar(id) {
    const sql = `DELETE FROM ${this.nombreTabla} WHERE id = $1 RETURNING id`;
    const resultado = await query(sql, [id]);
    return resultado.rows[0] || null;
  }

  async contar() {
    const sql = `SELECT COUNT(*) as total FROM ${this.nombreTabla}`;
    const resultado = await query(sql);
    return parseInt(resultado.rows[0].total, 10);
  }

  async existe(campo, valor) {
    const sql = `SELECT EXISTS(SELECT 1 FROM ${this.nombreTabla} WHERE ${campo} = $1) as existe`;
    const resultado = await query(sql, [valor]);
    return resultado.rows[0].existe;
  }
}

module.exports = { RepositorioBase };
