const fs = require('fs');

// ============================================
// 1. RECREAR usuarios.api.js LIMPIO (sin duplicados)
// ============================================
console.log('🔧 1. API limpia...');
const apiLimpio = `/* ============================================
   ARCHIVO: usuarios.api.js
   MODULO: usuarios
   ============================================ */

async function apiObtenerSubordinados() {
  return await get('/jerarquia/mis-subordinados');
}

async function apiObtenerCapacidades() {
  return await get('/jerarquia/mis-capacidades');
}

async function apiCrearSubordinado(datos) {
  return await post('/jerarquia/crear', datos);
}

async function apiCambiarEstadoSubordinado(membresiaId, estado) {
  return await post('/jerarquia/cambiar-estado/' + membresiaId, { estado });
}

async function apiDesactivarSubordinado(membresiaId) {
  const token = obtenerToken?.() || '';
  const resp = await fetch(API_CONFIG.BASE_URL + '/jerarquia/subordinado/' + membresiaId, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
  const json = await resp.json();
  if (!resp.ok || json.exito === false) {
    throw new Error(json.error || 'HTTP ' + resp.status);
  }
  return json.datos !== undefined ? json.datos : json;
}

async function apiEliminarSubordinadoCompleto(membresiaId) {
  const token = obtenerToken?.() || '';
  const resp = await fetch(API_CONFIG.BASE_URL + '/jerarquia/subordinado/' + membresiaId + '/eliminar', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
  const json = await resp.json();
  if (!resp.ok || json.exito === false) {
    throw new Error(json.error || 'HTTP ' + resp.status);
  }
  return json.datos !== undefined ? json.datos : json;
}

async function apiModificarCapacidades(membresiaId, capacidades) {
  return await put('/jerarquia/subordinado/' + membresiaId + '/capacidades', { capacidades_ids: capacidades });
}

async function apiObtenerEtiquetas() {
  return await get('/jerarquia/etiquetas');
}

async function apiObtenerInstituciones() {
  return await get('/instituciones');
}

async function apiObtenerSalones(institucionId) {
  if (!institucionId) return { salones: [] };
  return await get('/salones?institucion_id=' + institucionId);
}

async function apiEditarSubordinado(membresiaId, datos) {
  return await put('/jerarquia/subordinado/' + membresiaId, datos);
}
`;
fs.writeFileSync('./js/02-modulos/usuarios/usuarios.api.js', apiLimpio);
console.log('✅ API recreada limpia');

// ============================================
// 2. ARREGLAR modal CREAR usuario — agregar campos opcionales + salón
// ============================================
console.log('🔧 2. Modal crear con todos los campos...');
let ui = fs.readFileSync('./js/02-modulos/usuarios/usuarios.ui.js', 'utf8');

// Buscar el modal crear y reemplazarlo completamente
const inicioModalCrear = ui.indexOf('// ============================================');
const finModalCrear = ui.indexOf('function renderizarModalEditarUsuario');
const modalEditarExistente = ui.slice(finModalCrear);

const modalCrearNuevo = `// ============================================
// MODAL CREAR USUARIO — COMPLETO
// ============================================
function renderizarModalCrearUsuario({ instituciones, salones, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalUsuarios';
  modal.innerHTML = \\`
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
            \\${Array.isArray(instituciones) ? instituciones.map(inst => \\`
              <option value="\\${inst.institucion_id}">\\${inst.nombre_institucion}</option>
            \\`).join('') : '<option value="">Error cargando</option>'}
          </select>
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Salón / Aula</label>
          <select id="selectSalon" class="input" style="width:100%;" disabled>
            <option value="">-- Primero selecciona institución --</option>
            \\${Array.isArray(salones) && salones.length > 0 ? salones.map(s => \\`
              <option value="\\${s.salon_id}">\\${s.nombre_salon}</option>
            \\`).join('') : '<option value="">Sin aulas disponibles</option>'}
          </select>
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
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
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Superior Inmediato (membresia_id)</label>
          <input type="number" id="inputSuperior" class="input" placeholder="1" value="1" style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
          <input type="text" id="inputCelular" class="input" placeholder="999-999-999" style="width:100%;">
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Carrera de Interés</label>
          <input type="text" id="inputCarrera" class="input" placeholder="Ej: Ingeniería, Medicina..." style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nivel Académico</label>
          <select id="inputNivelAcademico" class="input" style="width:100%;">
            <option value="">-- Seleccionar --</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
            <option value="Pregrado">Pregrado</option>
            <option value="Posgrado">Posgrado</option>
            <option value="Doctorado">Doctorado</option>
          </select>
        </div>
      </div>
      
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Observaciones</label>
        <textarea id="inputObservaciones" class="input" rows="2" placeholder="Notas sobre el usuario..." style="width:100%;resize:vertical;"></textarea>
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
  \\`;
  document.body.appendChild(modal);

  // Evento: al cambiar institución, cargar salones
  document.getElementById('selectInstitucion').addEventListener('change', async (e) => {
    const institucionId = e.target.value;
    const salonSelect = document.getElementById('selectSalon');
    if (!institucionId) {
      salonSelect.innerHTML = '<option value="">-- Primero selecciona institución --</option>';
      salonSelect.disabled = true;
      return;
    }
    try {
      salonSelect.innerHTML = '<option value="">Cargando aulas...</option>';
      const resp = await apiObtenerSalones(institucionId);
      const salones = resp?.salones || resp?.datos?.salones || [];
      if (salones.length === 0) {
        salonSelect.innerHTML = '<option value="">Sin aulas en esta institución</option>';
        salonSelect.disabled = false;
      } else {
        salonSelect.innerHTML = '<option value="">-- Seleccionar aula --</option>' +
          salones.map(s => \\`<option value="\\${s.salon_id}">\\${s.nombre_salon}</option>\\`).join('');
        salonSelect.disabled = false;
      }
    } catch (err) {
      salonSelect.innerHTML = '<option value="">Error cargando aulas</option>';
      salonSelect.disabled = true;
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
    const salonId = document.getElementById('selectSalon').value;
    const nombreRol = document.getElementById('inputNombreRol').value.trim();
    const nivel = parseInt(document.getElementById('selectNivel').value);
    const puedeCrearHijos = document.getElementById('checkCrearHijos').checked;
    const superiorId = parseInt(document.getElementById('inputSuperior').value) || 1;
    const celular = document.getElementById('inputCelular').value.trim();
    const carrera = document.getElementById('inputCarrera').value.trim();
    const nivelAcademico = document.getElementById('inputNivelAcademico').value;
    const observaciones = document.getElementById('inputObservaciones').value.trim();
    
    if (!nombre || !correo || !institucionId) {
      alert('Nombre, correo e institución son obligatorios');
      return;
    }
    
    modal.remove();
    const datos = { 
      nombre_completo: nombre, 
      email: correo, 
      institucion_id: parseInt(institucionId),
      nombre_rol: nombreRol || 'Miembro',
      nivel_jerarquico: nivel,
      puede_crear_hijos: puedeCrearHijos,
      superior_inmediato_id: superiorId
    };
    if (salonId) datos.salon_ids = [parseInt(salonId)];
    if (celular) datos.numero_celular = celular;
    if (carrera) datos.carrera_interes = carrera;
    if (nivelAcademico) datos.nivel_academico = nivelAcademico;
    if (observaciones) datos.observaciones = observaciones;
    onGuardar(datos);
  });
}

`;

// Reemplazar todo desde el inicio del modal crear hasta justo antes del modal editar
ui = ui.slice(0, inicioModalCrear) + modalCrearNuevo + modalEditarExistente;
fs.writeFileSync('./js/02-modulos/usuarios/usuarios.ui.js', ui);
console.log('✅ Modal crear recreado con todos los campos + salón');

// ============================================
// 3. ARREGLAR modal EDITAR usuario — agregar salón y más campos
// ============================================
console.log('🔧 3. Modal editar con salón...');
let ui2 = fs.readFileSync('./js/02-modulos/usuarios/usuarios.ui.js', 'utf8');

// Buscar el modal editar y agregar salón + institución
const oldEditarFields = `      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo</label>
          <input type="text" id="editNombre" class="input" value="\\${nombreActual}" style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
          <input type="text" id="editCelular" class="input" value="\\${celularActual}" placeholder="999-999-999" style="width:100%;">
        </div>
      </div>`;

const newEditarFields = `      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre Completo</label>
          <input type="text" id="editNombre" class="input" value="\\${nombreActual}" style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
          <input type="text" id="editCelular" class="input" value="\\${celularActual}" placeholder="999-999-999" style="width:100%;">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Institución</label>
          <input type="text" id="editInstitucion" class="input" value="\\${subordinado.sub_institucion_nombre || subordinado.institucion_nombre || '-'}" style="width:100%;" disabled>
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Salón / Aula</label>
          <input type="text" id="editSalon" class="input" value="\\${subordinado.sub_salon_nombre || subordinado.salon_nombre || 'Sin asignar'}" style="width:100%;" disabled>
        </div>
      </div>`;

if (ui2.includes(oldEditarFields)) {
  ui2 = ui2.replace(oldEditarFields, newEditarFields);
  fs.writeFileSync('./js/02-modulos/usuarios/usuarios.ui.js', ui2);
  console.log('✅ Modal editar con salón e institución');
} else {
  console.log('⚠️ No se encontró el punto exacto para salón en editar');
}

// ============================================
// 4. Actualizar timestamp en index.html
// ============================================
console.log('🔧 4. Timestamp...');
let index = fs.readFileSync('./index.html', 'utf8');
const ts = Date.now();
index = index.replace(/usuarios\/usuarios\.api\.js\?v=\d+/g, 'usuarios/usuarios.api.js?v=' + ts);
index = index.replace(/usuarios\/usuarios\.ui\.js\?v=\d+/g, 'usuarios/usuarios.ui.js?v=' + ts);
index = index.replace(/usuarios\/usuarios\.eventos\.js\?v=\d+/g, 'usuarios/usuarios.eventos.js?v=' + ts);
fs.writeFileSync('./index.html', index);
console.log('✅ Timestamp: ' + ts);

console.log('\\n🎉 TODO LISTO. Ejecuta:');
console.log('git add -A && git commit -m "feat: modal crear completo con salon + modal editar mejorado" && git push && pm2 restart api-addison');
