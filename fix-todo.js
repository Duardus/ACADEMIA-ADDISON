const fs = require('fs');

// ============================================
// FIX 1: Arreglar ruta PUT duplicada
// ============================================
console.log('🔧 FIX 1: Ruta duplicada...');
const rutaPath = './api/rutas/jerarquia.rutas.js';
let ruta = fs.readFileSync(rutaPath, 'utf8');
const rutasDuplicadas = ruta.match(/router\.put\('\/subordinado\/:membresia_id'[^\n]*\n/g);
if (rutasDuplicadas && rutasDuplicadas.length > 1) {
  ruta = ruta.replace(/router\.put\('\/subordinado\/:membresia_id'[^\n]*\n/g, '');
  const insertPoint = ruta.indexOf("router.post('/crear',");
  ruta = ruta.slice(0, insertPoint) + "router.put('/subordinado/:membresia_id', (req, res, next) => usuariosControlador.editarUsuario(req, res, next));\n" + ruta.slice(insertPoint);
  fs.writeFileSync(rutaPath, ruta);
  console.log('✅ Ruta arreglada (eliminados ' + rutasDuplicadas.length + ' duplicados)');
} else {
  console.log('ℹ️ Ruta ya está bien');
}

// ============================================
// FIX 2: Agregar campos opcionales al modal CREAR usuario
// ============================================
console.log('🔧 FIX 2: Modal crear con campos opcionales...');
const uiPath = './js/02-modulos/usuarios/usuarios.ui.js';
let ui = fs.readFileSync(uiPath, 'utf8');

// Buscar el modal de crear usuario y agregar campos opcionales antes del botón guardar
const oldModalCrear = `    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
        <button class="btn btn-secundario" id="btnCancelarCrear">Cancelar</button>
        <button class="btn" id="btnGuardarCrear">Guardar</button>
      </div>`;

const newModalCrear = `    <div style="margin:12px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
        <input type="text" id="inputCelular" class="input" placeholder="999-999-999" style="width:100%;">
      </div>
      <div style="margin:12px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Carrera de Interés</label>
        <input type="text" id="inputCarrera" class="input" placeholder="Ej: Ingeniería, Medicina..." style="width:100%;">
      </div>
      <div style="margin:12px 0;">
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
      <div style="margin:12px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Observaciones</label>
        <textarea id="inputObservaciones" class="input" rows="2" placeholder="Notas sobre el usuario..." style="width:100%;resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px;">
        <button class="btn btn-secundario" id="btnCancelarCrear">Cancelar</button>
        <button class="btn" id="btnGuardarCrear">Guardar</button>
      </div>`;

if (ui.includes(oldModalCrear)) {
  ui = ui.replace(oldModalCrear, newModalCrear);
  console.log('✅ Campos opcionales agregados al modal crear');
} else {
  console.log('⚠️ No se encontró el punto exacto para insertar campos en modal crear');
}

// Agregar lectura de campos opcionales en el handler de guardar
const oldGuardar = `    modal.remove();
    onGuardar({ 
      nombre_completo: nombre, 
      email: correo, 
      institucion_id: parseInt(institucionId),
      nombre_rol: nombreRol || 'Miembro',
      nivel_jerarquico: nivel,
      puede_crear_hijos: puedeCrearHijos,
      superior_inmediato_id: superiorId
    });`;

const newGuardar = `    const celular = document.getElementById('inputCelular')?.value?.trim() || '';
    const carrera = document.getElementById('inputCarrera')?.value?.trim() || '';
    const nivelAcademico = document.getElementById('inputNivelAcademico')?.value || '';
    const observaciones = document.getElementById('inputObservaciones')?.value?.trim() || '';
    
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
    if (celular) datos.numero_celular = celular;
    if (carrera) datos.carrera_interes = carrera;
    if (nivelAcademico) datos.nivel_academico = nivelAcademico;
    if (observaciones) datos.observaciones = observaciones;
    onGuardar(datos);`;

if (ui.includes(oldGuardar)) {
  ui = ui.replace(oldGuardar, newGuardar);
  console.log('✅ Handler de guardar actualizado con campos opcionales');
} else {
  console.log('⚠️ No se encontró el handler de guardar exacto');
}

fs.writeFileSync(uiPath, ui);

// ============================================
// FIX 3: Actualizar timestamp en index.html para forzar recarga
// ============================================
console.log('🔧 FIX 3: Forzar recarga cache...');
const indexPath = './index.html';
let index = fs.readFileSync(indexPath, 'utf8');
const ts = Date.now();
index = index.replace(/usuarios\/usuarios\.api\.js\?v=\d+/g, 'usuarios/usuarios.api.js?v=' + ts);
index = index.replace(/usuarios\/usuarios\.ui\.js\?v=\d+/g, 'usuarios/usuarios.ui.js?v=' + ts);
index = index.replace(/usuarios\/usuarios\.eventos\.js\?v=\d+/g, 'usuarios/usuarios.eventos.js?v=' + ts);
fs.writeFileSync(indexPath, index);
console.log('✅ Timestamp actualizado: ' + ts);

console.log('\n🎉 TODOS LOS FIXES APLICADOS');
console.log('Ahora ejecuta: cd ~/ACADEMIA-ADDISON && git add -A && git commit -m "fix: campos opcionales crear + ruta duplicada" && git push && pm2 restart api-addison');
