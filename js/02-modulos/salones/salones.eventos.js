/* ============================================
   ARCHIVO: salones.eventos.js
   MODULO: salones
   ============================================ */

async function iniciarSalones({ institucionId, institucionNombre, onVolver, onError, onToast }) {
  try {
    const resp = await apiListarSalones(institucionId);
    const datos = resp.datos || resp;
    renderizarSalones({
      salones: datos.salones || [],
      institucionId, institucionNombre,
      onCrear: () => manejarCrearSalon({ institucionId, institucionNombre, onVolver, onError, onToast }),
      onVer: (id) => manejarVerSalon({ id, institucionId, onVolver, onError, onToast }),
      onEditar: (id) => manejarEditarSalon({ id, institucionId, institucionNombre, onVolver, onError, onToast }),
      onEliminar: (id) => manejarEliminarSalon({ id, institucionId, institucionNombre, onVolver, onError, onToast }),
      onAsignarUsuarios: (salonId) => manejarAsignarUsuarios({ salonId, institucionId, onVolver, onError, onToast }),
      onAsignarCursos: (salonId) => manejarAsignarCursos({ salonId, institucionId, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando salones');
  }
}

async function manejarCrearSalon({ institucionId, institucionNombre, onVolver, onError, onToast }) {
  renderizarModalSalon({
    salon: null,
    onGuardar: async (datos) => {
      try {
        await apiCrearSalon({ ...datos, institucion_id: institucionId });
        onToast('Salón creado', 'exito');
        iniciarSalones({ institucionId, institucionNombre, onVolver, onError, onToast });
      } catch (e) { onError(e.message); }
    },
    onCancelar: () => {}
  });
}

async function manejarEditarSalon({ id, institucionId, institucionNombre, onVolver, onError, onToast }) {
  try {
    const resp = await apiObtenerSalon(id);
    const datos = resp.datos || resp;
    renderizarModalSalon({
      salon: datos.salon,
      onGuardar: async (cambios) => {
        try {
          await apiEditarSalon(id, cambios);
          onToast('Salón actualizado', 'exito');
          iniciarSalones({ institucionId, institucionNombre, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onCancelar: () => {}
    });
  } catch (e) { onError(e.message); }
}

async function manejarEliminarSalon({ id, institucionId, institucionNombre, onVolver, onError, onToast }) {
  if (!confirm('¿Archivar este salón?')) return;
  try {
    await apiEliminarSalon(id);
    onToast('Salón archivado', 'exito');
    iniciarSalones({ institucionId, institucionNombre, onVolver, onError, onToast });
  } catch (e) { onError(e.message); }
}

async function manejarVerSalon({ id, institucionId, onVolver, onError, onToast }) {
  try {
    const resp = await apiObtenerSalon(id);
    const datos = resp.datos || resp;
    renderizarDetalleSalon({
      salon: datos.salon,
      usuarios: datos.usuarios || [],
      cursos: datos.cursos || [],
      onVolver: () => iniciarSalones({ institucionId, institucionNombre: datos.salon.nombre_institucion, onVolver, onError, onToast })
    });
  } catch (e) { onError(e.message); }
}

async function manejarAsignarUsuarios({ salonId, institucionId, onVolver, onError, onToast }) {
  try {
    const [respSalon, respUsuarios] = await Promise.all([
      apiObtenerSalon(salonId),
      apiListarUsuariosDisponibles(institucionId)
    ]);
    
    const datosSalon = respSalon.datos || respSalon;
    const datosUsuarios = respUsuarios.datos || respUsuarios;
    
    const usuariosAsignados = datosSalon.usuarios || [];
    const todosUsuarios = datosUsuarios.usuarios || [];
    
    renderizarModalAsignarUsuarios({
      usuarios: todosUsuarios,
      usuariosAsignados,
      onAsignar: async (membresiaId) => {
        try {
          await apiAsignarUsuario(salonId, { membresia_id: parseInt(membresiaId) });
          onToast('Usuario asignado', 'exito');
          manejarAsignarUsuarios({ salonId, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onQuitar: async (membresiaId) => {
        try {
          await apiQuitarUsuario(salonId, membresiaId);
          onToast('Usuario removido', 'exito');
          manejarAsignarUsuarios({ salonId, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onCerrar: () => iniciarSalones({ institucionId, institucionNombre: datosSalon.salon.nombre_institucion, onVolver, onError, onToast })
    });
  } catch (e) { onError(e.message); }
}

async function manejarAsignarCursos({ salonId, institucionId, onVolver, onError, onToast }) {
  try {
    const [respSalon, respCursos] = await Promise.all([
      apiObtenerSalon(salonId),
      apiListarCursosDisponibles(institucionId)
    ]);
    
    const datosSalon = respSalon.datos || respSalon;
    const datosCursos = respCursos.datos || respCursos;
    
    const cursosAsignados = datosSalon.cursos || [];
    const todosCursos = datosCursos.cursos || [];
    
    renderizarModalAsignarCursos({
      cursos: todosCursos,
      cursosAsignados,
      onAsignar: async (cursoId) => {
        try {
          await apiAsignarCurso(salonId, { curso_id: parseInt(cursoId) });
          onToast('Curso asignado', 'exito');
          manejarAsignarCursos({ salonId, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onQuitar: async (cursoId) => {
        try {
          await apiQuitarCurso(salonId, cursoId);
          onToast('Curso removido', 'exito');
          manejarAsignarCursos({ salonId, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onCerrar: () => iniciarSalones({ institucionId, institucionNombre: datosSalon.salon.nombre_institucion, onVolver, onError, onToast })
    });
  } catch (e) { onError(e.message); }
}
