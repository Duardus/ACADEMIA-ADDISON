const arbolRepositorio = require('./arbol.repositorio');
const { ErrorValidacion } = require('../errores/AppError');

class ArbolServicio {

  validarInstitucionId(institucionId) {
    if (!institucionId) {
      throw new ErrorValidacion('institucion_id requerido', 'SIN_INSTITUCION');
    }
  }

  construirArbolJerarquico(grupos, cursos, temas, subtemas) {
    return grupos.map(g => ({
      ...g,
      hijos: cursos
        .filter(c => c.grupo_id === g.grupo_id)
        .map(c => ({
          ...c,
          hijos: temas
            .filter(t => t.curso_id === c.curso_id)
            .map(t => ({
              ...t,
              hijos: subtemas.filter(s => s.tema_id === t.tema_id)
            }))
        }))
    }));
  }

  async obtenerArbol(institucionId) {
    this.validarInstitucionId(institucionId);

    const [grupos, cursos, temas, subtemas] = await Promise.all([
      arbolRepositorio.obtenerGrupos(institucionId),
      arbolRepositorio.obtenerCursos(institucionId),
      arbolRepositorio.obtenerTemas(institucionId),
      arbolRepositorio.obtenerSubtemas(institucionId)
    ]);

    const arbol = this.construirArbolJerarquico(grupos, cursos, temas, subtemas);

    return {
      datos: arbol,
      totales: {
        grupos: grupos.length,
        cursos: cursos.length,
        temas: temas.length,
        subtemas: subtemas.length
      }
    };
  }
}

module.exports = new ArbolServicio();
