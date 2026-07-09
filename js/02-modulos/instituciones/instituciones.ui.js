/* ============================================
   ARCHIVO: instituciones.ui.js
   MODULO: instituciones
   CONTRATO:
     - Solo renderizado, NUNCA hace fetch
   ============================================ */

function renderizarInstituciones({ instituciones, onCrear, onEditar, onVer, onVerSalones, onEliminar, onVolver }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>🏛️ Instituciones</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearInstitucion">+ Nueva Institución</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="institucionesContenido"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnCrearInstitucion').addEventListener('click', onCrear);

  const contenedor = document.getElementById('institucionesContenido');
  if (!instituciones || instituciones.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay instituciones. Haz click en "+ Nueva Institución" para crear una.</p>';
    return;
  }

  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.innerHTML = `
    <thead>
      <tr style="border-bottom:2px solid var(--borde);text-align:left;">
        <th style="padding:12px;">ID</th>
        <th style="padding:12px;">Nombre</th>
        <th style="padding:12px;">Slug</th>
        <th style="padding:12px;">País</th>
        <th style="padding:12px;">Estado</th>
        <th style="padding:12px;">Usuarios</th>
        <th style="padding:12px;text-align:right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${instituciones.map(inst => `
        <tr style="border-bottom:1px solid var(--borde);">
          <td style="padding:12px;">${inst.institucion_id}</td>
          <td style="padding:12px;font-weight:600;">${inst.nombre_institucion}</td>
          <td style="padding:12px;color:var(--texto-secundario);font-size:13px;">${inst.institucion_slug}</td>
          <td style="padding:12px;">${inst.pais_codigo || 'PE'}</td>
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 8px;border-radius:var(--radio-borde-xs);background:${inst.institucion_status === 'active' ? 'var(--exito)' : 'var(--advertencia)'};color:#fff;font-size:12px;">
              ${inst.institucion_status || 'active'}
            </span>
          </td>
          <td style="padding:12px;">${inst.total_usuarios || 0}</td>
          <td style="padding:12px;text-align:right;">
            <button class="btn-icono" data-accion="ver" data-id="${inst.institucion_id}" title="Ver detalle">👁️</button>
            <button class="btn-icono" data-accion="salones" data-id="${inst.institucion_id}" data-nombre="${inst.nombre_institucion}" title="Ver Salones">🏫</button>
            <button class="btn-icono" data-accion="editar" data-id="${inst.institucion_id}" title="Editar">✏️</button>
            <button class="btn-icono" data-accion="eliminar" data-id="${inst.institucion_id}" title="Cerrar" style="color:var(--error);">🗑️</button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);

  tabla.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, id, nombre } = btn.dataset;
    if (accion === 'ver') onVer(id);
    if (accion === 'salones') onVerSalones(id, nombre);
    if (accion === 'editar') onEditar(id);
    if (accion === 'eliminar') onEliminar(id);
  });
}

function renderizarModalCrearInstitucion({ onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalInstitucion';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nueva Institución</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre de la Institución *</label>
        <input type="text" id="inputNombreInst" class="input" placeholder="Ej: Academia Addison Lima" style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">País</label>
        <select id="selectPaisInst" class="input" style="width:100%;margin-bottom:12px;">
          <option value="PE">Perú</option>
          <option value="MX">México</option>
          <option value="CO">Colombia</option>
          <option value="AR">Argentina</option>
          <option value="CL">Chile</option>
          <option value="ES">España</option>
          <option value="US">Estados Unidos</option>
        </select>
        
        <hr style="border:none;border-top:1px solid var(--borde);margin:16px 0;">
        <p style="font-size:13px;color:var(--texto-secundario);margin-bottom:12px;">Director de la institución (Nivel 1)</p>
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre del Director *</label>
        <input type="text" id="inputDirectorNombre" class="input" placeholder="Nombre completo..." style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo del Director *</label>
        <input type="email" id="inputDirectorCorreo" class="input" placeholder="director@institucion.edu" style="width:100%;">
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarInst">Cancelar</button>
        <button class="btn" id="btnGuardarInst">Crear Institución</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarInst').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardarInst').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombreInst').value.trim();
    const pais = document.getElementById('selectPaisInst').value;
    const dirNombre = document.getElementById('inputDirectorNombre').value.trim();
    const dirCorreo = document.getElementById('inputDirectorCorreo').value.trim();
    
    if (!nombre || !dirNombre || !dirCorreo) {
      alert('Nombre de institución, nombre y correo del director son obligatorios');
      return;
    }
    modal.remove();
    onGuardar({ 
      nombre_institucion: nombre, 
      pais_codigo: pais,
      director_nombre: dirNombre,
      director_correo: dirCorreo
    });
  });
}

function renderizarModalEditarInstitucion({ institucion, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalEditarInstitucion';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:450px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">✏️ Editar Institución</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre</label>
        <input type="text" id="inputNombreInst" class="input" value="${institucion.nombre_institucion}" style="width:100%;margin-bottom:12px;">
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">País</label>
        <select id="selectPaisInst" class="input" style="width:100%;margin-bottom:12px;">
          <option value="PE" ${institucion.pais_codigo === 'PE' ? 'selected' : ''}>Perú</option>
          <option value="MX" ${institucion.pais_codigo === 'MX' ? 'selected' : ''}>México</option>
          <option value="CO" ${institucion.pais_codigo === 'CO' ? 'selected' : ''}>Colombia</option>
          <option value="AR" ${institucion.pais_codigo === 'AR' ? 'selected' : ''}>Argentina</option>
          <option value="CL" ${institucion.pais_codigo === 'CL' ? 'selected' : ''}>Chile</option>
          <option value="ES" ${institucion.pais_codigo === 'ES' ? 'selected' : ''}>España</option>
          <option value="US" ${institucion.pais_codigo === 'US' ? 'selected' : ''}>Estados Unidos</option>
        </select>
        
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Estado</label>
        <select id="selectEstadoInst" class="input" style="width:100%;">
          <option value="active" ${institucion.institucion_status === 'active' ? 'selected' : ''}>Activa</option>
          <option value="suspended" ${institucion.institucion_status === 'suspended' ? 'selected' : ''}>Suspendida</option>
          <option value="trial" ${institucion.institucion_status === 'trial' ? 'selected' : ''}>Prueba</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarInst">Cancelar</button>
        <button class="btn" id="btnGuardarInst">Guardar Cambios</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarInst').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardarInst').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombreInst').value.trim();
    const pais = document.getElementById('selectPaisInst').value;
    const estado = document.getElementById('selectEstadoInst').value;
    
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    modal.remove();
    onGuardar({ 
      nombre_institucion: nombre, 
      pais_codigo: pais,
      institucion_status: estado
    });
  });
}

function renderizarDetalleInstitucion({ institucion, usuarios, onVolver, onVerSalones }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>🏛️ ${institucion.nombre_institucion}</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnVerSalones">🏫 Ver Salones</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:24px;">
        <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:16px;">
          <div style="font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">ID</div>
          <div style="font-size:18px;font-weight:700;">${institucion.institucion_id}</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:16px;">
          <div style="font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Slug</div>
          <div style="font-size:18px;font-weight:700;">${institucion.institucion_slug}</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:16px;">
          <div style="font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">País</div>
          <div style="font-size:18px;font-weight:700;">${institucion.pais_codigo || 'PE'}</div>
        </div>
        <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:16px;">
          <div style="font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Estado</div>
          <div style="font-size:18px;font-weight:700;">
            <span style="display:inline-block;padding:4px 8px;border-radius:var(--radio-borde-xs);background:${institucion.institucion_status === 'active' ? 'var(--exito)' : 'var(--advertencia)'};color:#fff;font-size:14px;">
              ${institucion.institucion_status || 'active'}
            </span>
          </div>
        </div>
      </div>
      
      <h3 style="margin-bottom:12px;">👥 Usuarios de la institución (${usuarios.length})</h3>
      <div id="usuariosInstitucion"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnVerSalones').addEventListener('click', () => onVerSalones(institucion.institucion_id, institucion.nombre_institucion));

  const contenedor = document.getElementById('usuariosInstitucion');
  if (!usuarios || usuarios.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay usuarios en esta institución.</p>';
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
      </tr>
    </thead>
    <tbody>
      ${usuarios.map(u => `
        <tr style="border-bottom:1px solid var(--borde);">
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:50%;background:var(--primario);color:#fff;font-size:12px;font-weight:700;">
              ${u.nivel || '-'}
            </span>
          </td>
          <td style="padding:12px;">${u.nombre_completo}</td>
          <td style="padding:12px;">${u.correo_electronico}</td>
          <td style="padding:12px;">${u.nombre_rol || u.tipo_rol}</td>
          <td style="padding:12px;">
            <span style="display:inline-block;padding:4px 8px;border-radius:var(--radio-borde-xs);background:${u.estado_membresia === 'active' ? 'var(--exito)' : 'var(--error)'};color:#fff;font-size:12px;">
              ${u.estado_membresia === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);
}
