/* ============================================
   ARCHIVO: arbol.eventos.js
   MODULO: arbol
   CONTRATO:
     - Orquesta carga y CRUD del árbol
   ============================================ */

async function iniciarArbol({ onVolver, onError, onToast }) {
  try {
    const respuesta = await apiObtenerArbolCompleto();
    const arbol = respuesta.datos || respuesta;
    renderizarArbol({
      arbol,
      onEditar: (tipo, id, parentId) => manejarEditar({ tipo, id, parentId, onVolver, onError, onToast }),
      onEliminar: (tipo, id) => manejarEliminar({ tipo, id, onVolver, onError, onToast }),
      onClonar: (tipo, id) => manejarClonar({ tipo, id, onVolver, onError, onToast }),
      onCrearCurso: () => manejarEditar({ tipo: 'curso', id: null, parentId: null, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    onError(error.message || 'Error cargando árbol');
  }
}

function manejarEditar({ tipo, id, parentId, onVolver, onError, onToast }) {
  renderizarModalCrear({
    tipo: id ? tipo : tipo,
    cursoId: tipo === 'tema' ? parentId : null,
    temaId: tipo === 'subtema' ? parentId : null,
    onGuardar: async (datos) => {
      try {
        if (id) {
          await apiActualizarNodo(tipo, id, datos);
          onToast('Actualizado correctamente', 'exito');
        } else {
          if (tipo === 'curso') {
            await apiCrearCurso(datos);
          } else if (tipo === 'tema') {
            await post('/arbol/temas', datos);
          } else if (tipo === 'subtema') {
            await post('/arbol/subtemas', datos);
          }
          onToast('Creado correctamente', 'exito');
        }
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
