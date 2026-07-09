const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'addison_jwt_secret_cambiar_en_produccion_2026';
const JWT_EXPIRA = '8h';

function generarToken(datos) {
  return jwt.sign(datos, JWT_SECRET, { expiresIn: JWT_EXPIRA });
}

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) return res.status(400).json({ error: 'token_firebase requerido' });

    const auth = obtenerAuth();
    const decodificado = await auth.verifyIdToken(token_firebase);
    const uid = decodificado.uid;
    const correo = decodificado.email;
    const nombre = decodificado.name || decodificado.email.split('@')[0];

    let usuarioRes = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);

    if (usuarioRes.rows.length === 0) {
      const porEmail = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
      if (porEmail.rows.length > 0) {
        console.log(`Migrando usuario bootstrap ${porEmail.rows[0].usuario_id} -> ${uid}`);
        await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW() WHERE correo_electronico = $2', [uid, correo]);
        await consulta('UPDATE membresias SET usuario_id = $1 WHERE usuario_id = $2', [uid, porEmail.rows[0].usuario_id]);
        await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, porEmail.rows[0].usuario_id]);
        usuarioRes = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
      } else {
        await consulta(
          `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en, ultimo_login)
           VALUES ($1,$2,$3,'firebase','active',NOW(),NOW())`,
          [uid, correo, nombre]
        );
        usuarioRes = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
      }
    } else {
      await consulta('UPDATE usuarios SET ultimo_login = NOW() WHERE usuario_id = $1', [uid]);
    }

    const usuario = usuarioRes.rows[0];
    const membresiasRes = await consulta(
      `SELECT m.*, i.nombre_institucion, i.institucion_slug
       FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id
       WHERE m.usuario_id = $1 AND m.estado_membresia = 'active'`,
      [uid]
    );

    if (membresiasRes.rows.length === 0) {
      return res.status(403).json({ error: 'Sin membresias activas' });
    }

    if (membresiasRes.rows.length === 1) {
      const mem = membresiasRes.rows[0];
      const token = generarToken({ usuario_id: uid, correo, institucion_id: mem.institucion_id, tipo_rol: mem.tipo_rol });
      return res.json({ tipo: 'login_directo', token_sesion: token, usuario, membresia: mem });
    } else {
      const token_preliminar = generarToken({ usuario_id: uid, prelogin: true });
      return res.json({ tipo: 'selector_requerido', token_preliminar, membresias: membresiasRes.rows, usuario });
    }
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: 'Error interno login', detalle: err.message });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    const dec = jwt.verify(token_preliminar, JWT_SECRET);
    const memRes = await consulta('SELECT * FROM membresias WHERE membresia_id = $1 AND usuario_id = $2', [membresia_id, dec.usuario_id]);
    if (memRes.rows.length === 0) return res.status(404).json({ error: 'Membresia no encontrada' });
    const mem = memRes.rows[0];
    const token = generarToken({ usuario_id: dec.usuario_id, institucion_id: mem.institucion_id, tipo_rol: mem.tipo_rol });
    return res.json({ token_sesion: token, membresia: mem });
  } catch (e) {
    return res.status(401).json({ error: 'Token preliminar invalido' });
  }
}

async function cambiarContexto(req, res) { return seleccionarContexto(req,res); }

module.exports = { login, iniciarSesion: login, seleccionarContexto, seleccionar_contexto: seleccionarContexto, cambiarContexto, switchContext: cambiarContexto, cambiar_contexto: cambiarContexto };
