const { consulta } = require('../configuracion/base_de_datos');

async function listarMateriales(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { curso_id } = req.query;
    let sql = 'SELECT * FROM materiales WHERE estado = $1 AND (curso_id IN (SELECT curso_id FROM cursos WHERE institucion_id = $2) OR tema_id IN (SELECT tema_id FROM temas WHERE curso_id IN (SELECT curso_id FROM cursos WHERE institucion_id = $2)))';
    let params = ['active', ctx.institucion_id];
    if (curso_id) { sql += ' AND curso_id = $3'; params.push(curso_id); }
    const resultado = await consulta(sql, params);
    res.json({ materiales: resultado.rows });
  } catch (error) { res.status(500).json({ error: 'Error listando materiales', codigo: 'LISTA_ERROR' }); }
}

async function crearMaterial(req, res) {
  try {
    const { curso_id, tema_id, subtema_id, nombre_material, tipo_material, url_archivo, es_obligatorio } = req.body;
    const r = await consulta(
      'INSERT INTO materiales (curso_id, tema_id, subtema_id, nombre_material, tipo_material, url_archivo, es_obligatorio, estado, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *',
      [curso_id, tema_id, subtema_id, nombre_material, tipo_material, url_archivo, es_obligatorio || false, 'active']
    );
    res.json({ tipo: 'material_creado', material: r.rows[0] });
  } catch (error) { res.status(500).json({ error: 'Error creando material', codigo: 'MATERIAL_ERROR' }); }
}

module.exports = { listarMateriales, crearMaterial };
