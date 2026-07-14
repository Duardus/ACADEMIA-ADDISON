const permisosRepositorio = require('./permisos.repositorio');
const { ErrorValidacion } = require('../errores/AppError');

class PermisosServicio {

  // ============================================
  // CONSTRUIR: Árbol filtrado por permisos del usuario
  // ============================================
  async construirArbolPermitido(usuarioId, institucionId, nivel) {
    const [cursos, temas, subtemas] = await Promise.all([
      permisosRepositorio.obtenerCursosPermitidos(usuarioId, institucionId, nivel),
      permisosRepositorio.obtenerTemasPermitidos(usuarioId, institucionId, nivel),
      permisosRepositorio.obtenerSubtemasPermitidos(usuarioId, institucionId, nivel)
    ]);

    return this.ensamblarArbol(cursos, temas, subtemas);
  }

  ensamblarArbol(cursos, temas, subtemas) {
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

  // ============================================
  // VERIFICAR: Si puede crear subordinados
  // ============================================
  async verificarPuedeCrearSubordinados(membresiaId) {
    return await permisosRepositorio.puedeCrearSubordinados(membresiaId);
  }

  // ============================================
  // OBTENER: Subordinados de un usuario
  // ============================================
  async obtenerSubordinados(creadorMembresiaId) {
    return await permisosRepositorio.obtenerSubordinados(creadorMembresiaId);
  }

  // ============================================
  // OBTENER: Salones de un usuario
  // ============================================
  async obtenerSalonesUsuario(usuarioId, institucionId) {
    return await permisosRepositorio.obtenerSalonesUsuario(usuarioId, institucionId);
  }
}

module.exports = new PermisosServicio();
