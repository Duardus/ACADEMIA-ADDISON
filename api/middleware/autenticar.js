const { verificarToken } = require('../utilidades/jwt');
const { consulta } = require('../configuracion/base_de_datos');

async function middlewareAutenticar(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido', codigo: 'SIN_TOKEN' });
    }

    const token = header.split('Bearer ')[1];
    
    // Validar el token
    const decoded = verificarToken(token); 
    if (!decoded) {
      return res.status(401).json({ error: 'Token invalido o expirado', codigo: 'TOKEN_INVALIDO' });
    }

    const uid = decoded.usuario_id || decoded.uid; 

    let usuario = await consulta(
      'SELECT usuario_id, correo_electronico, nombre_completo, estado_usuario, sesion_revocada_en FROM usuarios WHERE usuario_id = $1',
      [uid]
    );

    if (usuario.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado', codigo: 'AUTH_FALLIDA' });
    }

    const datos = usuario.rows[0];

    // VERIFICAR ESTADO DEL USUARIO
    if (datos.estado_usuario === 'deleted') {
      return res.status(401).json({ 
        error: 'Usuario eliminado', 
        mensaje: 'Tu cuenta ha sido eliminada. Contacta al administrador para matricularte nuevamente.',
        codigo: 'USUARIO_ELIMINADO' 
      });
    }

    if (datos.estado_usuario === 'suspended') {
      return res.status(401).json({ 
        error: 'Usuario suspendido', 
        mensaje: 'Tu cuenta esta suspendida. Contacta al administrador para renovar tu matricula.',
        codigo: 'USUARIO_SUSPENDIDO' 
      });
    }

    if (datos.estado_usuario === 'banned') {
      return res.status(401).json({ 
        error: 'Usuario bloqueado', 
        mensaje: 'Tu cuenta ha sido bloqueada permanentemente.',
        codigo: 'BLOQUEADO' 
      });
    }

    if (datos.estado_usuario !== 'active' && datos.estado_usuario !== 'por_activar') {
      return res.status(401).json({ 
        error: 'Cuenta no activa', 
        mensaje: 'Tu cuenta no esta activa. Contacta al administrador.',
        codigo: 'CUENTA_INACTIVA' 
      });
    }

    // VERIFICAR SI LA SESION FUE REVOCADA (token emitido antes de la revocacion)
    if (datos.sesion_revocada_en && decoded.iat) {
      const tokenEmitidoEn = new Date(decoded.iat * 1000);
      const sesionRevocadaEn = new Date(datos.sesion_revocada_en);
      
      if (tokenEmitidoEn < sesionRevocadaEn) {
        return res.status(401).json({ 
          error: 'Sesion revocada', 
          mensaje: 'Tu sesion ha sido cerrada por el administrador. Vuelve a iniciar sesion.',
          codigo: 'SESION_REVOCADA' 
        });
      }
    }

    req.usuario_autenticado = {
      usuario_id: datos.usuario_id,
      correo: datos.correo_electronico,
      nombre: datos.nombre_completo,
      institucion_id: decoded.institucion_id || null,
      rol: decoded.tipo_rol || null
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Autenticacion fallida', codigo: 'AUTH_FALLIDA' });
  }
}

module.exports = { middlewareAutenticar };
