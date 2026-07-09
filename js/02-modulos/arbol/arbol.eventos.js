/* ============================================
   📁 ARCHIVO: arbol.eventos.js
   📂 MÓDULO: arbol
   🔗 DEPENDENCIAS:
     - arbol.api.js (HTTP)
     - arbol.ui.js (renderizado)
   📝 CONTRATO:
     - Orquesta carga y CRUD del árbol
     - Recibe callback onVolver para regresar al dashboard
   ============================================ */

async function iniciarArbol({ onVolver, onError, onToast }) {
  try {
    const arbol = await apiObtenerArbolCompleto();
    renderizarArbol({
      arbol,
      onEditar: (tipo, id, grupoId) => manejarEditar({ tipo, id, grupoId, onVolver, onError, onToast }),
      onEliminar: (tipo, id) => manejarEliminar({ tipo, id, onVolver, onError, onToast }),
      onClonar: (tipo, id) => manejarClonar({ tipo, id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando árbol');
  }
}

function manejarEditar({ tipo, id, grupoId, onVolver, onError, onToast }) {
  renderizarModalCrear({
    tipo: id ? tipo : (grupoId ? 'curso' : 'grupo'),
    grupoId,
    onGuardar: async (datos) => {
      try {
        if (id) {
          await apiActualizarNodo(tipo, id, datos);
          onToast('Actualizado correctamente', 'exito');
        } else {
          if (grupoId) {
            await apiCrearCurso({ ...datos, grupo_id: grupoId });
          } else {
            await apiCrearGrupo(datos);
          }
          onToast('Creado correctamente', 'exito');
        }
        // Recargar
        iniciarArbol({ onVolver, onError, onToast });
      } catch (error) {
        onError(error.message || 'Error guardando');
      }
    },
    onCancelar: () => {}
  });
}

async function manejarEliminar({ tipo, id, onVolver, onError, onToast }) {
  const motivo = prompt('Motivo de eliminación:');
  if (!motivo) return;
  try {
    await apiEliminarNodo(tipo, id, motivo);
    onToast('Eliminado correctamente', 'exito');
    iniciarArbol({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error eliminando');
  }
}

async function manejarClonar({ tipo, id, onVolver, onError, onToast }) {
  try {
    await apiClonarNodo(tipo, id);
    onToast('Clonado correctamente', 'exito');
    iniciarArbol({ onVolver, onError, onToast });
  } catch (error) {
    onError(error.message || 'Error clonando');
  }
}
