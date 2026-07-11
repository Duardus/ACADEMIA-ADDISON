const fs = require('fs');
const path = './js/02-modulos/usuarios/usuarios.ui.js';
let content = fs.readFileSync(path, 'utf8');

// Encontrar el punto exacto: después del checkbox y antes de los botones
const puntoInsercion = `      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:16px;">
        <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
        <span>Puede crear subordinados</span>
      </label>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;">`;

const camposOpcionales = `      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;margin-bottom:16px;">
        <input type="checkbox" id="checkCrearHijos" style="width:18px;height:18px;">
        <span>Puede crear subordinados</span>
      </label>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Celular</label>
          <input type="text" id="inputCelular" class="input" placeholder="999-999-999" style="width:100%;">
        </div>
        <div>
          <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Carrera de Interés</label>
          <input type="text" id="inputCarrera" class="input" placeholder="Ej: Ingeniería, Medicina..." style="width:100%;">
        </div>
      </div>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
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
      
      <div style="margin-bottom:16px;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Observaciones</label>
        <textarea id="inputObservaciones" class="input" rows="2" placeholder="Notas sobre el usuario..." style="width:100%;resize:vertical;"></textarea>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end;">`;

if (content.includes(puntoInsercion)) {
  content = content.replace(puntoInsercion, camposOpcionales);
  fs.writeFileSync(path, content);
  console.log('✅ Campos opcionales agregados al modal crear');
} else {
  console.log('❌ No se encontró el punto de inserción exacto');
  console.log('Buscando alternativa...');
  
  // Fallback: buscar el checkbox
  const checkboxPattern = /<input type="checkbox" id="checkCrearHijos"[^>]*>/;
  if (checkboxPattern.test(content)) {
    console.log('ℹ️ Checkbox encontrado, necesito ver más contexto');
  }
}

// Actualizar timestamp en index.html
const indexPath = './index.html';
let index = fs.readFileSync(indexPath, 'utf8');
const ts = Date.now();
index = index.replace(/usuarios\/usuarios\.ui\.js\?v=\d+/g, 'usuarios/usuarios.ui.js?v=' + ts);
index = index.replace(/usuarios\/usuarios\.eventos\.js\?v=\d+/g, 'usuarios/usuarios.eventos.js?v=' + ts);
fs.writeFileSync(indexPath, index);
console.log('✅ Timestamp actualizado');

console.log('\n🚀 Ahora ejecuta:');
console.log('git add -A && git commit -m "feat: campos opcionales en modal crear usuario" && git push && pm2 restart api-addison');
