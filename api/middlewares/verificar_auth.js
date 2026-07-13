// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Middleware de autenticacion Firebase
// Regla Oro 5: Asignacion directa sin invitaciones. 404 para no autorizado.
// Modo fantasma: recv-only (no crear usuarios, solo verificar)
// ═══════════════════════════════════════════════════════════════════════════

const { verificarTokenFirebase } = require('../config/firebase');
const { exito, error } = require('../utilidades/respuesta');
const { ErrorAutenticacion, ErrorPermiso } = require('../utilidades/errores');

async function verificarAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error('Token de autenticacion requerido', 401));
    }

    const token = authHeader.split(' ')[1];
    const resultado = await verificarTokenFirebase(token);

    if (!resultado.valido) {
      return res.status(401).json(error('Token invalido o expirado', 401));
    }

    // Adjuntar datos del usuario autenticado al request
    req.usuario = {
      uid: resultado.uid,
      email: resultado.email,
      nombre: resultado.nombre,
      foto: resultado.foto,
    };

    next();
  } catch (err) {
    next(new ErrorAutenticacion('Fallo en verificacion de autenticacion'));
  }
}

// Middleware de rol (uso futuro)
function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(403).json(error('Permiso denegado', 403));
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json(error('Permiso denegado', 403));
    }
    next();
  };
}

// Middleware para rutas publicas (no requiere auth pero la acepta)
async function authOpcional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const resultado = await verificarTokenFirebase(token);
      if (resultado.valido) {
        req.usuario = {
          uid: resultado.uid,
          email: resultado.email,
          nombre: resultado.nombre,
          foto: resultado.foto,
        };
      }
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = {
  verificarAuth,
  requerirRol,
  authOpcional,
};
