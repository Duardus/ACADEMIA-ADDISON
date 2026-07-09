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
}

module.exports = new ArbolServicio();
