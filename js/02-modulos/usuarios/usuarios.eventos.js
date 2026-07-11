/* ============================================
   ARCHIVO: usuarios.eventos.js
   MODULO: usuarios
   DEPENDENCIAS:
     - usuarios.api.js (HTTP)
     - usuarios.ui.js (renderizado)
   CONTRATO:
     - Orquesta carga y CRUD de usuarios
     - Recibe callback onVolver para regresar al dashboard
   ============================================ */

async function iniciarUsuarios({ onVolver, onError, onToast }) {
  try {
    const datosSesion = obtenerUsuario();
    const esSuperadmin = datosSesion?.rol === 'superadmin' || datosSesion?.nivel === 0;
    
    const respuesta = await apiObtenerSubordinados();
    
    // Manejar estructura anidada del backend: { exito: true, datos: { total, subordinados, mi_nivel } }
    const datos = respuesta.datos || respuesta;
    const subordinados = datos.subordinados || datos || [];
    
    // Mostrar TODOS los usuarios
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
    onError(error.message || 'Error cargando usuarios');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
  try {
    const [respInstituciones, respSalones] = await Promise.all([
      apiObtenerInstituciones().catch(() => ({ datos: { instituciones: [] } })),
      apiObtenerSalones().catch(() => ({ datos: { salones: [] } }))
    ]);
    
    // CORREGIDO: Extraer array de instituciones de estructura anidada
    const institucionesRaw = respInstituciones.datos || respInstituciones || {};
    const instituciones = institucionesRaw.instituciones || institucionesRaw || [];
    
    // CORREGIDO: Extraer array de salones
    const salonesRaw = respSalones.datos || respSalones || {};
    const salones = salonesRaw.salones || salonesRaw || [];
    
    renderizarModalCrearUsuario({
      instituciones,
      salones,
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
    onError(error.message || 'Error desactivando usuario');
  }
}

async function manejarEliminarCompleto({ id, onVolver, onError, onToast }) {
  const confirmacion = confirm('⚠️ ¿ELIMINAR PERMANENTEMENTE?\n\nEsta acción NO se puede deshacer.\n\n¿Estás seguro?');
  if (!confirmacion) return;
  
  const segundaConfirmacion = prompt('Escribe ELIMINAR para confirmar:');
  if (segundaConfirmacion !== 'ELIMINAR') {
    onToast('Eliminación cancelada', 'advertencia');
    return;
  }
  
  try {
    await apiEliminarSubordinadoCompleto(id);
    onToast('Usuario eliminado permanentemente', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error eliminando usuario');
  }
}

async function manejarCapacidades({ id, onVolver, onError, onToast }) {
  try {
    const [respCapacidades, respSubordinados] = await Promise.all([
      apiObtenerCapacidades(),
      apiObtenerSubordinados()
    ]);
    
    // CORREGIDO: Extraer datos de estructura anidada
    const datosSub = respSubordinados.datos || respSubordinados;
    const subordinados = datosSub.subordinados || datosSub || [];
    
    const capacidadesRaw = respCapacidades.datos || respCapacidades || {};
    const capacidades = capacidadesRaw.capacidades || capacidadesRaw || [];
    
    const subordinado = subordinados.find(s => s.sub_membresia_id == id);
    if (!subordinado) {
      onError('Usuario no encontrado');
      return;
    }
    
    renderizarModalCapacidades({
      subordinado,
      capacidadesDisponibles: capacidades,
      capacidadesActuales: (subordinado.capacidades || []).map(c => c.codigo),
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
    onError(error.message || 'Error cargando capacidades');
  }
}
