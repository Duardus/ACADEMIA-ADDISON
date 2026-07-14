const { consulta } = require('../configuracion/base_de_datos');

async function listarPreguntas(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id } = req.query;
    let sql = 'SELECT * FROM preguntas WHERE institucion_id = $1 AND estado = $2';
    let params = [ctx.institucion_id, 'active'];
    if (subtema_id) { sql += ' AND subtema_id = $3'; params.push(subtema_id); }
    sql += ' ORDER BY dificultad, creado_en DESC';
    const resultado = await consulta(sql, params);
    res.json({ preguntas: resultado.rows });
  } catch (error) { res.status(500).json({ error: 'Error listando preguntas', codigo: 'LISTA_ERROR' }); }
}

async function crearPregunta(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id, enunciado, tipo_pregunta, opciones, respuesta_correcta, explicacion, dificultad } = req.body;
    const r = await consulta(
      'INSERT INTO preguntas (subtema_id, profesor_id, institucion_id, enunciado, tipo_pregunta, opciones, respuesta_correcta, explicacion, dificultad, estado, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING *',
      [subtema_id, ctx.usuario_id, ctx.institucion_id, enunciado, tipo_pregunta || 'multiple', JSON.stringify(opciones || []), respuesta_correcta, explicacion, dificultad || 3, 'active']
    );
    res.json({ tipo: 'pregunta_creada', pregunta: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error creando pregunta', codigo: 'PREGUNTA_ERROR' }); }
}

async function actualizarPregunta(req, res) {
  try {
    const { pregunta_id } = req.params;
    const { enunciado, opciones, respuesta_correcta, explicacion, dificultad, estado } = req.body;
    // Si ya fue usada en examen, crear version 2
    const usada = await consulta('SELECT COUNT(*) as total FROM examen_preguntas WHERE pregunta_id = $1', [pregunta_id]);
    if (usada.rows[0].total > 0 && estado === 'active') {
      // Crear nueva version
      const original = await consulta('SELECT * FROM preguntas WHERE pregunta_id = $1', [pregunta_id]);
      const o = original.rows[0];
      const r = await consulta(
        'INSERT INTO preguntas (subtema_id, profesor_id, institucion_id, enunciado, tipo_pregunta, opciones, respuesta_correcta, explicacion, dificultad, estado, version, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *',
        [o.subtema_id, o.profesor_id, o.institucion_id, enunciado || o.enunciado, o.tipo_pregunta, JSON.stringify(opciones || o.opciones), respuesta_correcta || o.respuesta_correcta, explicacion || o.explicacion, dificultad || o.dificultad, 'active', o.version + 1]
      );
      // Archivar la original
      await consulta('UPDATE preguntas SET estado = $1 WHERE pregunta_id = $2', ['archived', pregunta_id]);
      return res.json({ tipo: 'pregunta_versionada', pregunta: r.rows[0] });
    }
    
    const r = await consulta(
      'UPDATE preguntas SET enunciado = $1, opciones = $2, respuesta_correcta = $3, explicacion = $4, dificultad = $5, estado = $6 WHERE pregunta_id = $7 RETURNING *',
      [enunciado, JSON.stringify(opciones || []), respuesta_correcta, explicacion, dificultad, estado || 'active', pregunta_id]
    );
    res.json({ tipo: 'pregunta_actualizada', pregunta: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error actualizando pregunta', codigo: 'PREGUNTA_ERROR' }); }
}

module.exports = { listarPreguntas, crearPregunta, actualizarPregunta };
