const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const { generarToken } = require('../utilidades/jwt');

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }
    const auth = obtenerAuth();
    const decoded = await auth.verifyIdToken(token_firebase);
    const uid = decoded.uid;
    const correo = decoded.email;
    const nombre = decoded.name || 'Usuario';

    let result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
    let usuario;

    if (result.rows.length === 0) {
      const porEmail = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
      if (porEmail.rows.length > 0) {
        const uidViejo = porEmail.rows[0].usuario_id;
        await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW(), auth_provider = $2, estado_usuario = $3 WHERE correo_electronico = $4', [uid, 'firebase', 'active', correo]);
        await consulta('UPDATE membresias SET usuario_id = $1, estado_membresia = $2 WHERE usuario_id = $3', [uid, 'active', uidViejo]);
        await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, uidViejo]);
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      } else {
        return res.status(403).json({ error: 'No estás registrado', codigo: 'NO_REGISTRADO', correo });
      }
    } else {
      usuario = result.rows[0];
    }

    // FIX: activar automáticamente (elimina "pending verification")
    await consulta("UPDATE usuarios SET estado_usuario = 'active', ultimo_login = NOW() WHERE usuario_id = $1", [uid]);
    await consulta("UPDATE membresias SET estado_membresia = 'active' WHERE usuario_id = $1 AND estado_membresia IN ('pending','pending_verification')", [uid]);

    const membresias = await consulta(
      'SELECT m.*, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2',
      [uid, 'active']
    );

    if (membresias.rows.length === 0) {
      return res.status(403).json({ error: 'Sin membresía activa', codigo: 'SIN_MEMBRESIA' });
    }

    //... resto igual (generar JWT)
    const membresia = membresias.rows[0];
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: membresia.membresia_id,
      institucion_id: membresia.institucion_id,
      tipo_rol: membresia.tipo_rol,
      correo: usuario.correo_electronico
    });

    return res.status(200).json({
      tipo: 'login_directo',
      token_sesion: tokenSesion,
      usuario: { nombre: usuario.nombre_completo || nombre, correo: usuario.correo_electronico, rol: membresia.tipo_rol },
      institucion: { id: membresia.institucion_id, nombre: membresia.nombre_institucion, slug: membresia.institucion_slug }
    });

  } catch (error) {
    console.error('❌ Error login:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}

module.exports = { login };
