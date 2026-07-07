const { consulta } = require('../configuracion/base_de_datos');

class ArbolRepositorio {

  async obtenerGrupos(institucionId) {
    const result = await consulta(
      `SELECT grupo_id, nombre_grupo, descripcion, orden, estado 
       FROM grupos_academicos 
       WHERE institucion_id = $1 AND estado != 'archived' 
       ORDER BY orden`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerCursos(institucionId) {
    const result = await consulta(
      `SELECT curso_id, grupo_id, nombre_curso, descripcion, orden, estado 
       FROM cursos 
       WHERE institucion_id = $1 AND estado != 'archived' 
       ORDER BY orden`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerTemas(institucionId) {
    const result = await consulta(
      `SELECT t.tema_id, t.curso_id, t.nombre_tema, t.orden, t.estado 
       FROM temas t 
       JOIN cursos c ON t.curso_id = c.curso_id 
       WHERE c.institucion_id = $1 AND t.estado != 'archived' AND c.estado != 'archived' 
       ORDER BY t.orden`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerSubtemas(institucionId) {
    const result = await consulta(
      `SELECT s.subtema_id, s.tema_id, s.nombre_subtema, s.orden, s.estado 
       FROM subtemas s 
       JOIN temas t ON s.tema_id = t.tema_id 
       JOIN cursos c ON t.curso_id = c.curso_id 
       WHERE c.institucion_id = $1 AND s.estado != 'archived' AND t.estado != 'archived' AND c.estado != 'archived' 
       ORDER BY s.orden`,
      [institucionId]
    );
    return result.rows;
  }
}

module.exports = new ArbolRepositorio();
