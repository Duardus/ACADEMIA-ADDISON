const { consulta } = require('../configuracion/base_de_datos');

async function marcarTeoriaCompletada(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { teoria_id, curso_id } = req.body;
    
    const r = await consulta(
      'INSERT INTO progreso_alumno (alumno_id, teoria_id, curso_id, completado, xp_ganado, completado_en) VALUES ($1, $2, $3, $4, $5, NOW()) ON CONFLICT (alumno_id, teoria_id) DO UPDATE SET completado = $4, xp_ganado = $5, completado_en = NOW() RETURNING *',
      [ctx.usuario_id, teoria_id, curso_id, true, 10]
    );
    
    res.json({ tipo: 'teoria_completada', progreso: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error marcando teoria', codigo: 'PROGRESO_ERROR' }); }
}

async function obtenerProgreso(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { curso_id } = req.query;
    
    let sql = 'SELECT * FROM progreso_alumno WHERE alumno_id = $1';
    let params = [ctx.usuario_id];
    if (curso_id) { sql += ' AND curso_id = $2'; params.push(curso_id); }
    
    const resultado = await consulta(sql, params);
    
    // Calcular XP total
    const xp = await consulta(
      'SELECT SUM(xp_ganado) as total_xp FROM progreso_alumno WHERE alumno_id = $1',
      [ctx.usuario_id]
    );
    
    res.json({ progreso: resultado.rows, total_xp: xp.rows[0].total_xp || 0 });
  } catch (error) { res.status(500).json({ error: 'Error obteniendo progreso', codigo: 'PROGRESO_ERROR' }); }
}

module.exports = { marcarTeoriaCompletada, obtenerProgreso };
