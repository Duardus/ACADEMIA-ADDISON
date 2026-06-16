const { EgressClient, EncodedFileOutput } = require('livekit-server-sdk');
const { consulta } = require('../configuracion/base_de_datos');

const egress = new EgressClient(
  process.env.LIVEKIT_URL || 'ws://localhost:7880',
  process.env.LIVEKIT_API_KEY || 'devkey',
  process.env.LIVEKIT_API_SECRET || 'devsecret123'
);

async function iniciarGrabacion(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { sala_id, nombre_sala } = req.body;
    if (!sala_id) return res.status(400).json({ error: 'sala_id requerido', codigo: 'DATOS_FALTANTES' });

    const archivo = `/home/ubuntu/grabaciones/${Date.now()}_${sala_id.replace(/\s+/g, '_')}.mp4`;
    const output = new EncodedFileOutput({ filepath: archivo });
    const info = await egress.startRoomCompositeEgress(sala_id, { file: output });

    const resultado = await consulta(
      'INSERT INTO grabaciones (sala_id, nombre_sala, profesor_id, institucion_id, egress_id, archivo_path, estado, creado_en, expira_en) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL \'7 days\') RETURNING *',
      [sala_id, nombre_sala || sala_id, ctx.usuario_id, ctx.institucion_id, info.egressId, archivo, 'grabando']
    );

    res.json({ tipo: 'grabacion_iniciada', grabacion: resultado.rows[0] });
  } catch (error) {
    console.error('Error iniciando grabacion:', error);
    res.status(500).json({ error: 'Error iniciando grabacion', codigo: 'GRABACION_ERROR' });
  }
}

async function detenerGrabacion(req, res) {
  try {
    const { grabacion_id } = req.body;
    if (!grabacion_id) return res.status(400).json({ error: 'grabacion_id requerido', codigo: 'DATOS_FALTANTES' });

    const grabacion = await consulta('SELECT * FROM grabaciones WHERE grabacion_id = $1', [grabacion_id]);
    if (grabacion.rows.length === 0) return res.status(404).json({ error: 'Grabacion no encontrada', codigo: 'NO_ENCONTRADO' });

    const g = grabacion.rows[0];
    await egress.stopEgress(g.egress_id);

    await consulta(
      'UPDATE grabaciones SET estado = $1, finalizado_en = NOW() WHERE grabacion_id = $2',
      ['completada', grabacion_id]
    );

    res.json({ tipo: 'grabacion_detenida', grabacion_id });
  } catch (error) {
    console.error('Error deteniendo grabacion:', error);
    res.status(500).json({ error: 'Error deteniendo grabacion', codigo: 'GRABACION_ERROR' });
  }
}

async function listarGrabaciones(req, res) {
  try {
    const ctx = req.contexto_institucion;
    let sql = 'SELECT * FROM grabaciones WHERE institucion_id = $1 AND expira_en > NOW() ORDER BY creado_en DESC';
    let params = [ctx.institucion_id];

    if (ctx.tipo_rol === 'professor') {
      sql = 'SELECT * FROM grabaciones WHERE profesor_id = $1 AND expira_en > NOW() ORDER BY creado_en DESC';
      params = [ctx.usuario_id];
    }

    const resultado = await consulta(sql, params);
    res.json({ grabaciones: resultado.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error listando grabaciones', codigo: 'LISTA_ERROR' });
  }
}

async function descargarGrabacion(req, res) {
  try {
    const ctx = req.contexto_institucion;
    if (ctx.tipo_rol !== 'superadmin') {
      return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const { grabacion_id } = req.params;
    const grabacion = await consulta('SELECT * FROM grabaciones WHERE grabacion_id = $1 AND institucion_id = $2', [grabacion_id, ctx.institucion_id]);

    if (grabacion.rows.length === 0) return res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });

    const archivo = grabacion.rows[0].archivo_path;
    res.download(archivo, (err) => {
      if (err) res.status(404).json({ error: 'Archivo no encontrado', codigo: 'ARCHIVO_NO_ENCONTRADO' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error descargando grabacion', codigo: 'DESCARGA_ERROR' });
  }
}

module.exports = { iniciarGrabacion, detenerGrabacion, listarGrabaciones, descargarGrabacion };
