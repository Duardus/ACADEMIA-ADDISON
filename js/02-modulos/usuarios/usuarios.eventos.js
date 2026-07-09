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
    const respuesta = await apiObtenerSubordinados();
    
    // El backend devuelve { exito, mensaje, datos: { total, subordinados: [...] } }
    const datos = respuesta.datos || respuesta;
    const subordinados = datos.subordinados || datos || [];
    
    // Filtrar: no mostrar al propio usuario (nivel 0) en la lista de subordinados
    const subordinadosFiltrados = subordinados.filter(s => s.sub_nivel > 0);
    
    renderizarUsuarios({
      subordinados: subordinadosFiltrados,
      onCrear: () => manejarCrear({ onVolver, onError, onToast }),
      onCambiarEstado: (id) => manejarCambiarEstado({ id, onVolver, onError, onToast }),
      onDesactivar: (id) => manejarDesactivar({ id, onVolver, onError, onToast }),
      onCapacidades: (id) => manejarCapacidades({ id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando usuarios');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
  try {
    const etiquetas = await apiObtenerEtiquetas();
    renderizarModalCrearUsuario({
      etiquetas: etiquetas || [],
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
    onError(error.message || 'Error cargando etiquetas');
  }
}

async function manejarCambiarEstado({ id, onVolver, onError, onToast }) {
  const nuevoEstado = confirm('¿Activar usuario? (Cancelar = desactivar)') ? 'activo' : 'inactivo';
  try {
    await apiCambiarEstadoSubordinado(id, nuevoEstado);
    onToast('Estado actualizado', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error cambiando estado');
  }
}

async function manejarDesactivar({ id, onVolver, onError, onToast }) {
  const motivo = prompt('Motivo de desactivacion:');
  if (!motivo) return;
  try {
    await apiDesactivarSubordinado(id);
    onToast('Usuario desactivado', 'exito');
    iniciarUsuarios({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error desactivando usuario');
  }
}

async function manejarCapacidades({ id, onVolver, onError, onToast }) {
  try {
    const [respCapacidades, respSubordinados] = await Promise.all([
      apiObtenerCapacidades(),
      apiObtenerSubordinados()
    ]);
    
    const datosSub = respSubordinados.datos || respSubordinados;
    const subordinados = datosSub.subordinados || datosSub || [];
    const capacidades = respCapacidades.datos || respCapacidades;
    
    const subordinado = subordinados.find(s => s.sub_membresia_id == id);
    if (!subordinado) {
      onError('Usuario no encontrado');
      return;
    }
    
    renderizarModalCapacidades({
      subordinado,
      capacidadesDisponibles: capacidades || [],
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
