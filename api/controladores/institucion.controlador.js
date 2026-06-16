const { consulta, transaccion } = require('../configuracion/base_de_datos');

async function crearInstitucion(req, res) {
  try {
    const { nombre_institucion, pais_codigo, director_correo, director_nombre } = req.body;
    if (!nombre_institucion || !director_correo || !director_nombre) {
      return res.status(400).json({ error: 'Nombre, correo y nombre del director requeridos', codigo: 'DATOS_FALTANTES' });
    }
    const slug = nombre_institucion.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const correo = director_correo.toLowerCase().trim();
    const resultado = await consulta('INSERT INTO instituciones (nombre_institucion, institucion_slug, pais_codigo, superadmin_id, institucion_status, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING institucion_id', [nombre_institucion, slug, pais_codigo || 'PE', req.usuario_autenticado.usuario_id, 'active']);
    const institucion_id = resultado.rows[0].institucion_id;
    const existente = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
    let dir_id;
    if (existente.rows.length > 0) {
      dir_id = existente.rows[0].usuario_id;
    } else {
      dir_id = 'dir_' + Date.now();
      await consulta('INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', [dir_id, correo, director_nombre, 'manual', 'pending_verification']);
    }
    await consulta('INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', [dir_id, institucion_id, 'director', 'active', req.usuario_autenticado.usuario_id]);
    res.json({ tipo: 'institucion_creada', institucion_id, director_id: dir_id });
  } catch (error) {
    res.status(500).json({ error: 'Error creando institucion', codigo: 'INSTITUCION_ERROR' });
  }
}

async function listarInstituciones(req, res) {
  try {
    const uid = req.usuario_autenticado.usuario_id;
    const inst = await consulta('SELECT i.*, m.tipo_rol FROM instituciones i JOIN membresias m ON i.institucion_id = m.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2', [uid, 'active']);
    res.json({ instituciones: inst.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error listando instituciones', codigo: 'LISTA_ERROR' });
  }
}

module.exports = { crearInstitucion, listarInstituciones };
