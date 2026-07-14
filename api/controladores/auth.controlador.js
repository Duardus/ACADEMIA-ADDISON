// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Controlador de Autenticacion
// ═══════════════════════════════════════════════════════════════════════════

const authServicio = require('../servicios/auth.servicio');
const { exito, respuestaError } = require('../utilidades/respuesta');

async function login(req, res, next) {
  try {
    const token = req.body.token || req.body.token_firebase;
    if (!token) {
      return res.status(400).json(respuestaError('Token de Firebase requerido', 400));
    }
    const resultado = await authServicio.loginConFirebase(token);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function perfil(req, res, next) {
  try {
    if (!req.usuario || !req.usuario.uid) {
      return res.status(401).json(respuestaError('Autenticacion requerida', 401));
    }
    const resultado = await authServicio.obtenerPerfil(req.usuario.uid);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, perfil };
