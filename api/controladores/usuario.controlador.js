const usuarioServicio = require('./usuario.servicio');
const respuesta = require('../utilidades/respuesta');

class UsuarioControlador {

  async crearUsuario(req, res, next) {
    const resultado = await usuarioServicio.crearUsuario(req.body, req.contexto_institucion);
    respuesta.exito(res, resultado, 'Usuario creado exitosamente');
  }

  async listarUsuarios(req, res, next) {
    const usuarios = await usuarioServicio.listarUsuarios(req.contexto_institucion.institucion_id);
    respuesta.exito(res, { usuarios }, 'Usuarios obtenidos');
  }

}

module.exports = new UsuarioControlador();
