const { consulta } = require('../configuracion/base_de_datos');

class ArbolControlador {

  // GET /api/v1/arbol - Arbol academico completo (grupos, cursos, temas, subtemas)
  async obtenerArbol(req, res) {
    try {
      const institucion_id = req.institucion_id || req.query.institucion_id || req.contexto_institucion?.institucion_id;
      
      if (!institucion_id) {
        return res.status(400).json({ error: 'institucion_id requerido', codigo: 'SIN_INSTITUCION' });
      }

      // Grupos academicos
      const grupos = await consulta(
        `SELECT grupo_id, nombre_grupo, descripcion, orden, estado 
         FROM grupos_academicos 
         WHERE institucion_id = $1 AND estado != 'archived' 
         ORDER BY orden`,
        [institucion_id]
      );

      // Cursos
      const cursos = await consulta(
        `SELECT curso_id, grupo_id, nombre_curso, descripcion, orden, estado 
         FROM cursos 
         WHERE institucion_id = $1 AND estado != 'archived' 
         ORDER BY orden`,
        [institucion_id]
      );

      // Temas (via JOIN con cursos para filtrar por institucion)
      const temas = await consulta(
        `SELECT t.tema_id, t.curso_id, t.nombre_tema, t.orden, t.estado 
         FROM temas t 
         JOIN cursos c ON t.curso_id = c.curso_id 
         WHERE c.institucion_id = $1 AND t.estado != 'archived' AND c.estado != 'archived' 
         ORDER BY t.orden`,
        [institucion_id]
      );

      // Subtemas
      const subtemas = await consulta(
        `SELECT s.subtema_id, s.tema_id, s.nombre_subtema, s.orden, s.estado 
         FROM subtemas s 
         JOIN temas t ON s.tema_id = t.tema_id 
         JOIN cursos c ON t.curso_id = c.curso_id 
         WHERE c.institucion_id = $1 AND s.estado != 'archived' AND t.estado != 'archived' AND c.estado != 'archived' 
         ORDER BY s.orden`,
        [institucion_id]
      );

      // Ensamblar arbol
      const arbol = grupos.rows.map(g => ({
        ...g,
        hijos: cursos.rows
          .filter(c => c.grupo_id === g.grupo_id)
          .map(c => ({
            ...c,
            hijos: temas.rows
              .filter(t => t.curso_id === c.curso_id)
              .map(t => ({
                ...t,
                hijos: subtemas.rows.filter(s => s.tema_id === t.tema_id)
              }))
          }))
      }));

      res.json({ 
        exito: true,
        datos: arbol, 
        total_grupos: grupos.rows.length,
        total_cursos: cursos.rows.length,
        total_temas: temas.rows.length,
        total_subtemas: subtemas.rows.length
      });

    } catch (error) {
      console.error('Error arbol:', error);
      res.status(500).json({ error: error.message, codigo: 'ERROR_INTERNO' });
    }
  }

}

module.exports = new ArbolControlador();
