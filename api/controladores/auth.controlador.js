// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Controlador de Autenticacion
// Endpoint: POST /api/v1/auth/login
// FIX: Siempre retorna la propiedad 'rol' en la respuesta.
// ═══════════════════════════════════════════════════════════════════════════

const authServicio = require('../servicios/auth.servicio');
const { exito, error } = require('../utilidades/respuesta');

async function login(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json(error('Token de Firebase requerido en el body', 400));
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
      return res.status(401).json(error('Autenticacion requerida', 401));
    }

    const resultado = await authServicio.obtenerPerfil(req.usuario.uid);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  login,
  perfil,
};
