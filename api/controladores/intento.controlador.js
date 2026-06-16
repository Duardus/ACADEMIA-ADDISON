const { consulta } = require('../configuracion/base_de_datos');

async function iniciarIntento(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { examen_id } = req.body;
    
    // Verificar si ya tiene intento en progreso
    const existente = await consulta(
      'SELECT * FROM intentos_examen WHERE examen_id = $1 AND alumno_id = $2 AND estado = $3',
      [examen_id, ctx.usuario_id, 'in_progress']
    );
    
    if (existente.rows.length > 0) {
      return res.json({ tipo: 'intento_continuar', intento: existente.rows[0] });
    }
    
    // Crear nuevo intento
    const examen = await consulta('SELECT num_preguntas FROM examenes WHERE examen_id = $1', [examen_id]);
    const r = await consulta(
      'INSERT INTO intentos_examen (examen_id, alumno_id, total_preguntas, estado, iniciado_en) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [examen_id, ctx.usuario_id, examen.rows[0].num_preguntas, 'in_progress']
    );
    
    res.json({ tipo: 'intento_iniciado', intento: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error iniciando intento', codigo: 'INTENTO_ERROR' }); }
}

async function guardarRespuesta(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { intento_id, pregunta_id, respuesta_seleccionada, tiempo_respuesta_segundos } = req.body;
    
    // Verificar si es correcta
    const pregunta = await consulta('SELECT respuesta_correcta FROM preguntas WHERE pregunta_id = $1', [pregunta_id]);
    const es_correcta = pregunta.rows[0].respuesta_correcta === respuesta_seleccionada;
    
    const r = await consulta(
      'INSERT INTO respuestas_alumno (intento_id, pregunta_id, respuesta_seleccionada, es_correcta, tiempo_respuesta_segundos) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [intento_id, pregunta_id, respuesta_seleccionada, es_correcta, tiempo_respuesta_segundos]
    );
    
    res.json({ tipo: 'respuesta_guardada', respuesta: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error guardando respuesta', codigo: 'RESPUESTA_ERROR' }); }
}

async function finalizarIntento(req, res) {
  try {
    const { intento_id } = req.body;
    
    // Calcular puntaje
    const respuestas = await consulta(
      'SELECT COUNT(*) as total, SUM(CASE WHEN es_correcta THEN 1 ELSE 0 END) as correctas FROM respuestas_alumno WHERE intento_id = $1',
      [intento_id]
    );
    
    const correctas = parseInt(respuestas.rows[0].correctas) || 0;
    const total = parseInt(respuestas.rows[0].total) || 0;
    
    const r = await consulta(
      'UPDATE intentos_examen SET estado = $1, puntaje_obtenido = $2, finalizado_en = NOW() WHERE intento_id = $3 RETURNING *',
      ['completed', correctas, intento_id]
    );
    
    res.json({ tipo: 'intento_finalizado', intento: r.rows[0], correctas, total });
  } catch (error) { res.status(500).json({ error: 'Error finalizando intento', codigo: 'INTENTO_ERROR' }); }
}

module.exports = { iniciarIntento, guardarRespuesta, finalizarIntento };
