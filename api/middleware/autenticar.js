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
      'SELECT usuario_id, correo_electronico, nombre_completo, estado_usuario FROM usuarios WHERE usuario_id = $1',
      [uid]
    );

    if (usuario.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado', codigo: 'AUTH_FALLIDA' });
    }

    const datos = usuario.rows[0];
    if (datos.estado_usuario === 'banned') {
      return res.status(401).json({ error: 'Usuario bloqueado', codigo: 'BLOQUEADO' });
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
