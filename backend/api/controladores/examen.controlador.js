const { consulta, transaccion } = require('../configuracion/base_de_datos');

async function listarExamenes(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id, estado } = req.query;
    let sql = 'SELECT * FROM examenes WHERE institucion_id = $1';
    let params = [ctx.institucion_id];
    if (subtema_id) { sql += ' AND subtema_id = $2'; params.push(subtema_id); }
    if (estado) { sql += ' AND estado = $' + (params.length + 1); params.push(estado); }
    else { sql += ' AND estado IN ($2, $3)'; params.push('published', 'open'); }
    sql += ' ORDER BY creado_en DESC';
    const resultado = await consulta(sql, params);
    res.json({ examenes: resultado.rows });
  } catch (error) { res.status(500).json({ error: 'Error listando examenes', codigo: 'LISTA_ERROR' }); }
}

async function crearExamen(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id, titulo_examen, descripcion, tiempo_minutos, num_preguntas, puntaje_aprobacion, preguntas_ids } = req.body;
    
    // Crear examen
    const r = await consulta(
      'INSERT INTO examenes (subtema_id, profesor_id, institucion_id, titulo_examen, descripcion, tiempo_minutos, num_preguntas, puntaje_aprobacion, estado, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *',
      [subtema_id, ctx.usuario_id, ctx.institucion_id, titulo_examen, descripcion, tiempo_minutos || 20, num_preguntas || 20, puntaje_aprobacion || 13, 'draft']
    );
    
    const examen_id = r.rows[0].examen_id;
    
    // Asociar preguntas
    if (preguntas_ids && preguntas_ids.length > 0) {
      const ops = preguntas_ids.map((pid, idx) => ({
        sql: 'INSERT INTO examen_preguntas (examen_id, pregunta_id, orden, puntaje) VALUES ($1, $2, $3, $4)',
        parametros: [examen_id, pid, idx, 1]
      }));
      await transaccion(ops);
    }
    
    res.json({ tipo: 'examen_creado', examen: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error creando examen', codigo: 'EXAMEN_ERROR' }); }
}

async function publicarExamen(req, res) {
  try {
    const { examen_id } = req.params;
    const r = await consulta(
      'UPDATE examenes SET estado = $1, abierto_en = NOW() WHERE examen_id = $2 RETURNING *',
      ['open', examen_id]
    );
    res.json({ tipo: 'examen_publicado', examen: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error publicando examen', codigo: 'EXAMEN_ERROR' }); }
}

async function cerrarExamen(req, res) {
  try {
    const { examen_id } = req.params;
    const r = await consulta(
      'UPDATE examenes SET estado = $1, cerrado_en = NOW() WHERE examen_id = $2 RETURNING *',
      ['closed', examen_id]
    );
    res.json({ tipo: 'examen_cerrado', examen: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error cerrando examen', codigo: 'EXAMEN_ERROR' }); }
}

module.exports = { listarExamenes, crearExamen, publicarExamen, cerrarExamen };
