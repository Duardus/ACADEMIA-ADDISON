/* ============================================
   ARCHIVO: usuarios.ui.js
   MODULO: usuarios
   DEPENDENCIAS: utilidades.js (01-nucleo)
   CONTRATO:
     - Solo renderizado, NUNCA hace fetch
     - Recibe datos planos, callbacks
   ============================================ */

function renderizarUsuarios({ subordinados, onCrear, onReactivar, onDesactivar, onEliminarCompleto, onCapacidades, onVolver, esSuperadmin }) {
  const app = document.getElementById('app');
  
  // Contar activos y suspendidos
  const activos = subordinados.filter(s => s.sub_estado === 'active');
  const suspendidos = subordinados.filter(s => s.sub_estado !== 'active');
  
  app.innerHTML = `
    <div style="padding:20px;max-width:1400px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
        <div>
          <h2>👥 Administración de Usuarios</h2>
          <p style="color:var(--texto-secundario);font-size:13px;margin:4px 0 0;">
            ${subordinados.length} total · ${activos.length} activos · ${suspendidos.length} suspendidos
          </p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearUsuario">+ Nuevo Usuario</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="usuariosContenido"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnCrearUsuario').addEventListener('click', onCrear);

  const contenedor = document.getElementById('usuariosContenido');
  if (!subordinados || subordinados.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay usuarios registrados.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.style.fontSize = '14px';
  tabla.innerHTML = `
    <thead>
      <tr style="border-bottom:2px solid var(--borde);text-align:left;">
        <th style="padding:10px;">Nivel</th>
        <th style="padding:10px;">Nombre</th>
        <th style="padding:10px;">Correo</th>
        <th style="padding:10px;">Rol</th>
        <th style="padding:10px;">Salones</th>
        <th style="padding:10px;">Estado</th>
        <th style="padding:10px;">Crear</th>
        <th style="padding:10px;text-align:right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${subordinados.map(s => {
        const salones = s.salones || [];
        const salonesTexto = salones.length > 0 
          ? salones.map(sal => `<span style="display:inline-block;padding:2px 8px;background:var(--primario);color:#fff;border-radius:4px;font-size:11px;margin-right:4px;">${sal.nombre_salon}</span>`).join('')
          : '<span style="color:var(--texto-secundario);font-size:12px;">Sin salón</span>';
        
        const estadoClass = s.sub_estado === 'active' ? 'background:var(--exito);' : 'background:var(--advertencia);';
        const estadoTexto = s.sub_estado === 'active' ? 'Activo' : 'Suspendido';
        
        const puedeCrear = s.sub_puede_crear_hijos ? '✅' : '❌';
        
        // Botones según estado
        let botonesAccion = '';
        if (s.sub_estado === 'active') {
          botonesAccion = `
            <button class="btn-icono" data-accion="capacidades" data-id="${s.sub_membresia_id}" title="Capacidades">🔑</button>
            <button class="btn-icono" data-accion="desactivar" data-id="${s.sub_membresia_id}" title="Desactivar">🛑</button>
            ${esSuperadmin ? `<button class="btn-icono" data-accion="eliminar" data-id="${s.sub_membresia_id}" title="Eliminar Permanentemente" style="color:var(--error);">❌</button>` : ''}
          `;
        } else {
          // Usuario suspendido - mostrar reactivar
          botonesAccion = `
            <button class="btn-icono" data-accion="reactivar" data-id="${s.sub_membresia_id}" title="Reactivar" style="color:var(--exito);">✅</button>
            ${esSuperadmin ? `<button class="btn-icono" data-accion="eliminar" data-id="${s.sub_membresia_id}" title="Eliminar Permanentemente" style="color:var(--error);">❌</button>` : ''}
          `;
        }
        
        return `
        <tr style="border-bottom:1px solid var(--borde);opacity:${s.sub_estado === 'active' ? '1' : '0.6'};">
          <td style="padding:10px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:50%;background:var(--primario);color:#fff;font-size:12px;font-weight:700;">
              ${s.sub_nivel}
            </span>
          </td>
          <td style="padding:10px;font-weight:500;">${s.sub_nombre_completo || s.sub_nombre || 'Sin nombre'}</td>
          <td style="padding:10px;font-size:12px;color:var(--texto-secundario);">${s.sub_correo || s.correo || '-'}</td>
          <td style="padding:10px;">${s.sub_nombre_rol || s.nombre_rol || 'Sin rol'}</td>
          <td style="padding:10px;">${salonesTexto}</td>
          <td style="padding:10px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:var(--radio-borde-xs);${estadoClass}color:#fff;font-size:11px;font-weight:600;">
              ${estadoTexto}
            </span>
          </td>
          <td style="padding:10px;text-align:center;">${puedeCrear}</td>
          <td style="padding:10px;text-align:right;white-space:nowrap;">
            ${botonesAccion}
          </td>
        </tr>
      `;
      }).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);

  tabla.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, id } = btn.dataset;
    if (accion === 'capacidades') onCapacidades(id);
    if (accion === 'desactivar') onDesactivar(id);
    if (accion === 'reactivar') onReactivar(id);
    if (accion === 'eliminar') onEliminarCompleto(id);
  });
}

// ============================================
// MODAL CREAR USUARIO
// ============================================
function renderizarModalCrearUsuario({ instituciones, salones, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalUsuarios';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:550px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:90vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nuevo Usuario</h3>
      
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo *</label>
        <input type="text" id="inputNombre" class="input" placeholder="Nombre del usuario..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo Electronico *</label>
        <input type="email" id="inputCorreo" class="input" placeholder="correo@ejemplo.com" style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Institución *</label>
        <select id="selectInstitucion" class="input" style="width:100%;margin-bottom:12px;">
          <option value="">-- Seleccionar institución --</option>
          ${(instituciones || []).map(inst => `
            <option value="${inst.institucion_id}">${inst.nombre_institucion}</option>
          `).join('')}
        </select>
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Salón / Grupo / Aula (Ctrl+Click para varios)</label>
        <select id="selectSalon" class="input" multiple style="width:100%;margin-bottom:8px;height:80px;">
          <option value="">-- Primero selecciona institución --</option>
        </select>
        <p style="font-size:11px;color:var(--texto-secundario);margin:0 0 12px;">Mantén presionado Ctrl/Cmd para seleccionar varios</p>
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre del Rol (personalizable)</label>
        <input type="text" id="inputNombreRol" class="input" placeholder="Ej: Profesor, Alumno, Director..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Jerárquico *</label>
        <select id="selectNivel" class="input" style="width:100%;margin-bottom:12px;">
          <option value="1">Nivel 1 - Director/Admin</option>
          <option value="2">Nivel 2 - Coordinador</option>
          <option value="3">Nivel 3 - Profesor</option>
          <option value="4">Nivel 4 - Auxiliar</option>
          <option value="5">Nivel 5 - Alumno</option>
        </select>
        
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:12px;">
          <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
          <span>Puede crear subordinados</span>
        </label>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelar">Cancelar</button>
        <button class="btn" id="btnGuardar">Crear Usuario</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Evento para cargar salones cuando cambia institución
  const selectInstitucion = document.getElementById('selectInstitucion');
  const selectSalon = document.getElementById('selectSalon');
  
  selectInstitucion.addEventListener('change', () => {
    const instId = selectInstitucion.value;
    selectSalon.innerHTML = '';
    
    if (!instId) {
      selectSalon.innerHTML = '<option value="">-- Primero selecciona institución --</option>';
      return;
    }
    
    const salonesFiltrados = (salones || []).filter(s => s.institucion_id == instId);
    
    if (salonesFiltrados.length === 0) {
      selectSalon.innerHTML = '<option value="">No hay salones en esta institución</option>';
    } else {
      salonesFiltrados.forEach(salon => {
        const option = document.createElement('option');
        option.value = salon.salon_id;
        option.textContent = salon.nombre_salon;
        selectSalon.appendChild(option);
      });
    }
  });

  document.getElementById('btnCancelar').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  
  document.getElementById('btnGuardar').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombre').value.trim();
    const correo = document.getElementById('inputCorreo').value.trim();
    const institucionId = document.getElementById('selectInstitucion').value;
    const nombreRol = document.getElementById('inputNombreRol').value.trim();
    const nivel = parseInt(document.getElementById('selectNivel').value);
    const puedeCrearHijos = document.getElementById('checkCrearHijos').checked;
    
    const salonSelect = document.getElementById('selectSalon');
    const salonIds = Array.from(salonSelect.selectedOptions)
      .map(opt => parseInt(opt.value))
      .filter(id => !isNaN(id));
    
    if (!nombre || !correo || !institucionId) {
      alert('Nombre, correo e institución son obligatorios');
      return;
    }
    
    modal.remove();
    onGuardar({ 
      nombre_completo: nombre, 
      email: correo, 
      institucion_id: parseInt(institucionId),
      nombre_rol: nombreRol || 'Miembro',
      nivel_jerarquico: nivel,
      puede_crear_hijos: puedeCrearHijos,
      salon_ids: salonIds,
      superior_inmediato_id: 1
    });
  });
}

function renderizarModalCapacidades({ subordinado, capacidadesDisponibles, capacidadesActuales, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalCapacidades';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">🔑 Capacidades de ${subordinado.sub_nombre_completo || subordinado.nombre}</h3>
      <p style="margin:0 0 12px;color:var(--texto-secundario);font-size:13px;">Nivel ${subordinado.sub_nivel} • ${subordinado.sub_nombre_rol}</p>
      <div style="margin:16px 0;max-height:350px;overflow-y:auto;">
        ${(capacidadesDisponibles || []).map(cap => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:var(--radio-borde-xs);cursor:pointer;margin-bottom:4px;background:var(--fondo-secundario);">
            <input type="checkbox" value="${cap.codigo || cap.capacidad_id}" ${capacidadesActuales.includes(cap.codigo || cap.capacidad_id) ? 'checked' : ''} style="width:18px;height:18px;">
            <div>
              <div style="font-weight:600;">${cap.nombre}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${cap.descripcion || cap.categoria || ''}</div>
            </div>
          </label>
        `).join('') || '<p style="color:var(--texto-secundario);">No hay capacidades disponibles.</p>'}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelar">Cancelar</button>
        <button class="btn" id="btnGuardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelar').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardar').addEventListener('click', () => {
    const checks = modal.querySelectorAll('input[type="checkbox"]:checked');
    const seleccionadas = Array.from(checks).map(c => c.value);
    modal.remove();
    onGuardar(seleccionadas);
  });
}
