const { consulta } = require('../configuracion/base_de_datos');

async function obtenerArbol(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const grupos = await consulta('SELECT * FROM grupos_academicos WHERE institucion_id = $1 AND estado = $2 ORDER BY orden', [ctx.institucion_id, 'active']);
    const cursos = await consulta('SELECT * FROM cursos WHERE institucion_id = $1 AND estado = $2 ORDER BY orden', [ctx.institucion_id, 'active']);
    const temas = await consulta('SELECT * FROM temas WHERE estado = $1 ORDER BY orden', ['active']);
    const subtemas = await consulta('SELECT * FROM subtemas WHERE estado = $1 ORDER BY orden', ['active']);
    const arbol = grupos.rows.map(g => ({
      ...g,
      cursos: cursos.rows.filter(c => c.grupo_id === g.grupo_id).map(c => ({
        ...c,
        temas: temas.rows.filter(t => t.curso_id === c.curso_id).map(t => ({
          ...t,
          subtemas: subtemas.rows.filter(s => s.tema_id === t.tema_id)
        }))
      }))
    }));
    res.json({ arbol });
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo arbol', codigo: 'ARBOL_ERROR' });
  }
}

async function crearGrupo(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { nombre_grupo, orden } = req.body;
    const r = await consulta('INSERT INTO grupos_academicos (institucion_id, nombre_grupo, orden, estado, creado_en) VALUES ($1, $2, $3, $4, NOW()) RETURNING *', [ctx.institucion_id, nombre_grupo, orden || 0, 'active']);
    res.json({ tipo: 'grupo_creado', grupo: r.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error creando grupo', codigo: 'GRUPO_ERROR' });
  }
}

async function crearCurso(req, res) {
  try {
    const ctx = req.contexto_institucion;
    const { grupo_id, nombre_curso, orden } = req.body;
    const r = await consulta('INSERT INTO cursos (institucion_id, grupo_id, nombre_curso, orden, estado, creado_en) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *', [ctx.institucion_id, grupo_id, nombre_curso, orden || 0, 'active']);
    res.json({ tipo: 'curso_creado', curso: r.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error creando curso', codigo: 'CURSO_ERROR' });
  }
}

module.exports = { obtenerArbol, crearGrupo, crearCurso };
