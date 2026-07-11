/* ============================================
   ARCHIVO: usuarios.ui.js
   MODULO: usuarios
   DEPENDENCIAS: utilidades.js (01-nucleo)
   CONTRATO:
     - Solo renderizado, NUNCA hace fetch
     - Recibe datos planos, callbacks
   ============================================ */

function renderizarUsuarios({ subordinados, onCrear, onReactivar, onDesactivar, onEliminarCompleto, onCapacidades, onEditar, onVolver, esSuperadmin }) {
  const app = document.getElementById('app');
  
  // Contar activos y suspendidos
  const activos = (subordinados || []).filter(s => s.sub_estado === 'active' || s.estado_membresia === 'active');
  const suspendidos = (subordinados || []).filter(s => s.sub_estado !== 'active' && s.estado_membresia !== 'active');
  
  app.innerHTML = `
    <div style="padding:20px;max-width:1400px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">
        <div>
          <h2>👥 Administración de Usuarios</h2>
          <p style="color:var(--texto-secundario);font-size:13px;margin:4px 0 0;">
            ${(subordinados || []).length} total · ${activos.length} activos · ${suspendidos.length} suspendidos
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
        <th style="padding:10px;">Usuario</th>
        <th style="padding:10px;">Correo</th>
        <th style="padding:10px;">Celular</th>
        <th style="padding:10px;">Rol</th>
        <th style="padding:10px;">Carrera</th>
        <th style="padding:10px;">Nivel Académico</th>
        <th style="padding:10px;">Observaciones</th>
        <th style="padding:10px;">Institución</th>
        <th style="padding:10px;">Salón/Aula</th>
        <th style="padding:10px;">Estado</th>
        <th style="padding:10px;">Creado</th>
        <th style="padding:10px;text-align:right;">Acciones</th>
      </tr>
    </thead>
    <tbody>
      ${subordinados.map(s => {
        const estadoClass = (s.sub_estado === 'active' || s.estado_membresia === 'active') ? 'background:var(--exito);' : 'background:var(--advertencia);';
        const estadoTexto = (s.sub_estado === 'active' || s.estado_membresia === 'active') ? 'Activo' : 'Suspendido';
        
        // AVATAR
        const nombreMostrar = s.sub_nombre_completo || s.nombre_completo || s.sub_nombre || s.nombre || 'Sin nombre';
        const avatarUrl = s.sub_avatar_url || s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreMostrar)}&background=random&size=32`;
        
        const correo = s.sub_correo || s.correo_electronico || s.correo || '-';
        const celular = s.sub_celular || s.numero_celular || '-';
        const rol = s.sub_nombre_rol || s.nombre_rol || 'Sin rol';
        const carrera = s.sub_carrera || s.carrera_interes || '-';
        const nivelAcademico = s.sub_nivel_academico || s.nivel_academico || '-';
        const observaciones = s.sub_observaciones || s.observaciones || '-';
        const salones = s.sub_salones || s.salones || '-';
        const nivel = s.sub_nivel !== undefined ? s.sub_nivel : (s.nivel !== undefined ? s.nivel : '-');
        const institucion = s.sub_institucion_nombre || s.institucion_nombre || 'Sistema Addison';
        const creado = s.sub_creado_en || s.creado_en || '-';
        const id = s.sub_membresia_id || s.membresia_id;
        
        // Botones según estado
        let botonesAccion = '';
        if (s.sub_estado === 'active' || s.estado_membresia === 'active') {
          botonesAccion = `
            <button class="btn-icono btn-editar" data-id="${id}" title="Editar">✏️</button>
            <button class="btn-icono btn-capacidades" data-id="${id}" title="Capacidades">🔑</button>
            <button class="btn-icono btn-desactivar" data-id="${id}" title="Desactivar">🛑</button>
            ${esSuperadmin ? `<button class="btn-icono btn-eliminar" data-id="${id}" title="Eliminar Permanentemente" style="color:var(--error);">❌</button>` : ''}
          `;
        } else {
          botonesAccion = `
            <button class="btn-icono btn-reactivar" data-id="${id}" title="Reactivar" style="color:var(--exito);">✅</button>
            ${esSuperadmin ? `<button class="btn-icono btn-eliminar" data-id="${id}" title="Eliminar Permanentemente" style="color:var(--error);">❌</button>` : ''}
          `;
        }
        
        return `
        <tr style="border-bottom:1px solid var(--borde);opacity:${(s.sub_estado === 'active' || s.estado_membresia === 'active') ? '1' : '0.6'};">
          <td style="padding:10px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:50%;background:var(--primario);color:#fff;font-size:12px;font-weight:700;">
              ${nivel}
            </span>
          </td>
          <td style="padding:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <img src="${avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="" onerror="this.src='https://ui-avatars.com/api/?name=U&background=random&size=32'">
              <span style="font-weight:500;">${nombreMostrar}</span>
            </div>
          </td>
          <td style="padding:10px;font-size:12px;color:var(--texto-secundario);">${correo}</td>
          <td style="padding:10px;font-size:12px;">${celular}</td>
          <td style="padding:10px;">${rol}</td>
          <td style="padding:10px;font-size:12px;">${carrera}</td>
          <td style="padding:10px;font-size:12px;">${nivelAcademico}</td>
          <td style="padding:10px;font-size:12px;color:var(--texto-secundario);">${observaciones}</td>
          <td style="padding:10px;font-size:12px;">${institucion}</td>
          <td style="padding:10px;font-size:12px;">${salones}</td>
          <td style="padding:10px;">
            <span style="display:inline-block;padding:4px 10px;border-radius:var(--radio-borde-xs);${estadoClass}color:#fff;font-size:11px;font-weight:600;">
              ${estadoTexto}
            </span>
          </td>
          <td style="padding:10px;font-size:11px;color:var(--texto-secundario);">${creado}</td>
          <td style="padding:10px;text-align:right;white-space:nowrap;">
            ${botonesAccion}
          </td>
        </tr>
      `;
      }).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);

  // Event listeners para botones de acción
  tabla.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('CLICK EDITAR', btn.dataset.id);
      e.stopPropagation();
      onEditar(btn.dataset.id);
    });
  });

  tabla.querySelectorAll('.btn-capacidades').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('CLICK EDITAR', btn.dataset.id);
      e.stopPropagation();
      onCapacidades(btn.dataset.id);
    });
  });
  
  tabla.querySelectorAll('.btn-desactivar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('CLICK EDITAR', btn.dataset.id);
      e.stopPropagation();
      onDesactivar(btn.dataset.id);
    });
  });
  
  tabla.querySelectorAll('.btn-reactivar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('CLICK EDITAR', btn.dataset.id);
      e.stopPropagation();
      onReactivar(btn.dataset.id);
    });
  });
  
  tabla.querySelectorAll('.btn-eliminar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      console.log('CLICK EDITAR', btn.dataset.id);
      e.stopPropagation();
      onEliminarCompleto(btn.dataset.id);
    });
  });
}

// ============================================
// MODAL CREAR USUARIO — SIMPLIFICADO
// ============================================
function renderizarModalCrearUsuario({ instituciones, salones, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalUsuarios';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:650px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:90vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nuevo Usuario</h3>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo *</label>
          <input type="text" id="inputNombre" class="input" placeholder="Nombre del usuario..." style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo Electrónico *</label>
          <input type="email" id="inputCorreo" class="input" placeholder="correo@ejemplo.com" style="width:100%;">
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Institución *</label>
          <select id="selectInstitucion" class="input" style="width:100%;">
            <option value="">-- Seleccionar --</option>
            ${Array.isArray(instituciones) ? instituciones.map(inst => `
              <option value="${inst.institucion_id}">${inst.nombre_institucion}</option>
            `).join('') : '<option value="">Error cargando</option>'}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre del Rol *</label>
          <input type="text" id="inputNombreRol" class="input" placeholder="Ej: Profesor, Alumno..." style="width:100%;">
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Jerárquico *</label>
          <select id="selectNivel" class="input" style="width:100%;">
            <option value="1">Nivel 1 - Director/Admin</option>
            <option value="2">Nivel 2 - Coordinador</option>
            <option value="3">Nivel 3 - Profesor</option>
            <option value="4">Nivel 4 - Auxiliar</option>
            <option value="5">Nivel 5 - Alumno</option>
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Superior Inmediato (membresia_id)</label>
          <input type="number" id="inputSuperior" class="input" placeholder="1" value="1" style="width:100%;">
        </div>
      </div>
      
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:16px;">
        <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
        <span>Puede crear subordinados</span>
      </label>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelar">Cancelar</button>
        <button class="btn" id="btnGuardar">Crear Usuario</button>
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
    const institucionId = document.getElementById('selectInstitucion').value;
    const nombreRol = document.getElementById('inputNombreRol').value.trim();
    const nivel = parseInt(document.getElementById('selectNivel').value);
    const puedeCrearHijos = document.getElementById('checkCrearHijos').checked;
    const superiorId = parseInt(document.getElementById('inputSuperior').value) || 1;
    
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
      superior_inmediato_id: superiorId
    });
  });
}

function renderizarModalCapacidades({ subordinado, capacidadesDisponibles, capacidadesActuales, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalCapacidades';
  
  // Asegurar que capacidadesDisponibles sea array
  const caps = Array.isArray(capacidadesDisponibles) ? capacidadesDisponibles : [];
  const capsActuales = Array.isArray(capacidadesActuales) ? capacidadesActuales : [];
  
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:500px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">🔑 Capacidades de ${subordinado.sub_nombre_completo || subordinado.nombre_completo || 'Usuario'}</h3>
      <p style="margin:0 0 12px;color:var(--texto-secundario);font-size:13px;">Nivel ${subordinado.sub_nivel || subordinado.nivel || '-'} • ${subordinado.sub_nombre_rol || subordinado.nombre_rol || 'Sin rol'}</p>
      <div style="margin:16px 0;max-height:350px;overflow-y:auto;">
        ${caps.length > 0 
          ? caps.map(cap => {
              const capId = cap.codigo || cap.capacidad_id;
              const isChecked = capsActuales.includes(capId);
              return `
                <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:var(--radio-borde-xs);cursor:pointer;margin-bottom:4px;background:var(--fondo-secundario);">
                  <input type="checkbox" value="${capId}" ${isChecked ? 'checked' : ''} style="width:18px;height:18px;">
                  <div>
                    <div style="font-weight:600;">${cap.nombre}</div>
                    <div style="font-size:12px;color:var(--texto-secundario);">${cap.categoria || ''} ${cap.descripcion || ''}</div>
                  </div>
                </label>
              `;
            }).join('')
          : '<p style="color:var(--texto-secundario);">No hay capacidades disponibles.</p>'
        }
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarCap">Cancelar</button>
        <button class="btn" id="btnGuardarCap">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarCap').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  
  document.getElementById('btnGuardarCap').addEventListener('click', () => {
    const checks = modal.querySelectorAll('input[type="checkbox"]:checked');
    const seleccionadas = Array.from(checks).map(c => c.value);
    modal.remove();
    onGuardar(seleccionadas);
  });
}


// ============================================
// MODAL EDITAR USUARIO
// ============================================
function renderizarModalEditarUsuario({ subordinado, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalEditarUsuario';
  const nombreActual = subordinado.sub_nombre_completo || subordinado.nombre_completo || '';
  const carreraActual = subordinado.sub_carrera || subordinado.carrera_interes || '';
  const celularActual = subordinado.sub_celular || subordinado.numero_celular || '';
  const nivelAcademicoActual = subordinado.sub_nivel_academico || subordinado.nivel_academico || '';
  const observacionesActual = subordinado.sub_observaciones || subordinado.observaciones || '';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:650px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:90vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;font-size:20px;">✏️ Editar Usuario</h3>
      <p style="margin:0 0 16px;color:var(--texto-secundario);font-size:13px;">${nombreActual}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo</label>
          <input type="text" id="editNombre" class="input" value="${nombreActual}" style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
          <input type="text" id="editCelular" class="input" value="${celularActual}" placeholder="999-999-999" style="width:100%;">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Carrera de Interés</label>
          <input type="text" id="editCarrera" class="input" value="${carreraActual}" placeholder="Ej: Ingeniería, Medicina..." style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Académico</label>
          <select id="editNivelAcademico" class="input" style="width:100%;">
            <option value="" ${!nivelAcademicoActual ? 'selected' : ''}>-- Seleccionar --</option>
            <option value="Primaria" ${nivelAcademicoActual === 'Primaria' ? 'selected' : ''}>Primaria</option>
            <option value="Secundaria" ${nivelAcademicoActual === 'Secundaria' ? 'selected' : ''}>Secundaria</option>
            <option value="Pregrado" ${nivelAcademicoActual === 'Pregrado' ? 'selected' : ''}>Pregrado</option>
            <option value="Posgrado" ${nivelAcademicoActual === 'Posgrado' ? 'selected' : ''}>Posgrado</option>
            <option value="Doctorado" ${nivelAcademicoActual === 'Doctorado' ? 'selected' : ''}>Doctorado</option>
          </select>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Observaciones</label>
        <textarea id="editObservaciones" class="input" rows="3" placeholder="Notas sobre el usuario..." style="width:100%;resize:vertical;">${observacionesActual}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarEditar">Cancelar</button>
        <button class="btn" id="btnGuardarEditar">Guardar Cambios</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btnCancelarEditar').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardarEditar').addEventListener('click', () => {
    const nombre = document.getElementById('editNombre').value.trim();
    const celular = document.getElementById('editCelular').value.trim();
    const carrera = document.getElementById('editCarrera').value.trim();
    const nivelAcademico = document.getElementById('editNivelAcademico').value;
    const observaciones = document.getElementById('editObservaciones').value.trim();
    const datos = {};
    if (nombre) datos.nombre_completo = nombre;
    if (celular) datos.numero_celular = celular;
    if (carrera) datos.carrera_interes = carrera;
    if (nivelAcademico) datos.nivel_academico = nivelAcademico;
    if (observaciones) datos.observaciones = observaciones;
    modal.remove();
    onGuardar(datos);
  });
}
