const fs = require('fs');
const path = '/home/ubuntu/ACADEMIA-ADDISON/api/controladores/jerarquia.usuarios.controlador.js';
let content = fs.readFileSync(path, 'utf8');

const nuevoMetodo = `

  // ============================================
  // EDITAR USUARIO
  // ============================================
  async editarUsuario(req, res, next) {
    try {
      const resultado = await servicio.editarUsuario(req.body, req.contexto);
      respuesta.exito(res, resultado, 'Usuario actualizado correctamente');
    } catch (error) {
      next(error);
    }
  }
`;

// Insertar antes del cierre de la clase
content = content.replace(/}\s*module\.exports = new JerarquiaUsuariosControlador\(\);/, nuevoMetodo + '}\n\nmodule.exports = new JerarquiaUsuariosControlador();');
fs.writeFileSync(path, content);
console.log('✅ Controlador: editarUsuario agregado');
