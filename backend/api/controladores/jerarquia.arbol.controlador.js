const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaArbolControlador {

  // ============================================
  // ARBOL COMPLETO DE INSTITUCION
  // ============================================
  async arbolCompletoInstitucion(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;

      if (!membresia_id || !institucion_id) {
        return res.status(400).json({ error: 'Sin contexto', codigo: 'SIN_CONTEXTO' });
      }

      // Solo nivel 0 puede ver todo el arbol
      const esNivelCero = await consulta(
        'SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0',
        [membresia_id]
      );
      if (esNivelCero.rows.length === 0) {
        return res.status(403).json({ error: 'Solo nivel 0 puede ver arbol completo', codigo: 'NO_NIVEL_CERO' });
      }

      const resultado = await consulta(
        `SELECT 
          m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel,
          m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia,
          u.correo_electronico, u.nombre_completo, u.avatar_url,
          COALESCE(jsonb_agg(jsonb_build_object('capacidad_id', c.capacidad_id, 'codigo', c.codigo, 'nombre', c.nombre) ORDER BY c.nombre) FILTER (WHERE c.capacidad_id IS NOT NULL), '[]'::jsonb) as capacidades
         FROM membresias m
         JOIN usuarios u ON m.usuario_id = u.usuario_id
         LEFT JOIN membresia_capacidades mc ON m.membresia_id = mc.membresia_id
         LEFT JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
         WHERE m.institucion_id = $1 AND m.estado_membresia = 'active'
         GROUP BY m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel,
                  m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia,
                  u.correo_electronico, u.nombre_completo, u.avatar_url
         ORDER BY m.nivel, u.nombre_completo`,
        [institucion_id]
      );

      res.json({ exito: true, total: resultado.rows.length, arbol: resultado.rows });

    } catch (error) {
      console.error('Error arbolCompletoInstitucion:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  // ============================================
  // OBTENER SUPERIORES DE UNA MEMBRESIA
  // ============================================

  async crearGrupoColaborativo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      const { nombre_grupo, descripcion, miembros_ids } = req.body;

      if (!creador_membresia_id || !institucion_id) {
        return res.status(400).json({ error: 'Sin contexto', codigo: 'SIN_CONTEXTO' });
      }

      const creadorInfo = await consulta(
        'SELECT nivel FROM membresias WHERE membresia_id = $1',
        [creador_membresia_id]
      );

      const nuevoGrupo = await consulta(
        `INSERT INTO grupos_colaborativos (nombre_grupo, descripcion, institucion_id, creador_membresia_id, nivel_grupo)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [nombre_grupo, descripcion, institucion_id, creador_membresia_id, creadorInfo.rows[0]?.nivel]
      );

      // Agregar miembros como subordinados
      if (miembros_ids && miembros_ids.length > 0) {
        for (const miembro_id of miembros_ids) {
          await consulta(
            `INSERT INTO miembros_grupo_colaborativo (grupo_id, miembro_membresia_id, rol_en_grupo, agregado_por_membresia_id)
             VALUES ($1, $2, 'subordinado', $3)
             ON CONFLICT DO NOTHING`,
            [nuevoGrupo.rows[0].grupo_id, miembro_id, creador_membresia_id]
          );
        }
      }

      res.status(201).json({ exito: true, grupo: nuevoGrupo.rows[0] });

    } catch (error) {
      console.error('Error crearGrupoColaborativo:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }


}

module.exports = new JerarquiaArbolControlador();
