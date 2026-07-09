/* ============================================
   ARCHIVO: jerarquia.eventos.js
   MODULO: jerarquia
   DEPENDENCIAS:
     - jerarquia.api.js (HTTP)
     - jerarquia.ui.js (renderizado)
   CONTRATO:
     - Orquesta carga y CRUD de jerarquia
     - Recibe callback onVolver para regresar al dashboard
   ============================================ */

async function iniciarJerarquia({ onVolver, onError, onToast }) {
  try {
    const subordinados = await apiObtenerSubordinados();
    renderizarJerarquia({
      subordinados: subordinados || [],
      onCrear: () => manejarCrear({ onVolver, onError, onToast }),
      onEditar: (id) => console.log('Editar', id),
      onCambiarEstado: (id) => manejarCambiarEstado({ id, onVolver, onError, onToast }),
      onDesactivar: (id) => manejarDesactivar({ id, onVolver, onError, onToast }),
      onCapacidades: (id) => manejarCapacidades({ id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando jerarquia');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
  try {
    const etiquetas = await apiObtenerEtiquetas();
    renderizarModalCrearSubordinado({
      etiquetas: etiquetas || [],
      onGuardar: async (datos) => {
        try {
          await apiCrearSubordinado(datos);
          onToast('Subordinado creado correctamente', 'exito');
          iniciarJerarquia({ onVolver, onError, onToast });
        } catch (error) {
          onError(error.message || 'Error creando subordinado');
        }
      },
      onCancelar: () => {}
    });
  } catch (error) {
    onError(error.message || 'Error cargando etiquetas');
  }
}

async function manejarCambiarEstado({ id, onVolver, onError, onToast }) {
  const nuevoEstado = confirm('¿Cambiar estado del subordinado?') ? 'activo' : 'inactivo';
  try {
    await apiCambiarEstadoSubordinado(id, nuevoEstado);
    onToast('Estado actualizado', 'exito');
    iniciarJerarquia({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error cambiando estado');
  }
}

async function manejarDesactivar({ id, onVolver, onError, onToast }) {
  const motivo = prompt('Motivo de desactivacion:');
  if (!motivo) return;
  try {
    await apiDesactivarSubordinado(id);
    onToast('Subordinado desactivado', 'exito');
    iniciarJerarquia({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error desactivando subordinado');
  }
}

async function manejarCapacidades({ id, onVolver, onError, onToast }) {
  try {
    const [capacidades, subordinados] = await Promise.all([
      apiObtenerCapacidades(),
      apiObtenerSubordinados()
    ]);
    const subordinado = (subordinados || []).find(s => s.membresia_id == id);
    if (!subordinado) {
      onError('Subordinado no encontrado');
      return;
    }
    renderizarModalCapacidades({
      subordinado,
      capacidadesDisponibles: capacidades || [],
      capacidadesActuales: subordinado.capacidades || [],
      onGuardar: async (seleccionadas) => {
        try {
          await apiModificarCapacidades(id, seleccionadas);
          onToast('Capacidades actualizadas', 'exito');
          iniciarJerarquia({ onVolver, onError, onToast });
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
