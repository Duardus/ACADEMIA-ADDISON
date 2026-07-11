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
        <th style="padding:10px;">Usuario</th>
        <th style="padding:10px;">Correo</th>
        <th style="padding:10px;">Rol</th>
        <th style="padding:10px;">Salones</th>
        <th style="padding:10px;">Suscripción</th>
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
        
        // SUSCRIPCIÓN: días restantes y estado
        const diasRestantes = s.dias_restantes || 0;
        const suscripcion = s.suscripcion || {};
        let suscripcionHtml = '';
        if (diasRestantes > 7) {
          suscripcionHtml = `<span style="color:var(--exito);font-size:12px;font-weight:600;">${diasRestantes} días</span>`;
        } else if (diasRestantes > 0) {
          suscripcionHtml = `<span style="color:var(--advertencia);font-size:12px;font-weight:600;">⚠️ ${diasRestantes} días</span>`;
        } else {
          suscripcionHtml = `<span style="color:var(--error);font-size:12px;font-weight:600;">VENCIDO</span>`;
        }
        if (suscripcion.monto_pagado) {
          suscripcionHtml += `<br><span style="font-size:11px;color:var(--texto-secundario);">S/ ${suscripcion.monto_pagado}</span>`;
        }
        
        const estadoClass = s.sub_estado === 'active' ? 'background:var(--exito);' : 'background:var(--advertencia);';
        const estadoTexto = s.sub_estado === 'active' ? 'Activo' : 'Suspendido';
        
        const puedeCrear = s.sub_puede_crear_hijos ? '✅' : '❌';
        
        // AVATAR
        const avatarUrl = s.sub_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.sub_nombre_completo || 'U')}&background=random&size=32`;
        
        // Botones según estado
        let botonesAccion = '';
        if (s.sub_estado === 'active') {
          botonesAccion = `
            <button class="btn-icono" data-accion="capacidades" data-id="${s.sub_membresia_id}" title="Capacidades">🔑</button>
            <button class="btn-icono" data-accion="desactivar" data-id="${s.sub_membresia_id}" title="Desactivar">🛑</button>
            ${esSuperadmin ? `<button class="btn-icono" data-accion="eliminar" data-id="${s.sub_membresia_id}" title="Eliminar Permanentemente" style="color:var(--error);">❌</button>` : ''}
          `;
        } else {
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
          <td style="padding:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <img src="${avatarUrl}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="">
              <span style="font-weight:500;">${s.sub_nombre_completo || s.sub_nombre || 'Sin nombre'}</span>
            </div>
          </td>
          <td style="padding:10px;font-size:12px;color:var(--texto-secundario);">${s.sub_correo || s.correo || '-'}</td>
          <td style="padding:10px;">${s.sub_nombre_rol || s.nombre_rol || 'Sin rol'}</td>
          <td style="padding:10px;">${salonesTexto}</td>
          <td style="padding:10px;">${suscripcionHtml}</td>
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
// MODAL CREAR USUARIO — ESTILO NOTION
// ============================================
function renderizarModalCrearUsuario({ instituciones, salones, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalUsuarios';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:650px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;max-height:90vh;overflow-y:auto;">
      <h3 style="margin:0 0 16px;font-size:20px;">+ Nuevo Usuario</h3>
      
      <!-- SECCIÓN: DATOS BÁSICOS -->
      <div style="margin:16px 0;padding:16px;background:var(--fondo-secundario);border-radius:var(--radio-borde-xs);">
        <h4 style="margin:0 0 12px;font-size:14px;color:var(--texto-secundario);text-transform:uppercase;letter-spacing:1px;">📋 Datos Básicos</h4>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo *</label>
            <input type="text" id="inputNombre" class="input" placeholder="Nombre del usuario..." style="width:100%;">
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Correo Electrónico *</label>
            <input type="email" id="inputCorreo" class="input" placeholder="correo@ejemplo.com" style="width:100%;">
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
            <input type="tel" id="inputCelular" class="input" placeholder="+51 999 888 777" style="width:100%;">
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Fecha de Nacimiento</label>
            <input type="date" id="inputFechaNac" class="input" style="width:100%;">
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN: INSTITUCIÓN Y ROL -->
      <div style="margin:16px 0;padding:16px;background:var(--fondo-secundario);border-radius:var(--radio-borde-xs);">
        <h4 style="margin:0 0 12px;font-size:14px;color:var(--texto-secundario);text-transform:uppercase;letter-spacing:1px;">🏫 Institución y Rol</h4>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Institución *</label>
            <select id="selectInstitucion" class="input" style="width:100%;">
              <option value="">-- Seleccionar --</option>
              ${Array.isArray(instituciones) ? instituciones.map(inst => `
                <option value="${inst.institucion_id}">${inst.nombre_institucion}</option>
              `).join('') : '<option value="">Error cargando instituciones</option>'}
            </select>
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Salón / Grupo (Ctrl+Click varios)</label>
            <select id="selectSalon" class="input" multiple style="width:100%;height:60px;">
              <option value="">-- Primero selecciona institución --</option>
            </select>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre del Rol *</label>
            <input type="text" id="inputNombreRol" class="input" placeholder="Ej: Profesor, Alumno..." style="width:100%;">
          </div>
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
        </div>
        
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-top:12px;">
          <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
          <span>Puede crear subordinados</span>
        </label>
      </div>
      
      <!-- SECCIÓN: SUSCRIPCIÓN Y PAGO -->
      <div style="margin:16px 0;padding:16px;background:var(--fondo-secundario);border-radius:var(--radio-borde-xs);">
        <h4 style="margin:0 0 12px;font-size:14px;color:var(--texto-secundario);text-transform:uppercase;letter-spacing:1px;">💰 Suscripción y Pago</h4>
        
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Tipo de Plan</label>
            <select id="selectPlan" class="input" style="width:100%;">
              <option value="mensual">Mensual (30 días)</option>
              <option value="trimestral">Trimestral (90 días)</option>
              <option value="semestral">Semestral (180 días)</option>
              <option value="anual">Anual (365 días)</option>
            </select>
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Monto Pagado (S/)</label>
            <input type="number" id="inputMonto" class="input" placeholder="0.00" step="0.01" min="0" style="width:100%;">
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Fecha de Vencimiento</label>
            <input type="date" id="inputVencimiento" class="input" style="width:100%;">
          </div>
        </div>
        
        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Comprobante de Pago (imagen)</label>
          <input type="file" id="inputComprobante" class="input" accept="image/*" style="width:100%;">
          <p style="font-size:11px;color:var(--texto-secundario);margin:4px 0 0;">JPG, PNG. Máx 2MB. Se comprimirá automáticamente.</p>
        </div>
      </div>
      
      <!-- SECCIÓN: DATOS EXTRA (ESTILO NOTION) -->
      <div style="margin:16px 0;padding:16px;background:var(--fondo-secundario);border-radius:var(--radio-borde-xs);">
        <h4 style="margin:0 0 12px;font-size:14px;color:var(--texto-secundario);text-transform:uppercase;letter-spacing:1px;">📝 Datos Adicionales</h4>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Carrera / Interés</label>
            <input type="text" id="inputCarrera" class="input" placeholder="Ej: Ingeniería, Medicina..." style="width:100%;">
          </div>
          <div>
            <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Académico</label>
            <input type="text" id="inputNivelAcademico" class="input" placeholder="Ej: Universitario, Secundaria..." style="width:100%;">
          </div>
        </div>
        
        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Cursos que Enseña (separados por coma)</label>
          <input type="text" id="inputCursos" class="input" placeholder="Matemática, Física, Química..." style="width:100%;">
        </div>
        
        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Dirección</label>
          <input type="text" id="inputDireccion" class="input" placeholder="Av. Principal 123, Lima" style="width:100%;">
        </div>
        
        <div style="margin-top:12px;">
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Observaciones / Notas</label>
          <textarea id="inputObservaciones" class="input" placeholder="Notas adicionales..." style="width:100%;min-height:60px;resize:vertical;"></textarea>
        </div>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;">
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
    
    const salonesFiltrados = Array.isArray(salones) ? salones.filter(s => s.institucion_id == instId) : [];
    
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

  // Calcular fecha de vencimiento automática según plan
  const selectPlan = document.getElementById('selectPlan');
  const inputVencimiento = document.getElementById('inputVencimiento');
  
  function calcularVencimiento() {
    const plan = selectPlan.value;
    const dias = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 };
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + (dias[plan] || 30));
    inputVencimiento.value = hoy.toISOString().split('T')[0];
  }
  selectPlan.addEventListener('change', calcularVencimiento);
  calcularVencimiento(); // Calcular al abrir

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
    
    // Recoger datos de suscripción
    const tipoPlan = document.getElementById('selectPlan').value;
    const montoPagado = parseFloat(document.getElementById('inputMonto').value) || 0;
    const fechaVencimiento = document.getElementById('inputVencimiento').value;
    
    // Recoger datos extra
    const celular = document.getElementById('inputCelular').value.trim();
    const fechaNacimiento = document.getElementById('inputFechaNac').value;
    const carrera = document.getElementById('inputCarrera').value.trim();
    const nivelAcademico = document.getElementById('inputNivelAcademico').value.trim();
    const cursos = document.getElementById('inputCursos').value.trim();
    const direccion = document.getElementById('inputDireccion').value.trim();
    const observaciones = document.getElementById('inputObservaciones').value.trim();
    
    modal.remove();
    onGuardar({ 
      nombre_completo: nombre, 
      email: correo, 
      institucion_id: parseInt(institucionId),
      nombre_rol: nombreRol || 'Miembro',
      nivel_jerarquico: nivel,
      puede_crear_hijos: puedeCrearHijos,
      salon_ids: salonIds,
      superior_inmediato_id: 1,
      // Suscripción
      tipo_plan: tipoPlan,
      duracion_dias: { mensual: 30, trimestral: 90, semestral: 180, anual: 365 }[tipoPlan],
      monto_pagado: montoPagado,
      fecha_vencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
      // Datos extra
      numero_celular: celular,
      fecha_nacimiento: fechaNacimiento || null,
      carrera_interes: carrera,
      nivel_academico: nivelAcademico,
      cursos_enseña: cursos,
      direccion: direccion,
      observaciones: observaciones
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
        ${Array.isArray(capacidadesDisponibles) && capacidadesDisponibles.length > 0 
          ? capacidadesDisponibles.map(cap => `
            <label style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:var(--radio-borde-xs);cursor:pointer;margin-bottom:4px;background:var(--fondo-secundario);">
              <input type="checkbox" value="${cap.codigo || cap.capacidad_id}" ${(capacidadesActuales || []).includes(cap.codigo || cap.capacidad_id) ? 'checked' : ''} style="width:18px;height:18px;">
              <div>
                <div style="font-weight:600;">${cap.nombre}</div>
                <div style="font-size:12px;color:var(--texto-secundario);">${cap.descripcion || cap.categoria || ''}</div>
              </div>
            </label>
          `).join('')
          : '<p style="color:var(--texto-secundario);">No hay capacidades disponibles.</p>'
        }
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
