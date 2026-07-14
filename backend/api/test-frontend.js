const fs = require('fs');

// Leer los archivos del frontend
const apiJs = fs.readFileSync('/home/ubuntu/ACADEMIA-ADDISON/js/02-modulos/usuarios/usuarios.api.js', 'utf8');
const eventosJs = fs.readFileSync('/home/ubuntu/ACADEMIA-ADDISON/js/02-modulos/usuarios/usuarios.eventos.js', 'utf8');
const uiJs = fs.readFileSync('/home/ubuntu/ACADEMIA-ADDISON/js/02-modulos/usuarios/usuarios.ui.js', 'utf8');
const peticionesJs = fs.readFileSync('/home/ubuntu/ACADEMIA-ADDISON/js/01-nucleo/peticiones.js', 'utf8');

console.log('=== DIAGNOSTICO FRONTEND ===\n');

// 1. Verificar que del() existe y cómo se llama
console.log('1. FUNCION del() en peticiones.js:');
const delMatch = peticionesJs.match(/function del\(.*?\)\s*\{[\s\S]*?\n\}/);
console.log(delMatch ? delMatch[0] : 'NO ENCONTRADA');

// 2. Verificar que apiDesactivar usa del()
console.log('\n2. apiDesactivarSubordinado en api.js:');
const desactivarMatch = apiJs.match(/async function apiDesactivarSubordinado\(.*?\)\s*\{[\s\S]*?\n\}/);
console.log(desactivarMatch ? desactivarMatch[0] : 'NO ENCONTRADA');

// 3. Verificar que manejarDesactivar llama a apiDesactivar
console.log('\n3. manejarDesactivar en eventos.js:');
const manejarDesactivarMatch = eventosJs.match(/async function manejarDesactivar\(.*?\)\s*\{[\s\S]*?\n\}/);
console.log(manejarDesactivarMatch ? manejarDesactivarMatch[0].substring(0, 300) : 'NO ENCONTRADA');

// 4. Verificar que los botones tienen event listeners
console.log('\n4. Event listeners en ui.js:');
const tieneEventListeners = uiJs.includes('addEventListener') && uiJs.includes('btn-desactivar');
console.log(tieneEventListeners ? '✅ Tiene event listeners para botones' : '❌ NO tiene event listeners');

// 5. Verificar que el modal de capacidades recibe capacidades
console.log('\n5. Modal capacidades en ui.js:');
const modalCapMatch = uiJs.match(/function renderizarModalCapacidades\(.*?\)\s*\{[\s\S]*?\n\}/);
console.log(modalCapMatch ? '✅ Función existe' : '❌ Función NO existe');

// 6. Verificar manejarCapacidades
console.log('\n6. manejarCapacidades en eventos.js:');
const manejarCapMatch = eventosJs.match(/async function manejarCapacidades\(.*?\)\s*\{[\s\S]*?\n\}/);
console.log(manejarCapMatch ? manejarCapMatch[0].substring(0, 400) : 'NO ENCONTRADA');

console.log('\n=== FIN DIAGNOSTICO ===');
