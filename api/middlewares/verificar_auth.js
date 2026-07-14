// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Middleware de autenticacion (JWT propio + Firebase legacy)
// ═══════════════════════════════════════════════════════════════════════════

const { verificarToken } = require('../utilidades/jwt');
const { verificarTokenFirebase } = require('../config/firebase');
const { error } = require('../utilidades/respuesta');
const { ErrorAutenticacion, ErrorPermiso } = require('../utilidades/errores');

async function verificarAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error('Token de autenticacion requerido', 401));
    }

    const token = authHeader.split(' ')[1];

    // Intentar verificar como JWT propio primero (Passkeys)
    try {
      const decoded = verificarToken(token);
      req.usuario = {
        usuario_id: decoded.usuario_id,
        email: decoded.correo,
        estado: decoded.estado,
        rol: decoded.rol || 'estudiante'
      };
      return next();
    } catch (jwtError) {
      // No es JWT propio, intentar Firebase (legacy)
    }

    // Fallback: verificar como Firebase (para compatibilidad temporal)
    try {
      const resultado = await verificarTokenFirebase(token);
      if (resultado.valido) {
        req.usuario = {
          uid: resultado.uid,
          email: resultado.email,
          nombre: resultado.nombre,
          foto: resultado.foto,
        };
        return next();
      }
    } catch (firebaseError) {
      // Firebase tampoco funcionó
    }

    return res.status(401).json(error('Token invalido o expirado', 401));
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
      
      // Intentar JWT propio
      try {
        const decoded = verificarToken(token);
        req.usuario = {
          usuario_id: decoded.usuario_id,
          email: decoded.correo,
          estado: decoded.estado,
          rol: decoded.rol || 'estudiante'
        };
      } catch (e) {
        // Intentar Firebase
        try {
          const resultado = await verificarTokenFirebase(token);
          if (resultado.valido) {
            req.usuario = {
              uid: resultado.uid,
              email: resultado.email,
              nombre: resultado.nombre,
              foto: resultado.foto,
            };
          }
        } catch (e2) {
          // Ignorar, es opcional
        }
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
