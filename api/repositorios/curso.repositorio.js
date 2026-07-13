// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio de Cursos
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');
const { RepositorioBase } = require('./base.repositorio');

const COLUMNAS_CURSO = [
  'id', 'institucion_id', 'grupo_id', 'titulo', 'slug', 'descripcion',
  'imagen_url', 'orden', 'activo', 'creado_en', 'actualizado_en'
];

class CursoRepositorio extends RepositorioBase {
  constructor() {
    super('cursos', COLUMNAS_CURSO);
  }

  async listarPorInstitucion(institucionId, limite = 100, offset = 0) {
    const sql = `
      SELECT * FROM cursos 
      WHERE institucion_id = $1 AND activo = true
      ORDER BY orden ASC, titulo ASC
      LIMIT $2 OFFSET $3
    `;
    return await query(sql, [institucionId, limite, offset]);
  }

  async listarPorGrupo(grupoId, limite = 100, offset = 0) {
    const sql = `
      SELECT * FROM cursos 
      WHERE grupo_id = $1 AND activo = true
      ORDER BY orden ASC, titulo ASC
      LIMIT $2 OFFSET $3
    `;
    return await query(sql, [grupoId, limite, offset]);
  }

  async obtenerPorSlug(slug) {
    const sql = `SELECT * FROM cursos WHERE slug = $1 LIMIT 1`;
    const resultado = await query(sql, [slug]);
    return resultado.rows[0] || null;
  }
}

module.exports = new CursoRepositorio();
