const fs = require('fs');
const path = '/home/ubuntu/ACADEMIA-ADDISON/js/02-modulos/usuarios/usuarios.api.js';
let content = fs.readFileSync(path, 'utf8');

// Reemplazar las 3 funciones duplicadas por una sola
const duplicado = /async function apiEditarSubordinado\(membresiaId, datos\) \{\n  return await put\('\/jerarquia\/subordinado\/' \+ membresiaId, datos\);\n\}\n\nasync function apiEditarSubordinado\(membresiaId, datos\) \{\n  return await put\('\/jerarquia\/subordinado\/' \+ membresiaId, datos\);\n\}\n\nasync function apiEditarSubordinado\(membresiaId, datos\) \{\n  return await put\('\/jerarquia\/subordinado\/' \+ membresiaId, datos\);\n\}/;

content = content.replace(duplicado, "async function apiEditarSubordinado(membresiaId, datos) {\n  return await put('/jerarquia/subordinado/' + membresiaId, datos);\n}");

fs.writeFileSync(path, content);
console.log('✅ API duplicado arreglado');
