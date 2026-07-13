// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio del Arbol Academico (jerarquia completa)
// Grupos -> Cursos -> Temas -> Subtemas -> Teorias -> Materiales
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');

class ArbolRepositorio {
  async obtenerArbolCompleto(institucionId) {
    const sql = `
      SELECT 
        g.id as grupo_id,
        g.nombre as grupo_nombre,
        g.orden as grupo_orden,
        c.id as curso_id,
        c.titulo as curso_titulo,
        c.slug as curso_slug,
        c.orden as curso_orden,
        t.id as tema_id,
        t.titulo as tema_titulo,
        t.orden as tema_orden,
        st.id as subtema_id,
        st.titulo as subtema_titulo,
        st.orden as subtema_orden,
        te.id as teoria_id,
        te.titulo as teoria_titulo,
        te.orden as teoria_orden,
        m.id as material_id,
        m.titulo as material_titulo,
        m.tipo as material_tipo,
        m.url as material_url,
        m.orden as material_orden
      FROM grupos g
      LEFT JOIN cursos c ON c.grupo_id = g.id AND c.activo = true
      LEFT JOIN temas t ON t.curso_id = c.id AND t.activo = true
      LEFT JOIN subtemas st ON st.tema_id = t.id AND st.activo = true
      LEFT JOIN teorias te ON te.subtema_id = st.id AND te.activo = true
      LEFT JOIN materiales m ON m.teoria_id = te.id AND m.activo = true
      WHERE g.institucion_id = $1 AND g.activo = true
      ORDER BY g.orden, c.orden, t.orden, st.orden, te.orden, m.orden
    `;
    return await query(sql, [institucionId]);
  }

  async obtenerGrupos(institucionId) {
    const sql = `
      SELECT * FROM grupos 
      WHERE institucion_id = $1 AND activo = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [institucionId]);
  }

  async obtenerTemasPorCurso(cursoId) {
    const sql = `
      SELECT * FROM temas 
      WHERE curso_id = $1 AND activo = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [cursoId]);
  }

  async obtenerSubtemasPorTema(temaId) {
    const sql = `
      SELECT * FROM subtemas 
      WHERE tema_id = $1 AND activo = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [temaId]);
  }

  async obtenerTeoriasPorSubtema(subtemaId) {
    const sql = `
      SELECT * FROM teorias 
      WHERE subtema_id = $1 AND activo = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [subtemaId]);
  }

  async obtenerMaterialesPorTeoria(teoriaId) {
    const sql = `
      SELECT * FROM materiales 
      WHERE teoria_id = $1 AND activo = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [teoriaId]);
  }
}

module.exports = new ArbolRepositorio();
