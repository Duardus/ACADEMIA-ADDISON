const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');

async function middlewareAutenticar(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token requerido', codigo: 'SIN_TOKEN' });
    }

    const tokenFirebase = header.split('Bearer ')[1];
    const auth = obtenerAuth();
    const decoded = await auth.verifyIdToken(tokenFirebase);
    const uid = decoded.uid;
    const correo = (decoded.email || '').toLowerCase().trim();

    // Buscar o crear en PostgreSQL
    let usuario = await consulta(
      'SELECT usuario_id, correo_electronico, nombre_completo, estado_usuario FROM usuarios WHERE usuario_id = $1',
      [uid]
    );

    if (usuario.rows.length === 0) {
      await consulta(
        'INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())',
        [uid, correo, decoded.name || 'Usuario', 'firebase', 'active']
      );
      usuario = await consulta(
        'SELECT usuario_id, correo_electronico, nombre_completo, estado_usuario FROM usuarios WHERE usuario_id = $1',
        [uid]
      );
    } else {
      await consulta(
        'UPDATE usuarios SET ultimo_login = NOW() WHERE usuario_id = $1',
        [uid]
      );
    }

    const datos = usuario.rows[0];
    if (datos.estado_usuario === 'banned') {
      return res.status(401).json({ error: 'Usuario bloqueado', codigo: 'BLOQUEADO' });
    }

    req.usuario_autenticado = {
      usuario_id: datos.usuario_id,
      correo: datos.correo_electronico,
      nombre: datos.nombre_completo,
      uid_firebase: uid
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Autenticacion fallida', codigo: 'AUTH_FALLIDA' });
  }
}

module.exports = { middlewareAutenticar };
