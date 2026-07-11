/* ============================================
   ARCHIVO: usuarios.eventos.js
   MODULO: usuarios
   ============================================ */

async function iniciarUsuarios({ onVolver, onError, onToast }) {
  try {
    const datosSesion = obtenerUsuario();
    const esSuperadmin = datosSesion?.rol === 'superadmin' || datosSesion?.nivel === 0;
    
    const respuesta = await apiObtenerSubordinados();
    
    // El backend devuelve { exito: true, datos: { total, subordinados, mi_nivel } }
    // O directamente { total, subordinados, mi_nivel }
    const datos = respuesta?.datos || respuesta;
    const subordinados = datos?.subordinados || datos || [];
    
    renderizarUsuarios({
      subordinados,
      esSuperadmin,
      onCrear: () => manejarCrear({ onVolver, onError, onToast }),
      onReactivar: (id) => manejarReactivar({ id, onVolver, onError, onToast }),
      onDesactivar: (id) => manejarDesactivar({ id, onVolver, onError, onToast }),
      onEliminarCompleto: (id) => manejarEliminarCompleto({ id, onVolver, onError, onToast }),
      onCapacidades: (id) => manejarCapacidades({ id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    onError(error.message || 'Error cargando usuarios');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
  try {
    const respInstituciones = await apiObtenerInstituciones().catch(() => ({ datos: { instituciones: [] } }));
    
    const institucionesRaw = respInstituciones?.datos || respInstituciones || {};
    const instituciones = institucionesRaw.instituciones || institucionesRaw || [];
    
    renderizarModalCrearUsuario({
      instituciones,
      salones: [],
      onGuardar: async (datos) => {
        try {
          await apiCrearSubordinado(datos);
          onToast('Usuario creado correctamente', 'exito');
          iniciarUsuarios({ onVolver, onError, onToast });
        } catch (error) {
          onError(error.message || 'Error creando usuario');
        }
      },
      onCancelar: () => {}
    });
  } catch (error) {
    onError(error.message || 'Error cargando datos');
  }
}

async function manejarReactivar({ id, onVolver, onError, onToast }) {
  const confirmacion = confirm('¿Reactivar este usuario?');
  if (!confirmacion) return;
  
  try {
    await apiCambiarEstadoSubordinado(id, 'active');
    onToast('Usuario reactivado', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error reactivando usuario');
  }
}

async function manejarDesactivar({ id, onVolver, onError, onToast }) {
  const confirmacion = confirm('¿Desactivar este usuario?');
  if (!confirmacion) return;
  
  try {
    await apiDesactivarSubordinado(id);
    onToast('Usuario desactivado', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    console.error('Error desactivando:', error);
    onError(error.message || 'Error desactivando usuario');
  }
}

async function manejarEliminarCompleto({ id, onVolver, onError, onToast }) {
  const confirmacion = confirm('⚠️ ¿ELIMINAR PERMANENTEMENTE?\n\nEsta acción NO se puede deshacer.\n\n¿Estás seguro?');
  if (!confirmacion) {
    onToast('Eliminación cancelada', 'advertencia');
    return;
  }
  
  // Segunda confirmación con prompt
  const segunda = prompt('Escribe ELIMINAR para confirmar:');
  if (segunda !== 'ELIMINAR') {
    onToast('Eliminación cancelada', 'advertencia');
    return;
  }
  
  try {
    await apiEliminarSubordinadoCompleto(id);
    onToast('Usuario eliminado permanentemente', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    console.error('Error eliminando:', error);
    onError(error.message || 'Error eliminando usuario');
  }
}

async function manejarCapacidades({ id, onVolver, onError, onToast }) {
  try {
    const [respCapacidades, respSubordinados] = await Promise.all([
      apiObtenerCapacidades(),
      apiObtenerSubordinados()
    ]);
    
    const datosSub = respSubordinados?.datos || respSubordinados;
    const subordinados = datosSub?.subordinados || datosSub || [];
    
    const capacidadesRaw = respCapacidades?.datos || respCapacidades || {};
    const capacidades = capacidadesRaw.capacidades || capacidadesRaw || [];
    
    const subordinado = subordinados.find(s => 
      (s.sub_membresia_id || s.membresia_id) == id
    );
    
    if (!subordinado) {
      onError('Usuario no encontrado');
      return;
    }
    
    const capsActuales = (subordinado.capacidades || []).map(c => c.codigo || c.capacidad_id);
    
    renderizarModalCapacidades({
      subordinado,
      capacidadesDisponibles: capacidades,
      capacidadesActuales: capsActuales,
      onGuardar: async (seleccionadas) => {
        try {
          await apiModificarCapacidades(id, seleccionadas);
          onToast('Capacidades actualizadas', 'exito');
          iniciarUsuarios({ onVolver, onError, onToast });
        } catch (error) {
          onError(error.message || 'Error actualizando capacidades');
        }
      },
      onCancelar: () => {}
    });
  } catch (error) {
    console.error('Error capacidades:', error);
    onError(error.message || 'Error cargando capacidades');
  }
}
