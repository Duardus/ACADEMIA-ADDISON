/* ============================================
   ARCHIVO: usuarios.eventos.js
   MODULO: usuarios
   ============================================ */

// Modal de confirmación personalizado (reemplaza confirm() y prompt())
function mostrarConfirmacion(mensaje, onConfirmar, onCancelar) {
  document.querySelectorAll('.modal-confirm').forEach(m => m.remove());
  
  const modal = document.createElement('div');
  modal.className = 'modal-confirm';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:24px;max-width:400px;width:90%;text-align:center;">
      <p style="margin:0 0 20px;font-size:16px;">${mensaje}</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="btnCancelarConfirm" class="btn btn-secundario">Cancelar</button>
        <button id="btnConfirmar" class="btn" style="background:var(--error);">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  document.getElementById('btnCancelarConfirm').addEventListener('click', () => {
    modal.remove();
    if (onCancelar) onCancelar();
  });
  
  document.getElementById('btnConfirmar').addEventListener('click', () => {
    modal.remove();
    onConfirmar();
  });
}

// Modal de input personalizado (reemplaza prompt())
function mostrarInputConfirmacion(mensaje, valorEsperado, onConfirmar, onCancelar) {
  document.querySelectorAll('.modal-input').forEach(m => m.remove());
  
  const modal = document.createElement('div');
  modal.className = 'modal-input';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  modal.innerHTML = `
    <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:24px;max-width:400px;width:90%;text-align:center;">
      <p style="margin:0 0 12px;font-size:16px;">${mensaje}</p>
      <p style="margin:0 0 16px;font-size:13px;color:var(--texto-secundario);">Escribe <strong>${valorEsperado}</strong> para confirmar</p>
      <input type="text" id="inputConfirmacion" class="input" style="width:100%;margin-bottom:20px;text-align:center;font-size:18px;letter-spacing:2px;" placeholder="${valorEsperado}">
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="btnCancelarInput" class="btn btn-secundario">Cancelar</button>
        <button id="btnConfirmarInput" class="btn" style="background:var(--error);">Eliminar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  const input = document.getElementById('inputConfirmacion');
  input.focus();
  
  document.getElementById('btnCancelarInput').addEventListener('click', () => {
    modal.remove();
    if (onCancelar) onCancelar();
  });
  
  document.getElementById('btnConfirmarInput').addEventListener('click', () => {
    const valor = input.value.trim();
    modal.remove();
    if (valor === valorEsperado) {
      onConfirmar();
    } else {
      onCancelar();
    }
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btnConfirmarInput').click();
    }
  });
}

async function iniciarUsuarios({ onVolver, onError, onToast }) {
  try {
    const datosSesion = obtenerUsuario();
    const esSuperadmin = datosSesion?.rol === 'superadmin' || datosSesion?.nivel === 0;
    
    const respuesta = await apiObtenerSubordinados();
    
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
      onEditar: (id) => manejarEditar({ id, onVolver, onError, onToast }),
      onVolver
    });
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    onError(error.message || 'Error cargando usuarios');
  }
}

async function manejarCrear({ onVolver, onError, onToast }) {
 try {
  const datosSesion = (typeof obtenerUsuario==='function'?obtenerUsuario():null);
  const esSuperadmin = datosSesion?.rol === 'superadmin' || datosSesion?.nivel === 0;
  const respInstituciones = await apiObtenerInstituciones().catch(() => ({ datos: { instituciones: [] } }));
  const institucionesRaw = respInstituciones?.datos || respInstituciones || {};
  const instituciones = institucionesRaw.instituciones || institucionesRaw || [];
  renderizarModalCrearUsuario({
   instituciones, salones: [], esSuperadmin,
   onGuardar: async (datos) => {
    try { await apiCrearSubordinado(datos); onToast('Usuario creado correctamente','exito'); iniciarUsuarios({ onVolver, onError, onToast }); } catch (e) { onError(e.message||'Error creando usuario'); }
   },
   onCancelar: () => {}
  });
 } catch (e) { onError(e.message||'Error cargando datos'); }
}


async function manejarReactivar({ id, onVolver, onError, onToast }) {
  mostrarConfirmacion('¿Reactivar este usuario?', async () => {
    try {
      await apiCambiarEstadoSubordinado(id, 'active');
      onToast('Usuario reactivado', 'exito');
      iniciarUsuarios({ onVolver, onError, onToast });
    } catch (error) {
      onError(error.message || 'Error reactivando usuario');
    }
  });
}

async function manejarDesactivar({ id, onVolver, onError, onToast }) {
  mostrarConfirmacion('¿Desactivar este usuario?', async () => {
    try {
      await apiDesactivarSubordinado(id);
      onToast('Usuario desactivado', 'exito');
      iniciarUsuarios({ onVolver, onError, onToast });
    } catch (error) {
      console.error('Error desactivando:', error);
      onError(error.message || 'Error desactivando usuario');
    }
  });
}

async function manejarEliminarCompleto({ id, onVolver, onError, onToast }) {
  mostrarConfirmacion('⚠️ ¿ELIMINAR PERMANENTEMENTE?<br><br>Esta acción NO se puede deshacer.', () => {
    mostrarInputConfirmacion(
      'Confirmar eliminación',
      'ELIMINAR',
      async () => {
        try {
          await apiEliminarSubordinadoCompleto(id);
          onToast('Usuario eliminado permanentemente', 'exito');
          iniciarUsuarios({ onVolver, onError, onToast });
        } catch (error) {
          console.error('Error eliminando:', error);
          onError(error.message || 'Error eliminando usuario');
        }
      },
      () => {
        onToast('Eliminación cancelada', 'advertencia');
      }
    );
  });
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


async function manejarEditar({ id, onVolver, onError, onToast }) {
  try {
    const [respSubordinados, respInstituciones] = await Promise.all([
      apiObtenerSubordinados(),
      apiObtenerInstituciones()
    ]);
    
    const datosSub = respSubordinados?.datos || respSubordinados;
    const subordinados = datosSub?.subordinados || datosSub || [];
    const subordinado = subordinados.find(s => (s.sub_membresia_id || s.membresia_id) == id);
    
    if (!subordinado) {
      onError('Usuario no encontrado');
      return;
    }
    
    const instituciones = respInstituciones?.datos || respInstituciones?.instituciones || respInstituciones || [];
    const institucionId = subordinado.sub_institucion_id || subordinado.institucion_id;
    
    let salones = [];
    if (institucionId) {
      try {
        const respSalones = await apiObtenerSalones(institucionId);
        salones = respSalones?.datos?.salones || respSalones?.salones || [];
      } catch (e) {
        console.warn('Error cargando salones:', e);
      }
    }
    
    renderizarModalEditarUsuario({
      subordinado,
      instituciones,
      salones,
      onGuardar: async (datos) => {
        try {
          await apiEditarSubordinado(id, datos);
          onToast('Usuario actualizado correctamente', 'exito');
          iniciarUsuarios({ onVolver, onError, onToast });
        } catch (error) {
          onError(error.message || 'Error actualizando usuario');
        }
      },
      onCancelar: () => {}
    });
  } catch (error) {
    onError(error.message || 'Error cargando usuario');
  }
}
