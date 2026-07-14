const repositorio = require('./progreso.repositorio');
const { ErrorValidacion } = require('../errores/AppError');

class ProgresoServicio {

  async obtenerProgreso(usuarioId, rol, institucionId) {
    if (!usuarioId) {
      throw new ErrorValidacion('Usuario requerido', 'SIN_USUARIO');
    }

    // Admin ve progreso de todos los alumnos de la institucion
    if (['superadmin', 'director', 'professor'].includes(rol)) {
      const progreso = await repositorio.obtenerProgresoPorInstitucion(institucionId);
      return this._formatearProgreso(progreso, true);
    }

    // Alumno ve solo su progreso
    const progreso = await repositorio.obtenerProgresoPorAlumno(usuarioId);
    return this._formatearProgreso(progreso, false);
  }

  _formatearProgreso(progreso, esAdmin) {
    const agrupado = {};
    
    progreso.forEach(p => {
      const key = p.curso_id;
      if (!agrupado[key]) {
        agrupado[key] = {
          curso_id: p.curso_id,
          nombre_curso: p.nombre_curso,
          temas_completados: 0,
          total_temas: 0,
          xp_total: 0,
          alumnos: esAdmin ? [] : undefined
        };
      }
      
      agrupado[key].total_temas += parseInt(p.total_temas) || 1;
      agrupado[key].temas_completados += parseInt(p.temas_completados) || 0;
      agrupado[key].xp_total += parseInt(p.xp_total) || 0;
      
      if (esAdmin && p.alumno_id) {
        agrupado[key].alumnos.push({
          alumno_id: p.alumno_id,
          nombre: p.nombre_alumno,
          temas_completados: parseInt(p.temas_completados),
          total_temas: parseInt(p.total_temas)
        });
      }
    });

    return Object.values(agrupado).map(c => ({
      ...c,
      porcentaje: c.total_temas > 0 ? Math.round((c.temas_completados / c.total_temas) * 100) : 0
    }));
  }

  async obtenerDetalleCurso(alumnoId, cursoId) {
    if (!alumnoId || !cursoId) {
      throw new ErrorValidacion('Alumno y curso requeridos', 'CAMPOS_INCOMPLETOS');
    }
    return await repositorio.obtenerProgresoDetalle(alumnoId, cursoId);
  }

  async completarTeoria(alumnoId, teoriaId, cursoId) {
    if (!alumnoId || !teoriaId || !cursoId) {
      throw new ErrorValidacion('Todos los campos requeridos', 'CAMPOS_INCOMPLETOS');
    }
    await repositorio.marcarTeoriaCompletada(alumnoId, teoriaId, cursoId, 10);
    return { teoria_id: teoriaId, completado: true, xp_ganado: 10 };
  }
}

module.exports = new ProgresoServicio();
