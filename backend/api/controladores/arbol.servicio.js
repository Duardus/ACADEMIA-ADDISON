const arbolRepositorio = require('./arbol.repositorio');
const { ErrorValidacion } = require('../errores/AppError');

class ArbolServicio {

  validarInstitucionId(institucionId) {
    if (!institucionId) {
      throw new ErrorValidacion('institucion_id requerido', 'SIN_INSTITUCION');
    }
  }

  construirArbolCursos(cursos, temas, subtemas) {
    return cursos.map(c => ({
      curso_id: c.curso_id,
      nombre: c.nombre_curso,
      descripcion: c.descripcion,
      orden: c.orden,
      estado: c.estado,
      tipo: 'curso',
      hijos: temas
        .filter(t => t.curso_id === c.curso_id)
        .map(t => ({
          tema_id: t.tema_id,
          nombre: t.nombre_tema,
          orden: t.orden,
          estado: t.estado,
          tipo: 'tema',
          hijos: subtemas
            .filter(s => s.tema_id === t.tema_id)
            .map(s => ({
              subtema_id: s.subtema_id,
              nombre: s.nombre_subtema,
              orden: s.orden,
              estado: s.estado,
              tipo: 'subtema'
            }))
        }))
    }));
  }

  async obtenerArbol(institucionId) {
    this.validarInstitucionId(institucionId);
    const [cursos, temas, subtemas] = await Promise.all([
      arbolRepositorio.obtenerCursos(institucionId),
      arbolRepositorio.obtenerTemas(institucionId),
      arbolRepositorio.obtenerSubtemas(institucionId)
    ]);
    const arbol = this.construirArbolCursos(cursos, temas, subtemas);
    return {
      datos: arbol,
      totales: {
        cursos: cursos.length,
        temas: temas.length,
        subtemas: subtemas.length
      }
    };
  }

  async crearCurso(institucionId, datos) {
    this.validarInstitucionId(institucionId);
    if (!datos.nombre_curso) {
      throw new ErrorValidacion('nombre_curso es obligatorio', 'FALTAN_DATOS');
    }
    return await arbolRepositorio.crearCurso(institucionId, datos.nombre_curso, datos.descripcion || '', datos.orden || 0);
  }

  async actualizarCurso(cursoId, datos) {
    return await arbolRepositorio.actualizarCurso(cursoId, datos.nombre_curso, datos.descripcion, datos.orden, datos.estado);
  }

  async eliminarCurso(cursoId) {
    return await arbolRepositorio.eliminarCurso(cursoId);
  }

  async crearTema(datos) {
    if (!datos.curso_id || !datos.nombre_tema) {
      throw new ErrorValidacion('curso_id y nombre_tema son obligatorios', 'FALTAN_DATOS');
    }
    return await arbolRepositorio.crearTema(datos.curso_id, datos.nombre_tema, datos.orden || 0);
  }

  async actualizarTema(temaId, datos) {
    return await arbolRepositorio.actualizarTema(temaId, datos.nombre_tema, datos.orden, datos.estado);
  }

  async eliminarTema(temaId) {
    return await arbolRepositorio.eliminarTema(temaId);
  }

  async crearSubtema(datos) {
    if (!datos.tema_id || !datos.nombre_subtema) {
      throw new ErrorValidacion('tema_id y nombre_subtema son obligatorios', 'FALTAN_DATOS');
    }
    return await arbolRepositorio.crearSubtema(datos.tema_id, datos.nombre_subtema, datos.orden || 0);
  }

  async actualizarSubtema(subtemaId, datos) {
    return await arbolRepositorio.actualizarSubtema(subtemaId, datos.nombre_subtema, datos.orden, datos.estado);
  }

  async eliminarSubtema(subtemaId) {
    return await arbolRepositorio.eliminarSubtema(subtemaId);
  }
}

module.exports = new ArbolServicio();
