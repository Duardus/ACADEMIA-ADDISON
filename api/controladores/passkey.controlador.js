// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Controlador de Passkeys v2 (con Origin dinamico)
// ═══════════════════════════════════════════════════════════════════════════

const passkeyServicio = require('../servicios/passkey.servicio');
const { exito, respuestaError } = require('../utilidades/respuesta');

class PasskeyControlador {

  _getOrigin(req) {
    return req.headers.origin || req.headers.referer || ORIGIN_DEFAULT;
  }

  // POST /api/v1/passkey/registro/opciones
  async opcionesRegistro(req, res, next) {
    try {
      const { correo, nombre } = req.body;
      if (!correo) {
        return res.status(400).json(respuestaError('Correo requerido', 400));
      }

      const resultado = await passkeyServicio.generarOpcionesRegistro(correo, nombre, this._getOrigin(req));
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/passkey/registro/verificar
  async verificarRegistro(req, res, next) {
    try {
      const { correo, respuesta } = req.body;
      if (!correo || !respuesta) {
        return res.status(400).json(respuestaError('Correo y respuesta requeridos', 400));
      }

      const resultado = await passkeyServicio.verificarRegistro(correo, respuesta, this._getOrigin(req));
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/passkey/login/opciones
  async opcionesLogin(req, res, next) {
    try {
      const { correo } = req.body;
      if (!correo) {
        return res.status(400).json(respuestaError('Correo requerido', 400));
      }

      const resultado = await passkeyServicio.generarOpcionesLogin(correo, this._getOrigin(req));
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/passkey/login/verificar
  async verificarLogin(req, res, next) {
    try {
      const { correo, respuesta } = req.body;
      if (!correo || !respuesta) {
        return res.status(400).json(respuestaError('Correo y respuesta requeridos', 400));
      }

      const resultado = await passkeyServicio.verificarLogin(correo, respuesta, this._getOrigin(req));
      res.status(200).json(resultado);
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/passkey/recuperacion
  async solicitarRecuperacion(req, res, next) {
    try {
      const { correo } = req.body;
      if (!correo) {
        return res.status(400).json(respuestaError('Correo requerido', 400));
      }

      const { token, expiraEn } = await passkeyServicio.generarMagicLink(correo);
      
      res.status(200).json({
        exito: true,
        mensaje: 'Si el correo existe, recibiras un link de recuperacion',
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/passkey/recuperacion/verificar
  async verificarRecuperacion(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json(respuestaError('Token requerido', 400));
      }

      const resultado = await passkeyServicio.verificarMagicLink(token);
      res.status(200).json({
        exito: true,
        usuario_id: resultado.usuario_id,
        correo: resultado.correo
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PasskeyControlador();
