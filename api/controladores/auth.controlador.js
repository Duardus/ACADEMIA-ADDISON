const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const { crearTokenPreliminar, crearTokenDefinitivo, verificarToken } = require('../utilidades/jwt');

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) return res.status(400).json({ error: 'Token Firebase requerido', codigo: 'TOKEN_FALTANTE' });

    const auth = obtenerAuth();
    const decoded = await auth.verifyIdToken(token_firebase);
    const uid = decoded.uid;
    const correo = (decoded.email || '').toLowerCase().trim();

    // Buscar o crear usuario en PostgreSQL
    let usuario = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
    if (usuario.rows.length === 0) {
      await consulta('INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', [uid, correo, decoded.name || 'Usuario', 'firebase', 'active']);
      usuario = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
    } else {
      await consulta('UPDATE usuarios SET ultimo_login = NOW() WHERE usuario_id = $1', [uid]);
    }

    const datosUsuario = usuario.rows[0];
    if (datosUsuario.estado_usuario === 'banned') {
      return res.status(401).json({ error: 'Usuario bloqueado', codigo: 'BLOQUEADO' });
    }

    // Buscar membresías activas
    const membresias = await consulta(
      'SELECT m.*, i.nombre_institucion, i.institucion_slug, i.institucion_status FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia IN ($2, $3)',
      [uid, 'active', 'invited']
    );

    const lista = membresias.rows.map(m => ({
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      estado_membresia: m.estado_membresia,
      nombre_institucion: m.nombre_institucion,
      institucion_slug: m.institucion_slug,
      institucion_status: m.institucion_status
    }));

    const activas = lista.filter(m => m.estado_membresia === 'active');
    const invitadas = lista.filter(m => m.estado_membresia === 'invited');

    // ESCENARIO A: Una sola membresía activa → Login directo
    if (activas.length === 1 && invitadas.length === 0) {
      const m = activas[0];
      if (m.institucion_status === 'suspended' || m.institucion_status === 'closed') {
        return res.status(403).json({ error: 'Institucion suspendida', codigo: 'INSTITUCION_SUSPENDIDA' });
      }
      const token = crearTokenDefinitivo(datosUsuario, m);
      return res.json({ tipo: 'login_directo', token, usuario: { usuario_id: datosUsuario.usuario_id, nombre: datosUsuario.nombre_completo, correo: datosUsuario.correo_electronico }, institucion: { institucion_id: m.institucion_id, nombre: m.nombre_institucion, rol: m.tipo_rol } });
    }

    // ESCENARIO B: Múltiples → Token preliminar
    const tokenPreliminar = crearTokenPreliminar(datosUsuario);
    return res.json({ tipo: 'selector_requerido', token_preliminar: tokenPreliminar, usuario: { usuario_id: datosUsuario.usuario_id, nombre: datosUsuario.nombre_completo, correo: datosUsuario.correo_electronico }, membresias: lista });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en login', codigo: 'LOGIN_ERROR' });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    const payload = verificarToken(token_preliminar);
    if (payload.tipo !== 'preliminar') return res.status(400).json({ error: 'Token invalido', codigo: 'TOKEN_INVALIDO' });

    const membresia = await consulta(
      'SELECT m.*, i.nombre_institucion, i.institucion_status FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [membresia_id, payload.usuario_id, 'active']
    );

    if (membresia.rows.length === 0) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });

    const m = membresia.rows[0];
    const usuario = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [payload.usuario_id]);
    const token = crearTokenDefinitivo(usuario.rows[0], m);

    res.json({ tipo: 'contexto_seleccionado', token, institucion: { institucion_id: m.institucion_id, nombre: m.nombre_institucion, rol: m.tipo_rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error seleccionando contexto', codigo: 'CONTEXT_ERROR' });
  }
}

async function cambiarContexto(req, res) {
  try {
    const { nueva_membresia_id } = req.body;
    const ctx = req.contexto_institucion;
    if (!ctx) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });

    const nueva = await consulta(
      'SELECT m.*, i.nombre_institucion FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [nueva_membresia_id, ctx.usuario_id, 'active']
    );

    if (nueva.rows.length === 0) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });

    const m = nueva.rows[0];
    const usuario = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [ctx.usuario_id]);
    const token = crearTokenDefinitivo(usuario.rows[0], m);

    res.json({ tipo: 'contexto_cambiado', token, institucion_nueva: { institucion_id: m.institucion_id, nombre: m.nombre_institucion, rol: m.tipo_rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando contexto', codigo: 'SWITCH_ERROR' });
  }
}

module.exports = { login, seleccionarContexto, cambiarContexto };
