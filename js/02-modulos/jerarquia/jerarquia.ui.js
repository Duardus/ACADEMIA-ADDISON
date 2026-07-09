/* ============================================
   ARCHIVO: jerarquia.ui.js
   MODULO: jerarquia
   DEPENDENCIAS: utilidades.js (01-nucleo)
   CONTRATO:
     - Solo renderizado, NUNCA hace fetch
     - Recibe datos planos, callbacks
   ============================================ */

function renderizarJerarquia({ subordinados, onCrear, onCambiarEstado, onDesactivar, onCapacidades, onVolver }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>👥 Jerarquia de Usuarios</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearSubordinado">+ Nuevo Subordinado</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="jerarquiaContenido"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnCrearSubordinado').addEventListener('click', onCrear);

  const contenedor = document.getElementById('jerarquiaContenido');
  if (!subordinados || subordinados.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No tienes subordinados. Haz click en "+ Nuevo Subordinado" para crear uno.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.innerHTML = `
    <thead>
      <tr style="border-bottom:2px solid var(--borde);text-align:left;">
        <th style="padding:12px;">Nombre</th>
        <th style="padding:12px;">Correo</th>
        <th style="padding:12px;">Rol</th>
        <th style="padding:12px;">Estado</th>
        <th style="padding:12px;">Capacidades</th>
        <th style="padding:12px;text-align:right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${subordinados.map(s => `
        <tr style="border-bottom:1px solid var(--borde);">
          <td style="padding:12px;">${s.nombre_completo || s.nombre}</td>
          <td style="padding:12px;">${s.correo_electronico || s.correo}</td>
          <td style="padding:12px;">${s.tipo_rol || s.rol}</td>
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 8px;border-radius:var(--radio-borde-xs);background:${s.estado === 'activo' ? 'var(--exito)' : 'var(--error)'};color:#fff;font-size:12px;">
              ${s.estado || 'activo'}
            </span>
          </td>
          <td style="padding:12px;">${(s.capacidades || []).join(', ') || 'Ninguna'}</td>
          <td style="padding:12px;text-align:right;">
            <button class="btn-icono" data-accion="capacidades" data-id="${s.membresia_id}" title="Capacidades">🔑</button>
            <button class="btn-icono" data-accion="estado" data-id="${s.membresia_id}" title="Cambiar Estado">🔄</button>
            <button class="btn-icono" data-accion="desactivar" data-id="${s.membresia_id}" title="Desactivar" style="color:var(--error);">🗑️</button>
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

function renderizarModalCrearSubordinado({ etiquetas, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalJerarquia';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:450px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nuevo Subordinado</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo</label>
        <input type="text" id="inputNombre" class="input" placeholder="Nombre..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo Electronico</label>
        <input type="email" id="inputCorreo" class="input" placeholder="correo@ejemplo.com" style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Rol</label>
        <select id="selectRol" class="input" style="width:100%;margin-bottom:12px;">
          <option value="docente">Docente</option>
          <option value="estudiante">Estudiante</option>
          <option value="invitado">Invitado</option>
        </select>
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Etiqueta de Cargo</label>
        <input type="text" id="inputEtiqueta" class="input" placeholder="Ej: Profesor de Matematicas" style="width:100%;">
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
    const rol = document.getElementById('selectRol').value;
    const etiqueta = document.getElementById('inputEtiqueta').value.trim();
    if (!nombre || !correo) {
      alert('Nombre y correo son obligatorios');
      return;
    }
    modal.remove();
    onGuardar({ nombre_completo: nombre, correo_electronico: correo, tipo_rol: rol, etiqueta_cargo: etiqueta });
  });
}

function renderizarModalCapacidades({ subordinado, capacidadesDisponibles, capacidadesActuales, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalCapacidades';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:450px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">🔑 Capacidades de ${subordinado.nombre_completo || subordinado.nombre}</h3>
      <div style="margin:16px 0;max-height:300px;overflow-y:auto;">
        ${capacidadesDisponibles.map(cap => `
          <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:var(--radio-borde-xs);cursor:pointer;margin-bottom:4px;background:var(--fondo-secundario);">
            <input type="checkbox" value="${cap.codigo}" ${capacidadesActuales.includes(cap.codigo) ? 'checked' : ''} style="width:18px;height:18px;">
            <div>
              <div style="font-weight:600;">${cap.nombre}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${cap.descripcion}</div>
            </div>
          </label>
        `).join('')}
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
