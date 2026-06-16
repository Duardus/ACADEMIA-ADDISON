const { verificarToken } = require('../utilidades/jwt');
const { consulta } = require('../configuracion/base_de_datos');

async function middlewareContexto(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const tokenCompleto = header.split('Bearer ')[1];
    const payload = verificarToken(tokenCompleto);

    if (payload.tipo !== 'definitivo') {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const membresia = await consulta(
      'SELECT membresia_id, institucion_id, tipo_rol, estado_membresia, metadata_rol FROM membresias WHERE membresia_id = $1 AND usuario_id = $2 AND estado_membresia = $3',
      [payload.membresia_id, payload.usuario_id, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const m = membresia.rows[0];
    req.contexto_institucion = {
      usuario_id: payload.usuario_id,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      estado_membresia: m.estado_membresia,
      metadata_rol: m.metadata_rol ? JSON.parse(m.metadata_rol) : {}
    };

    next();
  } catch (error) {
    return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
  }
}

module.exports = { middlewareContexto };
