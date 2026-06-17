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

    // PASO 1: Buscar por UID real de Firebase
    let result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
    let usuario;

    if (result.rows.length === 0) {
      // PASO 2: Buscar por EMAIL (caso pre-registrado con UID bootstrap)
      const porEmail = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
      
      if (porEmail.rows.length > 0) {
        // MIGRACIÓN FIX: Usuario PRIMERO, luego tablas dependientes
        const uidViejo = porEmail.rows[0].usuario_id;
        
        try {
          // 1. Actualizar usuario PRIMERO (el nuevo UID debe existir antes)
          await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW(), auth_provider = $2, estado_usuario = $3 WHERE correo_electronico = $4', [uid, 'firebase', 'active', correo]);
          // 2. Ahora sí actualizar membresías (FK ya no falla porque usuario existe)
          await consulta('UPDATE membresias SET usuario_id = $1 WHERE usuario_id = $2', [uid, uidViejo]);
          // 3. Actualizar instituciones si es superadmin
          await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, uidViejo]);
        } catch (err) {
          console.error('❌ Error en migración de usuario:', err);
          return res.status(500).json({ error: 'Error al migrar usuario', detalle: err.message });
        }
        
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      } else {
        // ❌ RECHAZO: No está pre-registrado
        return res.status(403).json({
          error: 'No estás registrado en la plataforma',
          mensaje: 'Para tener acceso a la plataforma educativa matriculate primero.',
          codigo: 'NO_REGISTRADO',
          correo: correo
        });
      }
    } else {
      usuario = result.rows[0];
      await consulta('UPDATE usuarios SET ultimo_login = NOW() WHERE usuario_id = $1', [uid]);
    }

    // PASO 3: Buscar membresías activas del usuario
    const membresias = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, m.metadata_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2',
      [uid, 'active']
    );

    // Si no tiene membresías activas → RECHAZO
    if (membresias.rows.length === 0) {
      return res.status(403).json({
        error: 'No tienes membresía activa',
        mensaje: 'Contacta al administrador o director de tu academia para que te asigne una membresía.',
        codigo: 'SIN_MEMBRESIA',
        correo: correo
      });
    }

    // PASO 4: Generar JWT y responder según cantidad de membresías
    if (membresias.rows.length === 1) {
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
        usuario: {
          nombre: usuario.nombre_completo || nombre,
          correo: usuario.correo_electronico || correo,
          rol: membresia.tipo_rol,
          avatar: usuario.avatar_url || null
        },
        institucion: {
          id: membresia.institucion_id,
          nombre: membresia.nombre_institucion,
          slug: membresia.institucion_slug
        },
        membresia_id: membresia.membresia_id
      });

    } else {
      // Múltiples membresías → selector
      return res.status(200).json({
        tipo: 'selector_requerido',
        token_preliminar: generarToken({ usuario_id: uid, correo: usuario.correo_electronico }),
        usuario: {
          nombre: usuario.nombre_completo || nombre,
          correo: usuario.correo_electronico || correo,
          avatar: usuario.avatar_url || null
        },
        membresias: membresias.rows.map(m => ({
          membresia_id: m.membresia_id,
          institucion_id: m.institucion_id,
          nombre_institucion: m.nombre_institucion,
          slug: m.institucion_slug,
          rol: m.tipo_rol
        }))
      });
    }

  } catch (error) {
    console.error('❌ Error en login:', error);
    return res.status(500).json({ error: 'Error interno de servidor', detalle: error.message });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    if (!token_preliminar || !membresia_id) {
      return res.status(400).json({ error: 'token_preliminar y membresia_id requeridos' });
    }

    const { verificarToken } = require('../utilidades/jwt');
    const payload = verificarToken(token_preliminar);
    const uid = payload.usuario_id;

    const membresia = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [membresia_id, uid, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresía no encontrada o inactiva' });
    }

    const m = membresia.rows[0];
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      correo: payload.correo
    });

    return res.status(200).json({
      tipo: 'login_directo',
      token_sesion: tokenSesion,
      usuario: {
        nombre: payload.nombre || 'Usuario',
        correo: payload.correo,
        rol: m.tipo_rol
      },
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      membresia_id: m.membresia_id
    });

  } catch (error) {
    console.error('❌ Error seleccionar contexto:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}

async function switchContext(req, res) {
  try {
    const { membresia_id } = req.body;
    const uid = req.usuario_id;

    const membresia = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [membresia_id, uid, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresía no encontrada' });
    }

    const m = membresia.rows[0];
    const { generarToken } = require('../utilidades/jwt');
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol
    });

    return res.status(200).json({
      token_sesion: tokenSesion,
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      rol: m.tipo_rol
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { login, seleccionarContexto, switchContext };
