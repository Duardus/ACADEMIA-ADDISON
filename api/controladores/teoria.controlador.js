const { consulta } = require('../configuracion/base_de_datos');

async function listarTeorias(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id } = req.query;
    let sql = 'SELECT t.* FROM teorias t JOIN subtemas s ON t.subtema_id = s.subtema_id JOIN temas m ON s.tema_id = m.tema_id JOIN cursos c ON m.curso_id = c.curso_id WHERE c.institucion_id = $1 AND t.estado = $2';
    let params = [ctx.institucion_id, 'active'];
    if (subtema_id) { sql += ' AND t.subtema_id = $3'; params.push(subtema_id); }
    sql += ' ORDER BY t.orden';
    const resultado = await consulta(sql, params);
    res.json({ teorias: resultado.rows });
  } catch (error) { res.status(500).json({ error: 'Error listando teorias', codigo: 'LISTA_ERROR' }); }
}

async function crearTeoria(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { subtema_id, titulo_teoria, contenido_html, orden, es_obligatoria } = req.body;
    const r = await consulta(
      'INSERT INTO teorias (subtema_id, titulo_teoria, contenido_html, orden, es_obligatoria, estado, creado_en) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [subtema_id, titulo_teoria, contenido_html, orden || 0, es_obligatoria || false, 'active']
    );
    res.json({ tipo: 'teoria_creada', teoria: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error creando teoria', codigo: 'TEORIA_ERROR' }); }
}

async function actualizarTeoria(req, res) {
  try {
    const { teoria_id } = req.params;
    const { titulo_teoria, contenido_html, orden, es_obligatoria, estado } = req.body;
    const r = await consulta(
      'UPDATE teorias SET titulo_teoria = $1, contenido_html = $2, orden = $3, es_obligatoria = $4, estado = $5 WHERE teoria_id = $6 RETURNING *',
      [titulo_teoria, contenido_html, orden, es_obligatoria, estado || 'active', teoria_id]
    );
    res.json({ tipo: 'teoria_actualizada', teoria: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error actualizando teoria', codigo: 'TEORIA_ERROR' }); }
}

module.exports = { listarTeorias, crearTeoria, actualizarTeoria };
