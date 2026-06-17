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
        try {
          await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW(), auth_provider = $2, estado_usuario = $3 WHERE correo_electronico = $4', [uid, 'firebase', 'active', correo]);
          await consulta('UPDATE membresias SET usuario_id = $1, estado_membresia = $2 WHERE usuario_id = $3', [uid, 'active', uidViejo]);
          await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, uidViejo]);
        } catch (err) {
          console.error('❌ Error en migración:', err);
          return res.status(500).json({ error: 'Error al migrar usuario', detalle: err.message });
        }
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      } else {
        return res.status(403).json({ error: 'No estás registrado', mensaje: 'Matricúlate primero.', codigo: 'NO_REGISTRADO', correo });
      }
    } else {
      usuario = result.rows[0];
    }

    // FIX: activar automáticamente (elimina "pending verification")
    await consulta("UPDATE usuarios SET estado_usuario = 'active', ultimo_login = NOW(), auth_provider = COALESCE(auth_provider, 'firebase') WHERE usuario_id = $1", [uid]);
    await consulta("UPDATE membresias SET estado_membresia = 'active' WHERE usuario_id = $1 AND estado_membresia IN ('pending','pending_verification')", [uid]);

    const membresias = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, m.metadata_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2',
      [uid, 'active']
    );

    if (membresias.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes membresía activa', mensaje: 'Contacta al administrador.', codigo: 'SIN_MEMBRESIA', correo });
    }

    if (membresias.rows.length === 1) {
      const m = membresias.rows[0];
      const tokenSesion = generarToken({ usuario_id: uid, membresia_id: m.membresia_id, institucion_id: m.institucion_id, tipo_rol: m.tipo_rol, correo: usuario.correo_electronico });
      return res.status(200).json({ tipo: 'login_directo', token_sesion: tokenSesion, usuario: { nombre: usuario.nombre_completo || nombre, correo: usuario.correo_electronico || correo, rol: m.tipo_rol, avatar: usuario.avatar_url || null }, institucion: { id: m.institucion_id, nombre: m.nombre_institucion, slug: m.institucion_slug }, membresia_id: m.membresia_id });
    } else {
      return res.status(200).json({ tipo: 'selector_requerido', token_preliminar: generarToken({ usuario_id: uid, correo: usuario.correo_electronico }), usuario: { nombre: usuario.nombre_completo || nombre, correo: usuario.correo_electronico || correo, avatar: usuario.avatar_url || null }, membresias: membresias.rows.map(m => ({ membresia_id: m.membresia_id, institucion_id: m.institucion_id, nombre_institucion: m.nombre_institucion, slug: m.institucion_slug, rol: m.tipo_rol })) });
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    if (!token_preliminar ||!membresia_id) return res.status(400).json({ error: 'Faltan datos' });
    const { verificarToken } = require('../utilidades/jwt');
    const payload = verificarToken(token_preliminar);
    const uid = payload.usuario_id;
    const membresia = await consulta('SELECT m.membresia_id, m.institucion_id, m.tipo_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3', [membresia_id, uid, 'active']);
    if (membresia.rows.length === 0) return res.status(404).json({ error: 'Membresía no encontrada' });
    const m = membresia.rows[0];
    const tokenSesion = generarToken({ usuario_id: uid, membresia_id: m.membresia_id, institucion_id: m.institucion_id, tipo_rol: m.tipo_rol, correo: payload.correo });
    return res.status(200).json({ tipo: 'login_directo', token_sesion: tokenSesion, usuario: { nombre: payload.nombre || 'Usuario', correo: payload.correo, rol: m.tipo_rol }, institucion: { id: m.institucion_id, nombre: m.nombre_institucion, slug: m.institucion_slug }, membresia_id: m.membresia_id });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

async function switchContext(req, res) {
  try {
    const { membresia_id } = req.body;
    const uid = req.usuario_id;
    const membresia = await consulta('SELECT m.membresia_id, m.institucion_id, m.tipo_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3', [membresia_id, uid, 'active']);
    if (membresia.rows.length === 0) return res.status(404).json({ error: 'Membresía no encontrada' });
    const m = membresia.rows[0];
    const tokenSesion = generarToken({ usuario_id: uid, membresia_id: m.membresia_id, institucion_id: m.institucion_id, tipo_rol: m.tipo_rol });
    return res.status(200).json({ token_sesion: tokenSesion, institucion: { id: m.institucion_id, nombre: m.nombre_institucion, slug: m.institucion_slug }, rol: m.tipo_rol });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

module.exports = { login, seleccionarContexto, switchContext };
