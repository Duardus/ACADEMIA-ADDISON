/* ========
 ARCHIVO: usuarios.ui.js
 MODULO: usuarios - FIX Instituciones + Borrado a blanco + Nombre
 - Solo renderizado, NUNCA hace fetch
 ================================ */

function renderizarUsuarios({ subordinados, onCrear, onReactivar, onDesactivar, onEliminarCompleto, onCapacidades, onEditar, onVolver, esSuperadmin }) {
  const app = document.getElementById('app');
  const activos = (subordinados || []).filter(s => s.sub_estado === 'active' || s.estado_membresia === 'active');
  const suspendidos = (subordinados || []).filter(s => s.sub_estado !== 'active' && s.estado_membresia !== 'active');
  const sinInstitucion = (subordinados || []).filter(s => !s.sub_institucion_id && !s.institucion_id && !s.sub_institucion_nombre);
  app.innerHTML = `
    <div style="padding:20px">
      <h2>👥 Administración de Usuarios</h2>
      <p>${(subordinados || []).length} total · ${activos.length} activos · ${suspendidos.length} suspendidos ${sinInstitucion.length>0?`· <span style="color:#ff3b30;font-weight:bold">⚠️ ${sinInstitucion.length} sin institución</span>`:''}</p>
      ${sinInstitucion.length>0 && esSuperadmin ? `<div style="background:#ffecec;border:1px solid #ff3b30;color:#a00;padding:12px;border-radius:8px;margin:10px 0">🚨 <b>Crítico:</b> Hay usuarios sin institución. Asígnalos desde Editar o crea una institución.</div>`:''}
      <button id="btnVolver">← Volver</button>
      <button id="btnCrearUsuario" style="margin-left:10px;background:#007aff;color:white;padding:8px 14px;border:none;border-radius:6px">+ Nuevo Usuario</button>
      <div id="usuariosContenido" style="margin-top:20px"></div>
    </div>
  `;
  document.getElementById('btnVolver').addEventListener('click', onVolver);
  document.getElementById('btnCrearUsuario').addEventListener('click', onCrear);
  const contenedor = document.getElementById('usuariosContenido');
  if (!subordinados || subordinados.length === 0) { contenedor.innerHTML = '<p>No hay usuarios registrados.</p>'; return; }
  const tabla = document.createElement('table');
  tabla.style.width = '100%'; tabla.style.borderCollapse = 'collapse'; tabla.style.fontSize = '14px';
  tabla.innerHTML = `
    <thead><tr style="background:#f5f5f5"><th>Nivel</th><th>Usuario</th><th>Correo</th><th>Celular</th><th>Rol</th><th>Carrera</th><th>Nivel Académico</th><th>Observaciones</th><th>Institución</th><th>Salón</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>
    ${subordinados.map(s => {
      const estadoClass = (s.sub_estado === 'active' || s.estado_membresia === 'active') ? 'background:#34c759;color:white' : 'background:#ffcc00';
      const estadoTexto = (s.sub_estado === 'active' || s.estado_membresia === 'active') ? 'Activo' : 'Suspendido';
      const nombreMostrar = s.sub_nombre_completo || s.nombre_completo || 'Sin nombre';
      const avatarUrl = s.sub_avatar_url || s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreMostrar)}&background=random&size=32`;
      const correo = s.sub_correo || s.correo_electronico || '-';
      const celular = s.sub_celular || s.numero_celular || '-';
      const rol = s.sub_nombre_rol || s.nombre_rol || 'Sin rol';
      const carrera = s.sub_carrera || s.carrera_interes || '-';
      const nivelAcademico = s.sub_nivel_academico || s.nivel_academico || '-';
      const observaciones = s.sub_observaciones || s.observaciones || '-';
      const salones = s.sub_salones || s.salones || '-';
      const nivel = s.sub_nivel ?? s.nivel ?? '-';
      const institucionRaw = s.sub_institucion_nombre || s.institucion_nombre || '';
      const institucion = institucionRaw || (esSuperadmin ? '<span style="color:#ff3b30">⚠️ Sin institución</span>' : 'Sistema Addison');
      const id = s.sub_membresia_id || s.membresia_id;
      let botonesAccion = '';
      if (s.sub_estado === 'active' || s.estado_membresia === 'active') {
        botonesAccion = `<button class="btn-editar" data-id="${id}">✏️</button> <button class="btn-capacidades" data-id="${id}">🔑</button> <button class="btn-desactivar" data-id="${id}">⏸️</button> ${esSuperadmin ? `<button class="btn-eliminar" data-id="${id}" style="color:#ff3b30">🗑️</button>`:''}`;
      } else {
        botonesAccion = `<button class="btn-editar" data-id="${id}">✏️</button> <button class="btn-reactivar" data-id="${id}">▶️</button> ${esSuperadmin ? `<button class="btn-eliminar" data-id="${id}" style="color:#ff3b30">🗑️</button>`:''}`;
      }
      return `<tr><td>${nivel}</td><td><img src="${avatarUrl}" width="24" style="border-radius:50%;vertical-align:middle"> ${nombreMostrar}</td><td>${correo}</td><td>${celular}</td><td>${rol}</td><td>${carrera}</td><td>${nivelAcademico}</td><td>${observaciones}</td><td>${institucion}</td><td>${salones}</td><td><span style="padding:3px 8px;border-radius:10px;${estadoClass}">${estadoTexto}</span></td><td>${botonesAccion}</td></tr>`;
    }).join('')}
    </tbody>
  `;
  contenedor.appendChild(tabla);
  tabla.querySelectorAll('.btn-editar').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onEditar(btn.dataset.id); }));
  tabla.querySelectorAll('.btn-capacidades').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onCapacidades(btn.dataset.id); }));
  tabla.querySelectorAll('.btn-desactivar').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onDesactivar(btn.dataset.id); }));
  tabla.querySelectorAll('.btn-reactivar').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onReactivar(btn.dataset.id); }));
  tabla.querySelectorAll('.btn-eliminar').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); onEliminarCompleto(btn.dataset.id); }));
}

function renderizarModalCrearUsuario({ instituciones, salones, onGuardar, onCancelar, esSuperadmin }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());
  const modal = document.createElement('div');
  modal.className = 'modal'; modal.id = 'modalUsuarios';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999';
  const tieneInstituciones = Array.isArray(instituciones) && instituciones.length>0;
  modal.innerHTML = `
    <div style="background:white;padding:20px;border-radius:12px;width:520px;max-height:90vh;overflow:auto">
      <h3>➕ Nuevo Usuario</h3>
      ${!tieneInstituciones ? `<div style="background:#ffecec;border:1px solid #ff3b30;color:#a00;padding:10px;border-radius:8px;margin:10px 0">🚨 <b>Crítico:</b> No hay instituciones. ${esSuperadmin ? 'Como <b>superadmin</b> puedes crear un <b>usuario suelto</b> y asignarlo después, o <a href="#" id="linkCrearInstitucion" style="color:#ff3b30;text-decoration:underline">crear institución primero</a>.' : 'Pide a un superadmin que cree una institución.'}</div>` : ''}
      <label>Nombre completo *</label><input id="inputNombre" style="width:100%;margin-bottom:8px" placeholder="Ej: Juan Perez">
      <label>Correo *</label><input id="inputCorreo" style="width:100%;margin-bottom:8px" placeholder="correo@test.com">
      <label>Institución ${!tieneInstituciones && esSuperadmin ? '(opcional para superadmin - usuario suelto)' : '*'}</label>
      <select id="selectInstitucion" style="width:100%;margin-bottom:8px"><option value="">${tieneInstituciones ? '-- Selecciona --' : '-- Sin institución (usuario suelto) --'}</option>${(instituciones||[]).map(i=>`<option value="${i.institucion_id}">${i.nombre_institucion||i.nombre||'Institución '+i.institucion_id}</option>`).join('')}</select>
      <label>Rol</label><input id="inputNombreRol" style="width:100%;margin-bottom:8px" value="Miembro">
      <label>Nivel</label><select id="selectNivel" style="width:100%;margin-bottom:8px"><option value="1">1 - Asistente</option><option value="5" selected>5 - Miembro</option><option value="10">10 - Coordinador</option></select>
      <label>Superior inmediato ID</label><input id="inputSuperior" style="width:100%;margin-bottom:8px" type="number" value="1">
      <label>Salón (opcional)</label><select id="selectSalon" style="width:100%;margin-bottom:8px"><option value="">-- Sin salón --</option></select>
      <label>Celular</label><input id="inputCelular" style="width:100%;margin-bottom:8px">
      <label>Carrera interés</label><input id="inputCarrera" style="width:100%;margin-bottom:8px">
      <label>Nivel académico</label><select id="inputNivelAcademico" style="width:100%;margin-bottom:8px"><option value="">--</option><option>Secundaria</option><option>Preuniversitario</option><option>Universitario</option></select>
      <label>Observaciones</label><textarea id="inputObservaciones" style="width:100%;margin-bottom:12px"></textarea>
      <label><input type="checkbox" id="checkCrearHijos"> Puede crear subordinados</label>
      <div style="margin-top:14px;text-align:right"><button id="btnCancelar">Cancelar</button> <button id="btnGuardar" style="background:#007aff;color:white;padding:8px 14px;border:none;border-radius:6px">Guardar</button></div>
    </div>
  `;
  document.body.appendChild(modal);
  const linkInst = document.getElementById('linkCrearInstitucion');
  if (linkInst) linkInst.addEventListener('click', e=>{ e.preventDefault(); modal.remove(); if(window.app && window.app.navegar) window.app.navegar('instituciones'); else alert('Ve a Instituciones y crea una'); });
  document.getElementById('selectInstitucion').addEventListener('change', async e=>{
    const institucionId=e.target.value; const salonSelect=document.getElementById('selectSalon');
    if(!institucionId){ salonSelect.innerHTML='<option value="">-- Sin salón --</option>'; return; }
    try{ const resp=await apiObtenerSalones(institucionId); const salones=resp?.salones||resp?.datos?.salones||[]; salonSelect.innerHTML='<option value="">-- Sin salón --</option>'+salones.map(s=>`<option value="${s.salon_id}">${s.nombre_salon||s.nombre}</option>`).join(''); }catch{ salonSelect.innerHTML='<option value="">-- Sin salón --</option>'; }
  });
  document.getElementById('btnCancelar').addEventListener('click', ()=>{ modal.remove(); onCancelar(); });
  document.getElementById('btnGuardar').addEventListener('click', ()=>{
    const nombre=document.getElementById('inputNombre').value.trim();
    const correo=document.getElementById('inputCorreo').value.trim();
    const institucionId=document.getElementById('selectInstitucion').value;
    const nombreRol=document.getElementById('inputNombreRol').value.trim();
    const nivel=parseInt(document.getElementById('selectNivel').value);
    const puedeCrearHijos=document.getElementById('checkCrearHijos').checked;
    const superiorId=parseInt(document.getElementById('inputSuperior').value)||1;
    if(!correo){ alert('Correo es obligatorio, superadmin puede crear solo con correo'); return; }
    if(!tieneInstituciones && !esSuperadmin){ alert('No hay instituciones, contacta superadmin'); return; }
    if(!institucionId && !esSuperadmin){ alert('Institución es obligatoria'); return; }
    const salonId=document.getElementById('selectSalon')?.value||'';
    const celular=document.getElementById('inputCelular')?.value?.trim()||'';
    const carrera=document.getElementById('inputCarrera')?.value?.trim()||'';
    const nivelAcademico=document.getElementById('inputNivelAcademico')?.value||'';
    const observaciones=document.getElementById('inputObservaciones')?.value?.trim()||'';
    modal.remove();
    const datos={ nombre_completo:nombre, email:correo, nombre_rol:nombreRol||'Miembro', nivel_jerarquico:nivel, puede_crear_hijos:puedeCrearHijos, superior_inmediato_id:superiorId };
    if(institucionId) datos.institucion_id=parseInt(institucionId); else if(esSuperadmin) datos.institucion_id=null;
    if(salonId) datos.salon_ids=[parseInt(salonId)];
    if(celular) datos.numero_celular=celular;
    if(carrera) datos.carrera_interes=carrera;
    if(nivelAcademico) datos.nivel_academico=nivelAcademico;
    if(observaciones) datos.observaciones=observaciones;
    onGuardar(datos);
  });
}

function renderizarModalCapacidades({ subordinado, capacidadesDisponibles, capacidadesActuales, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  const modal=document.createElement('div'); modal.className='modal'; modal.id='modalCapacidades';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999';
  const caps=Array.isArray(capacidadesDisponibles)?capacidadesDisponibles:[]; const capsActuales=Array.isArray(capacidadesActuales)?capacidadesActuales:[];
  modal.innerHTML=`<div style="background:white;padding:20px;border-radius:12px;width:480px;max-height:80vh;overflow:auto"><h3>🔑 Capacidades</h3><div>${caps.map(cap=>{const capId=cap.codigo||cap.capacidad_id; const isChecked=capsActuales.includes(capId); return `<label style="display:block;margin:6px 0"><input type="checkbox" value="${capId}" ${isChecked?'checked':''}> ${cap.nombre||cap.codigo}</label>`}).join('')||'No hay capacidades'}</div><div style="text-align:right;margin-top:12px"><button id="btnCancelarCap">Cancelar</button> <button id="btnGuardarCap" style="background:#007aff;color:white;padding:6px 12px;border:none;border-radius:6px">Guardar</button></div></div>`;
  document.body.appendChild(modal);
  document.getElementById('btnCancelarCap').addEventListener('click',()=>{modal.remove(); onCancelar();});
  document.getElementById('btnGuardarCap').addEventListener('click',()=>{const checks=modal.querySelectorAll('input[type="checkbox"]:checked'); const seleccionadas=Array.from(checks).map(c=>c.value); modal.remove(); onGuardar(seleccionadas);});
}

function renderizarModalEditarUsuario({ subordinado, instituciones, salones, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  const modal=document.createElement('div'); modal.className='modal'; modal.id='modalEditarUsuario';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999';
  const nombreActual=subordinado.sub_nombre_completo||subordinado.nombre_completo||'';
  const carreraActual=subordinado.sub_carrera||subordinado.carrera_interes||'';
  const celularActual=subordinado.sub_celular||subordinado.numero_celular||'';
  const nivelAcademicoActual=subordinado.sub_nivel_academico||subordinado.nivel_academico||'';
  const observacionesActual=subordinado.sub_observaciones||subordinado.observaciones||'';
  const rolActual=subordinado.sub_nombre_rol||subordinado.nombre_rol||'';
  const nivelActual=subordinado.sub_nivel!==undefined?subordinado.sub_nivel:(subordinado.nivel!==undefined?subordinado.nivel:5);
  const superiorActual=subordinado.sub_padre_membresia_id||subordinado.padre_membresia_id||'';
  const puedeCrearHijos=subordinado.sub_puede_crear_hijos||subordinado.puede_crear_hijos||false;
  const institucionActual=subordinado.sub_institucion_id||subordinado.institucion_id||'';
  const salonActual=subordinado.sub_salon_id||subordinado.salon_id||'';
  const membresiaId=subordinado.sub_membresia_id||subordinado.membresia_id||'';
  modal.innerHTML=`
    <div style="background:white;padding:20px;border-radius:12px;width:520px;max-height:90vh;overflow:auto">
      <h3>✏️ Editar Usuario #${membresiaId}</h3>
      ${!institucionActual?'<div style="background:#ffecec;border:1px solid #ff3b30;color:#a00;padding:8px;border-radius:6px;margin-bottom:10px">⚠️ <b>Sin institución</b> - Asigna una para que deje de estar en crítico</div>':''}
      <label>Nombre completo *</label><input id="editNombre" style="width:100%;margin-bottom:8px" value="${nombreActual.replace(/"/g,'&quot;')}">
      <small style="color:#666">Deja en blanco para borrar el campo</small>
      <label style="margin-top:8px;display:block">Celular</label><input id="editCelular" style="width:100%;margin-bottom:8px" value="${celularActual}">
      <label>Carrera interés</label><input id="editCarrera" style="width:100%;margin-bottom:8px" value="${carreraActual}">
      <label>Nivel académico</label><select id="editNivelAcademico" style="width:100%;margin-bottom:8px"><option value="">-- Vacío (borrar) --</option><option ${nivelAcademicoActual==='Secundaria'?'selected':''}>Secundaria</option><option ${nivelAcademicoActual==='Preuniversitario'?'selected':''}>Preuniversitario</option><option ${nivelAcademicoActual==='Universitario'?'selected':''}>Universitario</option></select>
      <label>Observaciones</label><textarea id="editObservaciones" style="width:100%;margin-bottom:8px">${observacionesActual}</textarea>
      <label>Rol</label><input id="editNombreRol" style="width:100%;margin-bottom:8px" value="${rolActual}">
      <label>Nivel jerárquico</label><input id="editNivel" type="number" style="width:100%;margin-bottom:8px" value="${nivelActual}">
      <label>Superior inmediato ID</label><input id="editSuperior" type="number" style="width:100%;margin-bottom:8px" value="${superiorActual}">
      <label>Institución</label><select id="editInstitucion" style="width:100%;margin-bottom:8px"><option value="">-- Sin institución (crítico) --</option>${(instituciones||[]).map(i=>`<option value="${i.institucion_id}" ${String(i.institucion_id)===String(institucionActual)?'selected':''}>${i.nombre_institucion||i.nombre}</option>`).join('')}</select>
      <label>Salón</label><select id="editSalon" style="width:100%;margin-bottom:8px"><option value="">-- Sin salón --</option>${(salones||[]).map(s=>`<option value="${s.salon_id}" ${String(s.salon_id)===String(salonActual)?'selected':''}>${s.nombre_salon||s.nombre}</option>`).join('')}</select>
      <label><input type="checkbox" id="editCrearHijos" ${puedeCrearHijos?'checked':''}> Puede crear subordinados</label>
      <div style="text-align:right;margin-top:14px"><button id="btnCancelarEditar">Cancelar</button> <button id="btnGuardarEditar" style="background:#007aff;color:white;padding:8px 14px;border:none;border-radius:6px">Guardar cambios</button></div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btnCancelarEditar').addEventListener('click',()=>{modal.remove(); onCancelar();});
  document.getElementById('btnGuardarEditar').addEventListener('click',()=>{
    const nombre=document.getElementById('editNombre').value;
    const celular=document.getElementById('editCelular').value;
    const carrera=document.getElementById('editCarrera').value;
    const nivelAcademico=document.getElementById('editNivelAcademico').value;
    const observaciones=document.getElementById('editObservaciones').value;
    const nombreRol=document.getElementById('editNombreRol').value;
    const nivel=parseInt(document.getElementById('editNivel').value);
    const superiorRaw=document.getElementById('editSuperior').value.trim();
    const superiorId=superiorRaw===''?null:parseInt(superiorRaw);
    const puedeCrear=document.getElementById('editCrearHijos').checked;
    const institucionId=document.getElementById('editInstitucion').value;
    const salonId=document.getElementById('editSalon').value;
    const datos={
      membresia_id:membresiaId,
      nombre_completo:nombre,
      numero_celular:celular,
      carrera_interes:carrera,
      nivel_academico:nivelAcademico,
      observaciones:observaciones,
      nombre_rol:nombreRol,
      nivel_jerarquico:isNaN(nivel)?null:nivel,
   superior_inmediato_id:superiorId,
      puede_crear_hijos:puedeCrear,
      institucion_id:institucionId===''?null:parseInt(institucionId),
      salon_ids:salonId? [parseInt(salonId)] : []
    };
    modal.remove();
    onGuardar(datos);
  });
}
