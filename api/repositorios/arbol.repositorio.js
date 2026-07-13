const { query } = require('../config/database');

class ArbolRepositorio {
  async obtenerArbolCompleto(institucionId) {
    const sql = `
      SELECT 
        g.grupo_id,
        g.nombre_grupo,
        g.orden as grupo_orden,
        c.curso_id,
        c.nombre_curso as curso_titulo,
        c.descripcion as curso_slug,
        c.orden as curso_orden,
        t.tema_id,
        t.nombre_tema as tema_titulo,
        t.orden as tema_orden,
        st.subtema_id,
        st.nombre_subtema as subtema_titulo,
        st.orden as subtema_orden,
        te.teoria_id,
        te.titulo_teoria as teoria_titulo,
        te.orden as teoria_orden,
        m.material_id,
        m.nombre_material as material_titulo,
        m.tipo_material as material_tipo,
        m.url_archivo as material_url
      FROM grupos_academicos g
      LEFT JOIN cursos c ON c.grupo_id = g.grupo_id AND c.estado = 'active'
      LEFT JOIN temas t ON t.curso_id = c.curso_id AND t.estado = 'active'
      LEFT JOIN subtemas st ON st.tema_id = t.tema_id AND st.estado = 'active'
      LEFT JOIN teorias te ON te.subtema_id = st.subtema_id
      LEFT JOIN materiales m ON m.subtema_id = st.subtema_id
      WHERE g.institucion_id = $1 AND g.estado = 'active'
      ORDER BY g.orden, c.orden, t.orden, st.orden, te.orden, m.material_id
    `;
    return await query(sql, [institucionId]);
  }

  async obtenerGrupos(institucionId) {
    const sql = `
      SELECT grupo_id, institucion_id, nombre_grupo, descripcion, orden, estado, creado_en
      FROM grupos_academicos
      WHERE institucion_id = $1 AND estado = 'active'
      ORDER BY orden ASC
    `;
    return await query(sql, [institucionId]);
  }
}

module.exports = new ArbolRepositorio();
