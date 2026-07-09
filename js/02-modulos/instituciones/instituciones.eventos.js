/* ============================================
   ARCHIVO: instituciones.eventos.js
   MODULO: instituciones
   DEPENDENCIAS:
     - instituciones.api.js (HTTP)
     - instituciones.ui.js (renderizado)
   ============================================ */

async function iniciarInstituciones({ onVolver, onError, onToast }) {
  try {
    const respuesta = await apiListarInstituciones();
    const datos = respuesta.datos || respuesta;
    const instituciones = datos.instituciones || datos || [];
    
    renderizarInstituciones({
      instituciones,
      onCrear: () => manejarCrear({ onVolver, onError, onToast }),
      onEditar: (id) => manejarEditar({ id, onVolver, onError, onToast }),
      onVer: (id) => manejarVer({ id, onVolver, onError, onToast }),
      onEliminar: (id) => manejarEliminar({ id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando instituciones');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
  renderizarModalCrearInstitucion({
    onGuardar: async (datos) => {
      try {
        await apiCrearInstitucion(datos);
        onToast('Institución creada correctamente', 'exito');
        iniciarInstituciones({ onVolver, onError, onToast });
      } catch (error) {
        onError(error.message || 'Error creando institución');
      }
    },
    onCancelar: () => {}
  });
}

async function manejarEditar({ id, onVolver, onError, onToast }) {
  try {
    const respuesta = await apiObtenerInstitucion(id);
    const datos = respuesta.datos || respuesta;
    const institucion = datos.institucion || datos;
    
    renderizarModalEditarInstitucion({
      institucion,
      onGuardar: async (cambios) => {
        try {
          await apiEditarInstitucion(id, cambios);
          onToast('Institución actualizada', 'exito');
          iniciarInstituciones({ onVolver, onError, onToast });
        } catch (error) {
          onError(error.message || 'Error actualizando institución');
        }
      },
      onCancelar: () => {}
    });
  } catch (error) {
    onError(error.message || 'Error cargando institución');
  }
}

async function manejarVer({ id, onVolver, onError, onToast }) {
  try {
    const respuesta = await apiObtenerInstitucion(id);
    const datos = respuesta.datos || respuesta;
    
    renderizarDetalleInstitucion({
      institucion: datos.institucion || datos,
      usuarios: datos.usuarios || [],
      onVolver: () => iniciarInstituciones({ onVolver, onError, onToast })
    });
  } catch (error) {
    onError(error.message || 'Error cargando detalle');
  }
}

async function manejarEliminar({ id, onVolver, onError, onToast }) {
  if (!confirm('¿Estás seguro de cerrar esta institución? Los usuarios perderán acceso.')) return;
  try {
    await apiEliminarInstitucion(id);
    onToast('Institución cerrada', 'exito');
    iniciarInstituciones({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error cerrando institución');
  }
}
