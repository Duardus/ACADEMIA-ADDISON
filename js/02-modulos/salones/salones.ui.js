function renderizarSalones({ salones, institucionId, institucionNombre, onCrear, onVer, onEditar, onEliminar, onAsignarUsuarios, onAsignarCursos, onVolver }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <h2>🏫 Salones</h2>
          <p style="color:var(--texto-secundario);font-size:13px;margin:0;">${institucionNombre || 'Institución'}</p>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearSalon">+ Nuevo Salón</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="salonesContenido"></div>
    </div>`;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnCrearSalon').addEventListener('click', onCrear);

  const cont = document.getElementById('salonesContenido');
  if (!salones || salones.length === 0) {
    cont.innerHTML = '<p style="color:var(--texto-secundario);">No hay salones. Crea uno nuevo.</p>';
    return;
  }

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  grid.style.gap = '16px';
  grid.innerHTML = salones.map(s => `
    <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
        <h3 style="margin:0;font-size:16px;cursor:pointer;" class="salon-nombre" data-id="${s.salon_id}">${s.nombre_salon}</h3>
        <div style="display:flex;gap:4px;">
          <button class="btn-icono" data-accion="editar" data-id="${s.salon_id}" title="Editar">✏️</button>
          <button class="btn-icono" data-accion="eliminar" data-id="${s.salon_id}" title="Eliminar" style="color:var(--error);">🗑️</button>
        </div>
      </div>
      <p style="color:var(--texto-secundario);font-size:13px;margin:0 0 12px;">${s.descripcion || 'Sin descripción'}</p>
      <div style="display:flex;gap:16px;font-size:12px;">
        <span class="salon-stats" data-id="${s.salon_id}" data-tipo="usuarios" style="cursor:pointer;color:var(--primario);">
          👥 ${s.total_usuarios || 0} usuarios
        </span>
        <span class="salon-stats" data-id="${s.salon_id}" data-tipo="cursos" style="cursor:pointer;color:var(--primario);">
          📚 ${s.total_cursos || 0} cursos
        </span>
      </div>
    </div>
  `).join('');
  cont.appendChild(grid);

  grid.querySelectorAll('.salon-nombre').forEach(el => {
    el.addEventListener('click', (e) => onVer(e.target.dataset.id));
  });

  grid.querySelectorAll('.salon-stats').forEach(el => {
    el.addEventListener('click', (e) => {
      const { id, tipo } = e.target.dataset;
      if (tipo === 'usuarios') onAsignarUsuarios(id);
      if (tipo === 'cursos') onAsignarCursos(id);
    });
  });

  grid.querySelectorAll('[data-accion]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const { accion, id } = btn.dataset;
      if (accion === 'editar') onEditar(id);
      if (accion === 'eliminar') onEliminar(id);
    });
  });
}

function renderizarModalAsignarUsuarios({ usuarios, usuariosAsignados, onAsignar, onQuitar, onCerrar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalAsignarUsuarios';
  
  const idsAsignados = new Set(usuariosAsignados.map(u => u.membresia_id));
  const disponibles = usuarios.filter(u => !idsAsignados.has(u.membresia_id));
  
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:80vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;">👥 Asignar Usuarios</h3>
      
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px;font-size:14px;color:var(--texto-secundario);">Disponibles (${disponibles.length})</h4>
        ${disponibles.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">No hay usuarios disponibles</p>' : disponibles.map(u => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
            <div>
              <div style="font-weight:600;font-size:14px;">${u.nombre_completo}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${u.correo_electronico} • Nivel ${u.nivel} • ${u.nombre_rol}</div>
            </div>
            <button class="btn btn-sm" data-membresia="${u.membresia_id}" data-accion="asignar">+ Agregar</button>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px;font-size:14px;color:var(--texto-secundario);">Asignados (${usuariosAsignados.length})</h4>
        ${usuariosAsignados.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">Sin usuarios asignados</p>' : usuariosAsignados.map(u => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
            <div>
              <div style="font-weight:600;font-size:14px;">${u.nombre_completo}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${u.rol_en_salon} • ${u.correo_electronico}</div>
            </div>
            <button class="btn btn-sm btn-secundario" data-membresia="${u.membresia_id}" data-accion="quitar">✕ Quitar</button>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCerrarModal">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-accion="asignar"]').forEach(btn => {
    btn.addEventListener('click', () => onAsignar(btn.dataset.membresia));
  });
  
  modal.querySelectorAll('[data-accion="quitar"]').forEach(btn => {
    btn.addEventListener('click', () => onQuitar(btn.dataset.membresia));
  });

  document.getElementById('btnCerrarModal').addEventListener('click', () => {
    modal.remove();
    onCerrar();
  });
}

function renderizarModalAsignarCursos({ cursos, cursosAsignados, onAsignar, onQuitar, onCerrar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalAsignarCursos';
  
  const idsAsignados = new Set(cursosAsignados.map(c => c.curso_id));
  const disponibles = cursos.filter(c => !idsAsignados.has(c.curso_id));
  
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:80vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;">📚 Asignar Cursos</h3>
      
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px;font-size:14px;color:var(--texto-secundario);">Disponibles (${disponibles.length})</h4>
        ${disponibles.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">No hay cursos disponibles</p>' : disponibles.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
            <div>
              <div style="font-weight:600;font-size:14px;">${c.nombre_curso}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${c.descripcion || 'Sin descripción'}</div>
            </div>
            <button class="btn btn-sm" data-curso="${c.curso_id}" data-accion="asignar">+ Agregar</button>
          </div>
        `).join('')}
      </div>
      
      <div style="margin-bottom:16px;">
        <h4 style="margin:0 0 8px;font-size:14px;color:var(--texto-secundario);">Asignados (${cursosAsignados.length})</h4>
        ${cursosAsignados.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">Sin cursos asignados</p>' : cursosAsignados.map(c => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
            <div>
              <div style="font-weight:600;font-size:14px;">Curso #${c.curso_id}</div>
              <div style="font-size:12px;color:var(--texto-secundario);">${c.estado_curso_salon}</div>
            </div>
            <button class="btn btn-sm btn-secundario" data-curso="${c.curso_id}" data-accion="quitar">✕ Quitar</button>
          </div>
        `).join('')}
      </div>
      
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCerrarModal">Cerrar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-accion="asignar"]').forEach(btn => {
    btn.addEventListener('click', () => onAsignar(btn.dataset.curso));
  });
  
  modal.querySelectorAll('[data-accion="quitar"]').forEach(btn => {
    btn.addEventListener('click', () => onQuitar(btn.dataset.curso));
  });

  document.getElementById('btnCerrarModal').addEventListener('click', () => {
    modal.remove();
    onCerrar();
  });
}

function renderizarModalSalon({ salon, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalSalon';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:450px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;">${salon ? '✏️ Editar' : '+ Nuevo'} Salón</h3>
      <input type="text" id="inputNombreSalon" class="input" placeholder="Nombre del salón..." value="${salon ? salon.nombre_salon : ''}" style="width:100%;margin-bottom:12px;">
      <textarea id="inputDescSalon" class="input" placeholder="Descripción..." style="width:100%;height:80px;margin-bottom:12px;">${salon ? salon.descripcion || '' : ''}</textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarSalon">Cancelar</button>
        <button class="btn" id="btnGuardarSalon">Guardar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarSalon').addEventListener('click', () => { modal.remove(); onCancelar(); });
  document.getElementById('btnGuardarSalon').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombreSalon').value.trim();
    const desc = document.getElementById('inputDescSalon').value.trim();
    if (!nombre) { alert('Nombre obligatorio'); return; }
    modal.remove();
    onGuardar({ nombre_salon: nombre, descripcion: desc });
  });
}

function renderizarDetalleSalon({ salon, usuarios, cursos, onVolver }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <div>
          <h2>🏫 ${salon.nombre_salon}</h2>
          <p style="color:var(--texto-secundario);font-size:13px;margin:0;">${salon.descripcion || 'Sin descripción'}</p>
        </div>
        <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div>
          <h3 style="margin:0 0 12px;">👥 Usuarios (${usuarios.length})</h3>
          <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:12px;min-height:100px;">
            ${usuarios.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">Sin usuarios</p>' : usuarios.map(u => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
                <div>
                  <div style="font-weight:600;">${u.nombre_completo}</div>
                  <div style="font-size:12px;color:var(--texto-secundario);">${u.rol_en_salon} • ${u.correo_electronico}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div>
          <h3 style="margin:0 0 12px;">📚 Cursos (${cursos.length})</h3>
          <div style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:12px;min-height:100px;">
            ${cursos.length === 0 ? '<p style="color:var(--texto-secundario);font-size:13px;">Sin cursos</p>' : cursos.map(c => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--borde);">
                <div>
                  <div style="font-weight:600;">Curso #${c.curso_id}</div>
                  <div style="font-size:12px;color:var(--texto-secundario);">${c.estado_curso_salon}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
}
