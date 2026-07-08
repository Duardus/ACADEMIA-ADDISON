const { consulta } = require('../configuracion/base_de_datos');

class ProgresoRepositorio {

  async obtenerProgresoPorAlumno(alumnoId) {
    const result = await consulta(
      `SELECT p.curso_id, c.nombre_curso, p.alumno_id, u.nombre_completo as nombre_alumno,
              COUNT(*) FILTER (WHERE p.completado = true) as temas_completados,
              COUNT(*) as total_temas,
              SUM(p.xp_ganado) as xp_total
       FROM progreso_alumno p
       JOIN cursos c ON p.curso_id = c.curso_id
       JOIN usuarios u ON p.alumno_id = u.usuario_id
       WHERE p.alumno_id = $1
       GROUP BY p.curso_id, c.nombre_curso, p.alumno_id, u.nombre_completo`,
      [alumnoId]
    );
    return result.rows;
  }

  async obtenerProgresoPorInstitucion(institucionId) {
    const result = await consulta(
      `SELECT p.curso_id, c.nombre_curso, p.alumno_id, u.nombre_completo as nombre_alumno,
              COUNT(*) FILTER (WHERE p.completado = true) as temas_completados,
              COUNT(*) as total_temas,
              SUM(p.xp_ganado) as xp_total
       FROM progreso_alumno p
       JOIN cursos c ON p.curso_id = c.curso_id
       JOIN usuarios u ON p.alumno_id = u.usuario_id
       WHERE c.institucion_id = $1
       GROUP BY p.curso_id, c.nombre_curso, p.alumno_id, u.nombre_completo
       ORDER BY c.nombre_curso, u.nombre_completo`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerProgresoDetalle(alumnoId, cursoId) {
    const result = await consulta(
      `SELECT p.teoria_id, t.nombre_teoria, p.completado, p.xp_ganado, p.completado_en
       FROM progreso_alumno p
       JOIN teorias t ON p.teoria_id = t.teoria_id
       WHERE p.alumno_id = $1 AND p.curso_id = $2
       ORDER BY p.completado_en DESC`,
      [alumnoId, cursoId]
    );
    return result.rows;
  }

  async marcarTeoriaCompletada(alumnoId, teoriaId, cursoId, xp) {
    await consulta(
      `INSERT INTO progreso_alumno (alumno_id, teoria_id, curso_id, completado, xp_ganado, completado_en)
       VALUES ($1, $2, $3, true, $4, NOW())
       ON CONFLICT (alumno_id, teoria_id) 
       DO UPDATE SET completado = true, xp_ganado = $4, completado_en = NOW()`,
      [alumnoId, teoriaId, cursoId, xp || 10]
    );
  }
}

module.exports = new ProgresoRepositorio();
