// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio de Instituciones
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');
const { RepositorioBase } = require('./base.repositorio');

const COLUMNAS_INSTITUCION = [
  'id', 'nombre', 'slug', 'logo_url', 'descripcion', 'activo',
  'creado_en', 'actualizado_en'
];

class InstitucionRepositorio extends RepositorioBase {
  constructor() {
    super('instituciones', COLUMNAS_INSTITUCION);
  }

  async obtenerPorSlug(slug) {
    const sql = `SELECT * FROM instituciones WHERE slug = $1 LIMIT 1`;
    const resultado = await query(sql, [slug]);
    return resultado.rows[0] || null;
  }

  async listarActivas(limite = 100, offset = 0) {
    const sql = `
      SELECT * FROM instituciones 
      WHERE activo = true 
      ORDER BY nombre ASC 
      LIMIT $1 OFFSET $2
    `;
    return await query(sql, [limite, offset]);
  }
}

module.exports = new InstitucionRepositorio();
