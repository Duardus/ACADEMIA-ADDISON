// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio del Arbol Academico (nombres reales de BD)
// Tablas: grupos_academicos, cursos, temas, subtemas, teorias, materiales
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');

class ArbolRepositorio {
  async obtenerArbolCompleto(institucionId) {
    const sql = `
      SELECT 
        g.grupo_id,
        g.nombre_grupo,
        g.orden as grupo_orden,
        c.curso_id,
        c.titulo as curso_titulo,
        c.slug as curso_slug,
        c.orden as curso_orden,
        t.tema_id,
        t.titulo as tema_titulo,
        t.orden as tema_orden,
        st.subtema_id,
        st.titulo as subtema_titulo,
        st.orden as subtema_orden,
        te.teoria_id,
        te.titulo as teoria_titulo,
        te.orden as teoria_orden,
        m.material_id,
        m.titulo as material_titulo,
        m.tipo as material_tipo,
        m.url as material_url,
        m.orden as material_orden
      FROM grupos_academicos g
      LEFT JOIN cursos c ON c.grupo_id = g.grupo_id AND c.estado = true
      LEFT JOIN temas t ON t.curso_id = c.curso_id AND t.estado = true
      LEFT JOIN subtemas st ON st.tema_id = t.tema_id AND st.estado = true
      LEFT JOIN teorias te ON te.subtema_id = st.subtema_id AND te.estado = true
      LEFT JOIN materiales m ON m.teoria_id = te.teoria_id AND m.estado = true
      WHERE g.institucion_id = $1 AND g.estado = true
      ORDER BY g.orden, c.orden, t.orden, st.orden, te.orden, m.orden
    `;
    return await query(sql, [institucionId]);
  }

  async obtenerGrupos(institucionId) {
    const sql = `
      SELECT grupo_id, institucion_id, nombre_grupo, descripcion, orden, estado, creado_en
      FROM grupos_academicos 
      WHERE institucion_id = $1 AND estado = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [institucionId]);
  }

  async obtenerTemasPorCurso(cursoId) {
    const sql = `
      SELECT tema_id, curso_id, titulo, orden, estado, creado_en
      FROM temas 
      WHERE curso_id = $1 AND estado = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [cursoId]);
  }

  async obtenerSubtemasPorTema(temaId) {
    const sql = `
      SELECT subtema_id, tema_id, titulo, orden, estado, creado_en
      FROM subtemas 
      WHERE tema_id = $1 AND estado = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [temaId]);
  }

  async obtenerTeoriasPorSubtema(subtemaId) {
    const sql = `
      SELECT teoria_id, subtema_id, titulo, orden, estado, creado_en
      FROM teorias 
      WHERE subtema_id = $1 AND estado = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [subtemaId]);
  }

  async obtenerMaterialesPorTeoria(teoriaId) {
    const sql = `
      SELECT material_id, teoria_id, titulo, tipo, url, orden, estado, creado_en
      FROM materiales 
      WHERE teoria_id = $1 AND estado = true 
      ORDER BY orden ASC
    `;
    return await query(sql, [teoriaId]);
  }
}

module.exports = new ArbolRepositorio();
