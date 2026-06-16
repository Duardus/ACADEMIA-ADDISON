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
      // PASO 2: Buscar por EMAIL (caso bootstrap/migración)
      const porEmail = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
      
      if (porEmail.rows.length > 0) {
        // MIGRACIÓN: Actualizar UID bootstrap al real de Firebase
        const uidViejo = porEmail.rows[0].usuario_id;
        await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW() WHERE correo_electronico = $2', [uid, correo]);
        await consulta('UPDATE membresias SET usuario_id = $1 WHERE usuario_id = $2', [uid, uidViejo]);
        await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, uidViejo]);
        
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      } else {
        // PASO 3: Crear nuevo usuario (primera vez con Google Auth)
        await consulta(
          'INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en, ultimo_login) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
          [uid, correo, nombre, 'firebase', 'active']
        );
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      }
    } else {
      usuario = result.rows[0];
      await consulta('UPDATE usuarios SET ultimo_login = NOW() WHERE usuario_id = $1', [uid]);
    }

    // PASO 4: Buscar membresías activas del usuario
    const membresias = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, m.metadata_rol, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2',
      [uid, 'active']
    );

    // Si no tiene membresías, crear membresía superadmin para Sistema Addison
    if (membresias.rows.length === 0) {
      const instSistema = await consulta('SELECT institucion_id FROM instituciones WHERE institucion_slug = $1', ['sistema']);
      if (instSistema.rows.length > 0) {
        const instId = instSistema.rows[0].institucion_id;
        await consulta(
          'INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, aceptado_en) VALUES ($1, $2, $3, $4, $5, NOW())',
          [uid, instId, 'superadmin', 'active', 'sistema']
        );
        const nuevaMembresia = await consulta(
          'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = LASTVAL()',
          []
        );
        membresias.rows = nuevaMembresia.rows;
      }
    }

    // PASO 5: Respuesta según cantidad de membresías
    if (membresias.rows.length === 1) {
      // LOGIN DIRECTO: Una sola membresía activa
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

    } else if (membresias.rows.length > 1) {
      // SELECTOR REQUERIDO: Múltiples instituciones
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
    } else {
      return res.status(403).json({ error: 'Usuario sin membresías activas' });
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
