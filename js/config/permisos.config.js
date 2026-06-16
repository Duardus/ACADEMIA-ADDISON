/* ============================================
   🔑 PERMISOS POR ROL - Qué ve cada usuario
   ============================================ */

const PERMISOS = {
  superadmin: {
    puedeCrear: ['institucion', 'director', 'profesor', 'auxiliar', 'alumno'],
    puedeEditar: ['todo'],
    puedeEliminar: ['todo'],
    puedeVer: ['arbol', 'usuarios', 'finanzas', 'reportes', 'clases', 'grabaciones', 'configuracion'],
    puedeSupervisar: true,
    modoFantasma: true,
    descargarGrabaciones: true
  },
  director: {
    puedeCrear: ['grupo', 'curso', 'tema', 'subtema', 'teoria', 'examen', 'pregunta', 'profesor', 'auxiliar', 'alumno'],
    puedeEditar: ['todo_institucion'],
    puedeEliminar: ['todo_institucion'],
    puedeVer: ['arbol', 'usuarios', 'finanzas_institucion', 'reportes', 'clases', 'grabaciones'],
    puedeSupervisar: true,
    modoFantasma: true,
    descargarGrabaciones: false
  },
  auxiliary: {
    puedeCrear: [], // Se define por keychain
    puedeEditar: [],
    puedeEliminar: [],
    puedeVer: [], // Se define por keychain
    puedeSupervisar: false,
    modoFantasma: false,
    descargarGrabaciones: false
  },
  professor: {
    puedeCrear: ['teoria', 'examen', 'pregunta', 'material'],
    puedeEditar: ['sus_cursos', 'sus_preguntas'],
    puedeEliminar: ['sus_preguntas_borrador'],
    puedeVer: ['horario', 'sus_cursos', 'notas_alumnos', 'reportes_clases'],
    puedeSupervisar: false,
    modoFantasma: false,
    descargarGrabaciones: false
  },
  student: {
    puedeCrear: [],
    puedeEditar: [],
    puedeEliminar: [],
    puedeVer: ['sus_cursos', 'teorias', 'examenes', 'progreso', 'ranking', 'calendario'],
    puedeSupervisar: false,
    modoFantasma: false,
    descargarGrabaciones: false
  }
};

// Helper para verificar permisos
function tienePermiso(rol, accion, recurso) {
  if (!PERMISOS[rol]) return false;
  const permisos = PERMISOS[rol];
  
  if (accion === 'ver') return permisos.puedeVer.includes(recurso) || permisos.puedeVer.includes('todo');
  if (accion === 'crear') return permisos.puedeCrear.includes(recurso) || permisos.puedeCrear.includes('todo');
  if (accion === 'editar') return permisos.puedeEditar.includes(recurso) || permisos.puedeEditar.includes('todo');
  if (accion === 'eliminar') return permisos.puedeEliminar.includes(recurso) || permisos.puedeEliminar.includes('todo');
  
  return false;
}
