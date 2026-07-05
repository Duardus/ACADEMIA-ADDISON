const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const { generarToken } = require('../utilidades/jwt');

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) {
      return res.status(400).json({ error: 'Token no proporcionado', codigo: 'SIN_TOKEN' });
    }

    let decoded;
    try {
      const auth = obtenerAuth();
      decoded = await auth.verifyIdToken(token_firebase);
    } catch (firebaseError) {
      console.error("[AUTH] Token Firebase invalido:", firebaseError.message);
      return res.status(401).json({ error: "Token de Firebase invalido", codigo: "TOKEN_FIREBASE_INVALIDO" });
    }
    const uid = decoded.uid;
    const correo = decoded.email;
    const nombre = decoded.name || 'Usuario';

    // ============================================
    // IDENTIFICADOR UNIVERSAL: EL EMAIL
    // ============================================
    
    // PASO 1: Buscar por email (siempre)
    let result = await consulta(`SELECT * FROM usuarios WHERE correo_electronico = $1 ORDER BY CASE WHEN auth_provider = 'firebase' THEN 0 ELSE 1 END, creado_en DESC`, [correo]);
    let usuario;

    if (result.rows.length > 0) {
      // Usuario existe con este email
      usuario = result.rows[0];
      
      // Si es bootstrap, migrar UID a Firebase (ON UPDATE CASCADE maneja tablas hijas)
      if (usuario.auth_provider === 'bootstrap') {
        await consulta(
          'UPDATE usuarios SET usuario_id = $1, auth_provider = $2, ultimo_login = NOW() WHERE correo_electronico = $3',
          [uid, 'firebase', correo]
        );
        // Recargar
        result = await consulta(`SELECT * FROM usuarios WHERE correo_electronico = $1 ORDER BY CASE WHEN auth_provider = 'firebase' THEN 0 ELSE 1 END, creado_en DESC`, [correo]);
        usuario = result.rows[0];
      } else {
        // Ya es firebase, solo actualizar ultimo login
        await consulta(
          'UPDATE usuarios SET ultimo_login = NOW() WHERE correo_electronico = $1',
          [correo]
        );
      }
    } else {
      // NO EXISTE: Crear nuevo usuario con UID de Firebase
      await consulta(
        `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en, ultimo_login)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [uid, correo, nombre, 'firebase', 'active']
      );
      result = await consulta(`SELECT * FROM usuarios WHERE correo_electronico = $1 ORDER BY CASE WHEN auth_provider = 'firebase' THEN 0 ELSE 1 END, creado_en DESC`, [correo]);
      usuario = result.rows[0];
    }

    // VERIFICAR ESTADO DEL USUARIO
    if (usuario.estado_usuario === 'deleted') {
      return res.status(403).json({
        error: 'Usuario eliminado',
        mensaje: 'Tu cuenta ha sido eliminada. Contacta al administrador para matricularte nuevamente.',
        codigo: 'USUARIO_ELIMINADO',
        correo: correo
      });
    }

    if (usuario.estado_usuario === 'suspended') {
      return res.status(403).json({
        error: 'Usuario suspendido',
        mensaje: 'Tu cuenta esta suspendida. Contacta al administrador para renovar tu matricula.',
        codigo: 'USUARIO_SUSPENDIDO',
        correo: correo
      });
    }

    if (usuario.estado_usuario === 'banned') {
      return res.status(403).json({
        error: 'Usuario bloqueado',
        mensaje: 'Tu cuenta ha sido bloqueada permanentemente.',
        codigo: 'BLOQUEADO',
        correo: correo
      });
    }

    // PASO 2: Buscar membresias activas
    const membresias = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, 
              m.nivel, m.nombre_rol, i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.usuario_id = $1 AND m.estado_membresia = 'active'`,
      [usuario.usuario_id]
    );

    if (membresias.rows.length === 0) {
      // Verificar si tiene membresias suspendidas
      const suspendidas = await consulta(
        'SELECT 1 FROM membresias WHERE usuario_id = $1 AND estado_membresia = $2',
        [usuario.usuario_id, 'suspended']
      );
      
      if (suspendidas.rows.length > 0) {
        return res.status(403).json({
          error: 'Membresia suspendida',
          mensaje: 'Tu membresia esta suspendida. Contacta al administrador para renovar tu matricula.',
          codigo: 'MEMBRESIA_SUSPENDIDA',
          correo: correo
        });
      }

      return res.status(403).json({
        error: 'No tienes membresia activa',
        mensaje: 'Contacta al administrador para que te asigne una membresia.',
        codigo: 'SIN_MEMBRESIA',
        correo: correo
      });
    }

    // PASO 3: Generar JWT y responder
    if (membresias.rows.length === 1) {
      const membresia = membresias.rows[0];
      const tokenSesion = generarToken({
        usuario_id: usuario.usuario_id,
        membresia_id: membresia.membresia_id,
        institucion_id: membresia.institucion_id,
        tipo_rol: membresia.tipo_rol,
        nivel: membresia.nivel,
        correo: usuario.correo_electronico
      });

      return res.status(200).json({
        tipo: 'login_directo',
        token_sesion: tokenSesion,
        usuario: {
          nombre: usuario.nombre_completo || nombre,
          correo: usuario.correo_electronico || correo,
          rol: membresia.tipo_rol,
          nivel: membresia.nivel,
          nombre_rol: membresia.nombre_rol,
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
      // Multiple membresias
      return res.status(200).json({
        tipo: 'selector_requerido',
        token_preliminar: generarToken({ usuario_id: usuario.usuario_id, correo: usuario.correo_electronico }),
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
          rol: m.tipo_rol,
          nivel: m.nivel,
          nombre_rol: m.nombre_rol
        }))
      });
    }

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO', detalle: error.message });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    if (!token_preliminar || !membresia_id) {
      return res.status(400).json({ error: 'token_preliminar y membresia_id requeridos', codigo: 'CAMPOS_INCOMPLETOS' });
    }

    const { verificarToken } = require('../utilidades/jwt');
    const payload = verificarToken(token_preliminar);
    const uid = payload.usuario_id;

    const membresia = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, 
              m.nivel, m.nombre_rol, i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = 'active'`,
      [membresia_id, uid]
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresia no encontrada o inactiva', codigo: 'MEMBRESIA_NO_ENCONTRADA' });
    }

    const m = membresia.rows[0];
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      nivel: m.nivel,
      correo: payload.correo
    });

    return res.status(200).json({
      tipo: 'login_directo',
      token_sesion: tokenSesion,
      usuario: {
        nombre: payload.nombre || 'Usuario',
        correo: payload.correo,
        rol: m.tipo_rol,
        nivel: m.nivel,
        nombre_rol: m.nombre_rol
      },
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      membresia_id: m.membresia_id
    });

  } catch (error) {
    console.error('Error seleccionar contexto:', error);
    return res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO' });
  }
}

async function switchContext(req, res) {
  try {
    const { membresia_id } = req.body;
    const uid = req.usuario_id;

    const membresia = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.nivel, m.nombre_rol,
              i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = 'active'`,
      [membresia_id, uid]
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresia no encontrada', codigo: 'MEMBRESIA_NO_ENCONTRADA' });
    }

    const m = membresia.rows[0];
    const { generarToken } = require('../utilidades/jwt');
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      nivel: m.nivel
    });

    return res.status(200).json({
      token_sesion: tokenSesion,
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      rol: m.tipo_rol,
      nivel: m.nivel,
      nombre_rol: m.nombre_rol
    });

  } catch (error) {
    return res.status(500).json({ error: error.message, codigo: 'ERROR_INTERNO' });
  }
}

module.exports = { login, seleccionarContexto, switchContext };
