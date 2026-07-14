// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Controlador de Autenticacion (Legacy Firebase)
// DEPRECADO: Usar /api/v1/passkey/* en su lugar
// ═══════════════════════════════════════════════════════════════════════════

const authServicio = require('../servicios/auth.servicio');
const { exito, respuestaError } = require('../utilidades/respuesta');

async function login(req, res, next) {
  try {
    const token = req.body.token || req.body.token_firebase;
    if (!token) {
      return res.status(400).json(respuestaError('Token requerido', 400));
    }
    const resultado = await authServicio.loginConFirebase(token);
    res.status(200).json(resultado);
  } catch (err) {
    console.error('[AUTH LEGACY] Error:', err.message);
    res.status(401).json(respuestaError('Autenticacion fallida: ' + err.message, 401));
  }
}

async function perfil(req, res, next) {
  try {
    if (!req.usuario || !req.usuario.usuario_id) {
      return res.status(401).json(respuestaError('Autenticacion requerida', 401));
    }
    res.status(200).json({
      exito: true,
      usuario: req.usuario
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, perfil };
