const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const { generarToken } = require('../utilidades/jwt');

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) {
      return res.status(400).json({ error: 'Token no proporcionado', codigo: 'SIN_TOKEN' });
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
        // Usuario PRE-REGISTRADO encontrado por email
        const usuarioPre = porEmail.rows[0];
        
        // VERIFICAR: Si el pre-registrado esta eliminado o suspendido
        if (usuarioPre.estado_usuario === 'deleted') {
          return res.status(403).json({
            error: 'Usuario eliminado',
            mensaje: 'Tu cuenta ha sido eliminada. Contacta al administrador para matricularte nuevamente.',
            codigo: 'USUARIO_ELIMINADO',
            correo: correo
          });
        }
        
        if (usuarioPre.estado_usuario === 'suspended') {
          return res.status(403).json({
            error: 'Usuario suspendido',
            mensaje: 'Tu cuenta esta suspendida. Contacta al administrador para renovar tu matricula.',
            codigo: 'USUARIO_SUSPENDIDO',
            correo: correo
          });
        }

        // MIGRACION: Actualizar usuario_id del bootstrap al UID real de Firebase
        // Gracias a ON UPDATE CASCADE, todas las tablas hijas se actualizan automaticamente
        try {
          await consulta(
            'UPDATE usuarios SET usuario_id = $1, auth_provider = $2, ultimo_login = NOW(), estado_usuario = $3 WHERE correo_electronico = $4',
            [uid, 'firebase', 'active', correo]
          );
          
          // Obtener el usuario actualizado
          result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
          usuario = result.rows[0];
          
        } catch (err) {
          console.error('Error en migracion:', err);
          return res.status(500).json({ error: 'Error al migrar usuario', codigo: 'ERROR_MIGRACION', detalle: err.message });
        }
        
      } else {
        // NO REGISTRADO
        return res.status(403).json({
          error: 'No estas registrado',
          mensaje: 'Para tener acceso a la plataforma matriculate primero.',
          codigo: 'NO_REGISTRADO',
          correo: correo
        });
      }
    } else {
      // Usuario ya existe con UID real
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

    // Actualizar ultimo login
    await consulta("UPDATE usuarios SET ultimo_login = NOW(), auth_provider = COALESCE(auth_provider, 'firebase') WHERE usuario_id = $1", [uid]);

    // PASO 3: Buscar membresias activas
    const membresias = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, 
              m.nivel, m.nombre_rol, i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.usuario_id = $1 AND m.estado_membresia = 'active'`,
      [uid]
    );

    if (membresias.rows.length === 0) {
      // Verificar si tiene membresias suspendidas
      const suspendidas = await consulta(
        'SELECT 1 FROM membresias WHERE usuario_id = $1 AND estado_membresia = $2',
        [uid, 'suspended']
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

    // PASO 4: Generar JWT y responder
    if (membresias.rows.length === 1) {
      const membresia = membresias.rows[0];
      const tokenSesion = generarToken({
        usuario_id: uid,
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
          rol: m.tipo_rol,
          nivel: m.nivel,
          nombre_rol: m.nombre_rol
        }))
      });
    }

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO' });
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
