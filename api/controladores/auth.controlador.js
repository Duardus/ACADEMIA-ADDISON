// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Controlador de Autenticación v15
// Fix: Enviar rol en respuesta para superadmin
// ═══════════════════════════════════════════════════════════════════════════

const { verificarTokenFirebase } = require('../utilidades/firebase');
const { generarToken } = require('../utilidades/jwt');
const { ErrorApp } = require('../utilidades/errores');
const authRepositorio = require('../repositorios/auth.repositorio');

class AuthControlador {

  async loginDirecto(req, res, next) {
    try {
      const { id_token } = req.body;
      if (!id_token) throw new ErrorApp('Token requerido', 400, 'TOKEN_REQUERIDO');

      const firebaseUser = await verificarTokenFirebase(id_token);
      const correo = firebaseUser.email;

      let usuario = await authRepositorio.buscarPorCorreo(correo);

      if (!usuario) {
        throw new ErrorApp('Usuario no registrado. Contacta al administrador.', 403, 'USUARIO_NO_REGISTRADO');
      }

      if (usuario.estado_usuario === 'suspendido') {
        throw new ErrorApp('Cuenta suspendida', 403, 'CUENTA_SUSPENDIDA');
      }

      // Extraer rol de etiquetas
      let rol = 'estudiante';
      try {
        if (usuario.etiquetas && typeof usuario.etiquetas === 'object') {
          rol = usuario.etiquetas.rol || usuario.etiquetas.rol || 'estudiante';
        } else if (usuario.etiquetas && typeof usuario.etiquetas === 'string') {
          const parsed = JSON.parse(usuario.etiquetas);
          rol = parsed.rol || 'estudiante';
        }
      } catch (e) {
        rol = 'estudiante';
      }

      const tokenSesion = generarToken({
        usuario_id: usuario.usuario_id,
        correo: usuario.correo_electronico,
        rol: rol,
        estado: usuario.estado_usuario
      });

      await authRepositorio.actualizarUltimoLogin(correo);

      res.json({
        exito: true,
        token_sesion: tokenSesion,
        usuario: {
          usuario_id: usuario.usuario_id,
          correo: usuario.correo_electronico,
          nombre: usuario.nombre_completo,
          rol: rol,
          estado: usuario.estado_usuario,
          passkey_registrado: usuario.passkey_registrado
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async renovarToken(req, res, next) {
    try {
      const { refresh_token } = req.body;
      if (!refresh_token) throw new ErrorApp('Refresh token requerido', 400, 'REFRESH_REQUERIDO');

      const sesion = await authRepositorio.buscarSesionPorRefreshToken(refresh_token);
      if (!sesion || new Date(sesion.expira_en) < new Date()) {
        throw new ErrorApp('Sesion expirada', 401, 'SESION_EXPIRADA');
      }

      const usuario = await authRepositorio.buscarPorId(sesion.usuario_id);
      if (!usuario) throw new ErrorApp('Usuario no encontrado', 404, 'USUARIO_NO_ENCONTRADO');

      // Extraer rol
      let rol = 'estudiante';
      try {
        if (usuario.etiquetas && typeof usuario.etiquetas === 'object') {
          rol = usuario.etiquetas.rol || 'estudiante';
        } else if (usuario.etiquetas && typeof usuario.etiquetas === 'string') {
          const parsed = JSON.parse(usuario.etiquetas);
          rol = parsed.rol || 'estudiante';
        }
      } catch (e) {
        rol = 'estudiante';
      }

      const nuevoToken = generarToken({
        usuario_id: usuario.usuario_id,
        correo: usuario.correo_electronico,
        rol: rol,
        estado: usuario.estado_usuario
      });

      res.json({
        exito: true,
        token_sesion: nuevoToken,
        usuario: {
          usuario_id: usuario.usuario_id,
          correo: usuario.correo_electronico,
          nombre: usuario.nombre_completo,
          rol: rol,
          estado: usuario.estado_usuario
        }
      });

    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new ErrorApp('Token requerido', 401, 'TOKEN_REQUERIDO');

      const token = authHeader.replace('Bearer ', '');
      await authRepositorio.invalidarToken(token);

      res.json({ exito: true, mensaje: 'Sesion cerrada' });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthControlador();
