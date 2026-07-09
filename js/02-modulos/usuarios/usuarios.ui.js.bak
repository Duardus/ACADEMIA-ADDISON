/* ============================================
   ARCHIVO: usuarios.ui.js
   MODULO: usuarios
   DEPENDENCIAS: utilidades.js (01-nucleo)
   CONTRATO:
     - Solo renderizado, NUNCA hace fetch
     - Recibe datos planos, callbacks
   ============================================ */

function renderizarUsuarios({ subordinados, onCrear, onCambiarEstado, onDesactivar, onCapacidades, onVolver }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>👥 Administración de Usuarios</h2>
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
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay subordinados registrados. Haz click en "+ Nuevo Usuario" para crear uno.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.innerHTML = `
    <thead>
      <tr style="border-bottom:2px solid var(--borde);text-align:left;">
        <th style="padding:12px;">Nivel</th>
        <th style="padding:12px;">Nombre</th>
        <th style="padding:12px;">Correo</th>
        <th style="padding:12px;">Rol</th>
        <th style="padding:12px;">Estado</th>
        <th style="padding:12px;">Puede Crear</th>
        <th style="padding:12px;">Capacidades</th>
        <th style="padding:12px;text-align:right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${subordinados.map(s => `
        <tr style="border-bottom:1px solid var(--borde);">
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:50%;background:var(--primario);color:#fff;font-size:12px;font-weight:700;">
              ${s.sub_nivel}
            </span>
          </td>
          <td style="padding:12px;">${s.sub_nombre_completo || s.sub_nombre}</td>
          <td style="padding:12px;">${s.sub_correo || s.correo}</td>
          <td style="padding:12px;">${s.sub_nombre_rol || s.nombre_rol || 'Sin rol'}</td>
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 8px;border-radius:var(--radio-borde-xs);background:${s.sub_estado === 'active' ? 'var(--exito)' : 'var(--error)'};color:#fff;font-size:12px;">
              ${s.sub_estado === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td style="padding:12px;">
            ${s.sub_puede_crear_hijos ? '✅ Sí' : '❌ No'}
          </td>
          <td style="padding:12px;">${(s.capacidades || []).length} permisos</td>
          <td style="padding:12px;text-align:right;">
            <button class="btn-icono" data-accion="capacidades" data-id="${s.sub_membresia_id}" title="Capacidades">🔑</button>
            <button class="btn-icono" data-accion="estado" data-id="${s.sub_membresia_id}" title="Cambiar Estado">🔄</button>
            <button class="btn-icono" data-accion="desactivar" data-id="${s.sub_membresia_id}" title="Desactivar" style="color:var(--error);">🗑️</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);

  tabla.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, id } = btn.dataset;
    if (accion === 'capacidades') onCapacidades(id);
    if (accion === 'estado') onCambiarEstado(id);
    if (accion === 'desactivar') onDesactivar(id);
  });
}

function renderizarModalCrearUsuario({ etiquetas, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalUsuarios';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nuevo Usuario</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo *</label>
        <input type="text" id="inputNombre" class="input" placeholder="Nombre del usuario..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo Electronico *</label>
        <input type="email" id="inputCorreo" class="input" placeholder="correo@ejemplo.com" style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre del Rol (personalizable)</label>
        <input type="text" id="inputNombreRol" class="input" placeholder="Ej: Profesor, Coordinador, Director..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Jerarquico</label>
        <select id="selectNivel" class="input" style="width:100%;margin-bottom:12px;">
          <option value="1">Nivel 1 - Creador de Institucion</option>
          <option value="2">Nivel 2 - Subordinado</option>
          <option value="3">Nivel 3 - Subordinado</option>
          <option value="4">Nivel 4 - Subordinado</option>
        </select>
        
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:12px;">
          <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
          <span>Puede crear subordinados (heredar poder)</span>
        </label>
        
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:12px;">
          <input type="checkbox" id="checkControlTotal" style="width:18px;height:18px;">
          <span>Control sobre TODOS los niveles inferiores (no solo sus herederos)</span>
        </label>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelar">Cancelar</button>
        <button class="btn" id="btnGuardar">Crear</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelar').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardar').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombre').value.trim();
    const correo = document.getElementById('inputCorreo').value.trim();
    const nombreRol = document.getElementById('inputNombreRol').value.trim();
    const nivel = parseInt(document.getElementById('selectNivel').value);
    const puedeCrearHijos = document.getElementById('checkCrearHijos').checked;
    const controlTotal = document.getElementById('checkControlTotal').checked;
    
    if (!nombre || !correo) {
      alert('Nombre y correo son obligatorios');
      return;
    }
    modal.remove();
    onGuardar({ 
      nombre_completo: nombre, 
      correo_electronico: correo, 
      nombre_rol: nombreRol || 'Miembro',
      nivel: nivel,
      puede_crear_hijos: puedeCrearHijos,
      control_total: controlTotal
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
        `).join('') || '<p style="color:var(--texto-secundario);">No hay capacidades disponibles para delegar.</p>'}
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
