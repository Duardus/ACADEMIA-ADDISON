const { consulta } = require('../configuracion/base_de_datos');

async function middlewareContexto(req, res, next) {
  try {
    const usuario = req.usuario_autenticado;
    if (!usuario) {
      return res.status(401).json({ error: 'Token requerido', codigo: 'SIN_TOKEN' });
    }

    const membresia = await consulta(
      'SELECT membresia_id, institucion_id, tipo_rol, estado_membresia, metadata_rol FROM membresias WHERE usuario_id = $1 AND estado_membresia = $2 LIMIT 1',
      [usuario.usuario_id, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(403).json({ error: 'Sin membresia activa', codigo: 'SIN_MEMBRESIA' });
    }

    const m = membresia.rows[0];
    let metadata = {};
    try {
      if (m.metadata_rol) metadata = JSON.parse(m.metadata_rol);
    } catch (e) {
      metadata = {};
    }

    req.contexto_institucion = {
      usuario_id: usuario.usuario_id,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      estado_membresia: m.estado_membresia,
      metadata_rol: metadata
    };
    next();
  } catch (error) {
    console.error('Contexto error:', error.message);
    return res.status(500).json({ error: 'Error de contexto', codigo: 'CONTEXTO_ERROR' });
  }
}

module.exports = { middlewareContexto };
