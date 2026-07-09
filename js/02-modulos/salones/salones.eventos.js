/* ============================================
   ARCHIVO: salones.eventos.js
   MODULO: salones
   DEPENDENCIAS:
     - salones.api.js (HTTP)
     - salones.ui.js (renderizado)
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
    const [respSalon, respUsuarios] = await Promise.all([
      apiObtenerSalon(id),
      get(`/jerarquia/mis-subordinados`)
    ]);
    
    const datos = respSalon.datos || respSalon;
    const salon = datos.salon;
    const usuariosEnSalon = datos.usuarios || [];
    const cursosEnSalon = datos.cursos || [];
    
    // Usuarios disponibles = subordinados que NO están en el salón
    const datosSub = respUsuarios.datos || respUsuarios;
    const todosSubordinados = (datosSub.subordinados || []).filter(s => s.sub_nivel > 0);
    const idsEnSalon = new Set(usuariosEnSalon.map(u => u.membresia_id));
    const usuariosDisponibles = todosSubordinados.filter(s => !idsEnSalon.has(s.sub_membresia_id));

    renderizarDetalleSalon({
      salon, usuarios: usuariosEnSalon, cursos: cursosEnSalon, usuariosDisponibles, cursosDisponibles: [],
      onAsignarUsuario: async (membresiaId) => {
        try {
          await apiAsignarUsuario(id, { membresia_id: parseInt(membresiaId) });
          onToast('Usuario agregado', 'exito');
          manejarVerSalon({ id, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onQuitarUsuario: async (membresiaId) => {
        try {
          await apiQuitarUsuario(id, membresiaId);
          onToast('Usuario removido', 'exito');
          manejarVerSalon({ id, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onAsignarCurso: async (cursoId) => {
        try {
          await apiAsignarCurso(id, { curso_id: parseInt(cursoId) });
          onToast('Curso asignado', 'exito');
          manejarVerSalon({ id, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onQuitarCurso: async (cursoId) => {
        try {
          await apiQuitarCurso(id, cursoId);
          onToast('Curso removido', 'exito');
          manejarVerSalon({ id, institucionId, onVolver, onError, onToast });
        } catch (e) { onError(e.message); }
      },
      onVolver: () => iniciarSalones({ institucionId, institucionNombre: salon.nombre_institucion, onVolver, onError, onToast })
    });
  } catch (e) { onError(e.message); }
}
