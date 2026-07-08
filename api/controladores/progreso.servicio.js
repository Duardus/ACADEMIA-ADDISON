const repositorio = require('./progreso.repositorio');
const { ErrorValidacion } = require('../errores/AppError');

class ProgresoServicio {

  async obtenerProgreso(alumnoId) {
    if (!alumnoId) {
      throw new ErrorValidacion('Alumno requerido', 'SIN_ALUMNO');
    }

    const progreso = await repositorio.obtenerProgresoPorAlumno(alumnoId);

    return progreso.map(p => {
      const porcentaje = p.total_temas > 0 
        ? Math.round((p.temas_completados / p.total_temas) * 100) 
        : 0;
      
      return {
        curso_id: p.curso_id,
        nombre_curso: p.nombre_curso,
        temas_completados: parseInt(p.temas_completados),
        total_temas: parseInt(p.total_temas),
        porcentaje: porcentaje,
        xp_total: parseInt(p.xp_total)
      };
    });
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
