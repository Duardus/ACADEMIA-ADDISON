const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaCapacidadesControlador {

  // ============================================
  // OBTENER MIS CAPACIDADES DELEGABLES
  // ============================================
  async obtenerMisCapacidadesDelegables(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) {
        return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      }

      const resultado = await consulta(
        `SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria, c.es_delegable, c.es_crear_usuarios
         FROM membresia_capacidades mc 
         INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id 
         WHERE mc.membresia_id = $1 AND c.es_delegable = true AND c.es_crear_usuarios = false
         ORDER BY c.categoria, c.nombre`,
        [membresia_id]
      );

      const puedeCrear = await consulta(
        'SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1',
        [membresia_id]
      );

      res.json({
        exito: true,
        puede_crear_hijos: puedeCrear.rows[0]?.puede_crear_hijos || false,
        capacidades_delegables: resultado.rows
      });

    } catch (error) {
      console.error('Error obtenerMisCapacidadesDelegables:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  // ============================================
  // MODIFICAR CAPACIDADES DE SUBORDINADO
  // ============================================
  async modificarCapacidadesSubordinado(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      const { capacidades_ids, puede_crear_hijos } = req.body;

      if (!creador_membresia_id) {
        return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      }

      // PROTECCION: No puedes modificarte a ti mismo
      if (objetivo_membresia_id === creador_membresia_id) {
        return res.status(403).json({ error: 'No puedes modificarte a ti mismo', codigo: 'AUTO_MODIFICACION' });
      }

      // Verificar que el objetivo es subordinado del creador (directo o asignado)
      const esSubordinado = await consulta(
        `SELECT 1 FROM superiores_membresia 
         WHERE superior_membresia_id = $1 AND subordinado_membresia_id = $2`,
        [creador_membresia_id, objetivo_membresia_id]
      );
      if (esSubordinado.rows.length === 0) {
        return res.status(403).json({ error: 'No es tu subordinado', codigo: 'NO_ES_SUBORDINADO' });
      }

      // Verificar nivel del creador vs objetivo
      const niveles = await consulta(
        'SELECT membresia_id, nivel FROM membresias WHERE membresia_id IN ($1, $2)',
        [creador_membresia_id, objetivo_membresia_id]
      );
      const nivelCreador = niveles.rows.find(r => r.membresia_id === creador_membresia_id)?.nivel;
      const nivelObjetivo = niveles.rows.find(r => r.membresia_id === objetivo_membresia_id)?.nivel;
      
      if (nivelCreador >= nivelObjetivo) {
        return res.status(403).json({ 
          error: 'No puedes modificar a alguien de nivel igual o superior', 
          codigo: 'NIVEL_INSUFICIENTE' 
        });
      }

      // Validar capacidades
      if (capacidades_ids && capacidades_ids.length > 0) {
        const capsCreador = await consulta(
          `SELECT c.capacidad_id FROM membresia_capacidades mc 
           INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id 
           WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`,
          [creador_membresia_id, capacidades_ids]
        );
        const idsCreador = capsCreador.rows.map(r => r.capacidad_id);
        const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
        if (idsIlegales.length > 0) {
          return res.status(403).json({ 
            error: 'No puedes asignar capacidades que no posees', 
            codigo: 'ASIGNACION_ILEGAL', 
            capacidades_ilegales: idsIlegales 
          });
        }
      }

      const creadorInfo = await consulta(
        'SELECT nivel FROM membresias WHERE membresia_id = $1',
        [creador_membresia_id]
      );
      const creador_nivel = creadorInfo.rows[0]?.nivel;

      // Actualizar capacidades
      await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [objetivo_membresia_id]);
      
      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => 
          `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`
        ).join(', ');
        const params = [
          objetivo_membresia_id,
          ...capacidades_ids,
          ...capacidades_ids.map(() => creador_membresia_id),
          ...capacidades_ids.map(() => creador_usuario_id),
          ...capacidades_ids.map(() => creador_nivel)
        ];
        await consulta(
          `INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion) 
           VALUES ${values}`,
          params
        );
      }

      if (puede_crear_hijos !== undefined) {
        await consulta(
          'UPDATE membresias SET puede_crear_hijos = $1 WHERE membresia_id = $2',
          [puede_crear_hijos, objetivo_membresia_id]
        );
      }

      await consulta(
        `INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, detalle_json)
         VALUES ('modificar_capacidades', $1, $2, $3, $4)`,
        [
          creador_membresia_id, creador_usuario_id, objetivo_membresia_id,
          JSON.stringify({ nuevas_capacidades: capacidades_ids, puede_crear_hijos })
        ]
      );

      res.json({ 
        exito: true, 
        mensaje: 'Capacidades modificadas', 
        membresia_id: objetivo_membresia_id,
        capacidades_asignadas: capacidades_ids?.length || 0
      });

    } catch (error) {
      console.error('Error modificarCapacidadesSubordinado:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  async obtenerEtiquetasFrecuentes(req, res) {
    try {
      const institucion_id = req.contexto_institucion?.institucion_id;
      if (!institucion_id) {
        return res.status(400).json({ error: 'Sin institucion', codigo: 'SIN_INSTITUCION' });
      }

      const resultado = await consulta(
        `SELECT nombre_etiqueta, usos_count FROM etiquetas_cargo 
         WHERE institucion_id = $1 
         ORDER BY usos_count DESC, ultimo_uso DESC 
         LIMIT 20`,
        [institucion_id]
      );

      res.json({ exito: true, etiquetas: resultado.rows });

    } catch (error) {
      console.error('Error obtenerEtiquetasFrecuentes:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  // ============================================
  // ARBOL COMPLETO DE INSTITUCION (solo nivel 0)
  // ============================================

}

module.exports = new JerarquiaCapacidadesControlador();
