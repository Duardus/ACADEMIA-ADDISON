const { consulta } = require('../configuracion/base_de_datos');

// GET /api/v1/arbol - Árbol completo de la institución
async function obtenerArbol(req, res) {
  try {
    const institucion_id = req.institucion_id || req.query.institucion_id;
    if (!institucion_id) {
      return res.status(400).json({ error: 'institucion_id requerido' });
    }

    // Grupos: SÍ tienen institucion_id
    const grupos = await consulta(
      'SELECT grupo_id, nombre_grupo, descripcion, orden, estado FROM grupos_academicos WHERE institucion_id = $1 AND estado != $2 ORDER BY orden',
      [institucion_id, 'archived']
    );

    // Cursos: SÍ tienen institucion_id
    const cursos = await consulta(
      'SELECT curso_id, grupo_id, nombre_curso, descripcion, orden, estado FROM cursos WHERE institucion_id = $1 AND estado != $2 ORDER BY orden',
      [institucion_id, 'archived']
    );

    // Temas: NO tienen institucion_id. Filtrar vía JOIN con cursos
    const temas = await consulta(
      'SELECT t.tema_id, t.curso_id, t.nombre_tema, t.orden, t.estado FROM temas t JOIN cursos c ON t.curso_id = c.curso_id WHERE c.institucion_id = $1 AND t.estado != $2 AND c.estado != $2 ORDER BY t.orden',
      [institucion_id, 'archived']
    );

    // Subtemas: NO tienen institucion_id. Filtrar vía JOIN con cursos
    const subtemas = await consulta(
      'SELECT s.subtema_id, s.tema_id, s.nombre_subtema, s.orden, s.estado FROM subtemas s JOIN temas t ON s.tema_id = t.tema_id JOIN cursos c ON t.curso_id = c.curso_id WHERE c.institucion_id = $1 AND s.estado != $2 AND t.estado != $2 AND c.estado != $2 ORDER BY s.orden',
      [institucion_id, 'archived']
    );

    // Ensamblar árbol
    const arbol = grupos.rows.map(g => ({
      ...g,
      hijos: cursos.rows
        .filter(c => c.grupo_id === g.grupo_id)
        .map(c => ({
          ...c,
          hijos: temas.rows
            .filter(t => t.curso_id === c.curso_id)
            .map(t => ({
              ...t,
              hijos: subtemas.rows.filter(s => s.tema_id === t.tema_id)
            }))
        }))
    }));

    res.json({ datos: arbol, total_grupos: grupos.rows.length });
  } catch (error) {
    console.error('Error árbol:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/v1/arbol/grupos
async function crearGrupo(req, res) {
  try {
    const { nombre_grupo, descripcion, orden, institucion_id } = req.body;
    const result = await consulta(
      'INSERT INTO grupos_academicos (nombre_grupo, descripcion, orden, institucion_id, estado, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [nombre_grupo, descripcion || null, orden || 0, institucion_id || req.institucion_id, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/v1/arbol/cursos
async function crearCurso(req, res) {
  try {
    const { nombre_curso, descripcion, grupo_id, orden, institucion_id } = req.body;
    const result = await consulta(
      'INSERT INTO cursos (nombre_curso, descripcion, grupo_id, orden, institucion_id, estado, creado_en) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [nombre_curso, descripcion || null, grupo_id, orden || 0, institucion_id || req.institucion_id, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/v1/arbol/temas
async function crearTema(req, res) {
  try {
    const { nombre_tema, curso_id, orden } = req.body;
    const result = await consulta(
      'INSERT INTO temas (nombre_tema, curso_id, orden, estado, creado_en) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [nombre_tema, curso_id, orden || 0, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// POST /api/v1/arbol/subtemas
async function crearSubtema(req, res) {
  try {
    const { nombre_subtema, tema_id, orden } = req.body;
    const result = await consulta(
      'INSERT INTO subtemas (nombre_subtema, tema_id, orden, estado, creado_en) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [nombre_subtema, tema_id, orden || 0, 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PUT /api/v1/arbol/:tipo/:id
async function actualizar(req, res) {
  try {
    const { tipo, id } = req.params;
    const campos = req.body;
    
    const tablas = {
      grupo: 'grupos_academicos',
      curso: 'cursos',
      tema: 'temas',
      subtema: 'subtemas'
    };
    
    const tabla = tablas[tipo];
    if (!tabla) return res.status(400).json({ error: 'Tipo inválido' });

    const nombreCampo = `nombre_${tipo}`;
    const sets = [];
    const valores = [];
    let idx = 1;

    if (campos[nombreCampo]) { sets.push(`${nombreCampo} = $${idx++}`); valores.push(campos[nombreCampo]); }
    if (campos.descripcion !== undefined) { sets.push(`descripcion = $${idx++}`); valores.push(campos.descripcion); }
    if (campos.orden !== undefined) { sets.push(`orden = $${idx++}`); valores.push(campos.orden); }
    if (campos.estado) { sets.push(`estado = $${idx++}`); valores.push(campos.estado); }

    if (sets.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    valores.push(id);
    const query = `UPDATE ${tabla} SET ${sets.join(', ')} WHERE ${tipo}_id = $${idx} RETURNING *`;
    const result = await consulta(query, valores);
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/v1/arbol/:tipo/:id
async function eliminar(req, res) {
  try {
    const { tipo, id } = req.params;
    const { motivo_eliminacion } = req.body;
    
    const tablas = {
      grupo: 'grupos_academicos',
      curso: 'cursos',
      tema: 'temas',
      subtema: 'subtemas'
    };
    
    const tabla = tablas[tipo];
    if (!tabla) return res.status(400).json({ error: 'Tipo inválido' });

    const entidad = await consulta(`SELECT * FROM ${tabla} WHERE ${tipo}_id = $1`, [id]);
    if (entidad.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });

    // Insertar en papelera
    await consulta(
      'INSERT INTO papelera (entidad_tipo, entidad_id, entidad_datos, padre_id, eliminado_por, institucion_id, motivo_eliminacion, eliminado_en, expira_en, restaurado) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW() + INTERVAL \'30 days\', false)',
      [tipo, id, JSON.stringify(entidad.rows[0]), null, req.usuario_id || 'sistema', req.institucion_id || entidad.rows[0].institucion_id || null, motivo_eliminacion || 'sin motivo']
    );

    // Soft delete: cambiar estado a archived (no deleted, no existe en el check constraint)
    await consulta(`UPDATE ${tabla} SET estado = 'archived' WHERE ${tipo}_id = $1`, [id]);
    
    res.json({ mensaje: `${tipo} archivado correctamente`, entidad_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { obtenerArbol, crearGrupo, crearCurso, crearTema, crearSubtema, actualizar, eliminar };
