const { consulta } = require('../configuracion/base_de_datos');
const admin = require('firebase-admin');

class JerarquiaControlador {

  async crearUsuarioHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      
      if (!creador_membresia_id || !creador_usuario_id || !institucion_id) {
        return res.status(400).json({ error: 'Falta contexto', codigo: 'SIN_CONTEXTO' });
      }

      const { email, nombre_rol, nombre_completo, capacidades_ids, puede_crear_hijos } = req.body;

      const tienePoder = await consulta(
        `SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`,
        [creador_membresia_id]
      );
      if (tienePoder.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso', codigo: 'SIN_PODER_CREAR' });
      }

      const puedeCrear = await consulta('SELECT puede_crear_hijos, nivel FROM membresias WHERE membresia_id = $1', [creador_membresia_id]);
      if (!puedeCrear.rows[0]?.puede_crear_hijos) {
        return res.status(403).json({ error: 'Creacion deshabilitada', codigo: 'CREACION_DESHABILITADA' });
      }
      const creador_nivel = puedeCrear.rows[0].nivel;

      // Pre-registro: generar UID bootstrap, NO verificar Firebase
      let uid_firebase = `bootstrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const usuarioExiste = await consulta('SELECT usuario_id FROM usuarios WHERE correo_electronico = $1', [email]);
      if (usuarioExiste.rows.length > 0) {
        uid_firebase = usuarioExiste.rows[0].usuario_id;
      } else {
        await consulta(`INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())`, [uid_firebase, email, nombre_completo || email.split('@')[0], 'bootstrap', 'active']);
      }

      // Verificar solo membresias ACTIVAS
      const existeActiva = await consulta('SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3', [uid_firebase, institucion_id, 'active']);
      if (existeActiva.rows.length > 0) return res.status(409).json({ error: 'Ya tiene membresia activa', codigo: 'MEMBRESIA_EXISTENTE' });
      
      // Si existe una membresia suspendida, reactivarla
      const existeSuspendida = await consulta('SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3', [uid_firebase, institucion_id, 'suspended']);

      if (capacidades_ids && capacidades_ids.length > 0) {
        const capsCreador = await consulta(`SELECT c.capacidad_id FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`, [creador_membresia_id, capacidades_ids]);
        const idsCreador = capsCreador.rows.map(r => r.capacidad_id);
        const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
        if (idsIlegales.length > 0) return res.status(403).json({ error: 'No puedes delegar capacidades que no posees', codigo: 'DELEGACION_ILEGAL', capacidades_ilegales: idsIlegales });
      }

      const capCrear = await consulta("SELECT capacidad_id FROM capacidades WHERE codigo = 'crear_usuarios'");
      if (capacidades_ids?.includes(capCrear.rows[0]?.capacidad_id)) return res.status(403).json({ error: 'crear_usuarios no delegable directamente', codigo: 'CREAR_USUARIOS_NO_DELEGABLE' });

      const nivelHijo = creador_nivel + 1;
      // Si ya existe una membresia suspended, reactivarla
      const membresiaExistente = await consulta('SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2', [uid_firebase, institucion_id]);
      let nueva_membresia_id;
      
      if (membresiaExistente.rows.length > 0) {
        // Reactivar membresia existente
        nueva_membresia_id = membresiaExistente.rows[0].membresia_id;
        await consulta(
          `UPDATE membresias SET estado_membresia = 'active', tipo_rol = $1, nombre_rol = $2, nivel = $3, padre_membresia_id = $4, puede_crear_hijos = $5, creado_por_usuario_id = $6 WHERE membresia_id = $7`,
          ['custom', nombre_rol, nivelHijo, creador_membresia_id, puede_crear_hijos || false, creador_usuario_id, nueva_membresia_id]
        );
        // Limpiar capacidades anteriores
        await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [nueva_membresia_id]);
      } else {
        // Crear nueva membresia
        const nuevaMembresia = await consulta(
          `INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, nombre_rol, nivel, padre_membresia_id, puede_crear_hijos, creado_por_usuario_id, estado_membresia, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING membresia_id`,
          [uid_firebase, institucion_id, 'custom', nombre_rol, nivelHijo, creador_membresia_id, puede_crear_hijos || false, creador_usuario_id, 'active']
        );
        nueva_membresia_id = nuevaMembresia.rows[0].membresia_id;
      }

      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`).join(', ');
        const params = [nueva_membresia_id, ...capacidades_ids, ...capacidades_ids.map(() => creador_membresia_id), ...capacidades_ids.map(() => creador_usuario_id), ...capacidades_ids.map(() => creador_nivel)];
        await consulta(`INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion) VALUES ${values}`, params);
      }

      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json) VALUES ('crear_usuario', $1, $2, $3, $4, $5)`, [creador_membresia_id, creador_usuario_id, nueva_membresia_id, uid_firebase, JSON.stringify({nombre_rol, nivel: nivelHijo, capacidades_ids, puede_crear_hijos: puede_crear_hijos||false, institucion_id})]);

      res.status(201).json({ exito: true, mensaje: 'Usuario creado', membresia: { membresia_id: nueva_membresia_id, usuario_id: uid_firebase, email, nombre_rol, nivel: nivelHijo, padre_membresia_id: creador_membresia_id, puede_crear_hijos: puede_crear_hijos||false, capacidades_asignadas: capacidades_ids?.length||0 }});
    } catch (error) {
      console.error('Error crearUsuarioHijo:', error);
      res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO', detalle: error.message });
    }
  }

  async obtenerMisHijos(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      
      // Consultar descendientes con datos de usuario
      const resultado = await consulta(`
        SELECT 
          d.r_membresia_id as membresia_id,
          d.r_usuario_id as usuario_id,
          d.r_nombre_rol as nombre_rol,
          d.r_nivel as nivel,
          d.r_padre_membresia_id as padre_membresia_id,
          d.r_puede_crear_hijos as puede_crear_hijos,
          d.r_tipo_rol as tipo_rol,
          d.r_estado_membresia as estado_membresia,
          u.correo_electronico,
          u.nombre_completo
        FROM obtener_descendientes_membresia($1) d
        LEFT JOIN usuarios u ON d.r_usuario_id = u.usuario_id
        ORDER BY d.r_nivel, u.nombre_completo
      `, [membresia_id]);
      
      const hijosConCapacidades = await Promise.all(resultado.rows.map(async (hijo) => {
        const caps = await consulta(`SELECT c.codigo, c.nombre, c.categoria FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1`, [hijo.membresia_id]);
        return { ...hijo, capacidades: caps.rows };
      }));
      
      res.json({ exito: true, total: resultado.rows.length, hijos: hijosConCapacidades });
    } catch (error) { 
      console.error('Error obtenerMisHijos:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO', detalle: error.message }); 
    }
  }

  async obtenerMisCapacidades(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const resultado = await consulta(`SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria, c.es_delegable, c.es_crear_usuarios, mc.puede_delegar, mc.asignado_por_membresia_id, mc.nivel_asignacion FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 ORDER BY c.categoria, c.nombre`, [membresia_id]);
      const infoMembresia = await consulta('SELECT puede_crear_hijos, nivel, nombre_rol, tipo_rol FROM membresias WHERE membresia_id = $1', [membresia_id]);
      res.json({ exito: true, membresia: infoMembresia.rows[0], capacidades: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async capacidadesDisponiblesParaDelegar(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const resultado = await consulta(`SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.es_delegable = true AND c.es_crear_usuarios = false AND mc.puede_delegar = true ORDER BY c.categoria, c.nombre`, [membresia_id]);
      const puedeCrear = await consulta('SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1', [membresia_id]);
      res.json({ exito: true, puede_crear_hijos: puedeCrear.rows[0]?.puede_crear_hijos||false, capacidades_delegables: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async modificarCapacidadesHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      const { capacidades_ids, puede_crear_hijos } = req.body;
      if (!creador_membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE r_membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
      if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es tu descendiente', codigo: 'NO_ES_DESCENDIENTE' });
      if (capacidades_ids && capacidades_ids.length > 0) {
        const capsCreador = await consulta(`SELECT c.capacidad_id FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`, [creador_membresia_id, capacidades_ids]);
        const idsCreador = capsCreador.rows.map(r => r.capacidad_id);
        const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
        if (idsIlegales.length > 0) return res.status(403).json({ error: 'No puedes asignar capacidades que no posees', codigo: 'ASIGNACION_ILEGAL', capacidades_ilegales: idsIlegales });
      }
      const creadorInfo = await consulta('SELECT nivel FROM membresias WHERE membresia_id = $1', [creador_membresia_id]);
      const creador_nivel = creadorInfo.rows[0]?.nivel;
      await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [objetivo_membresia_id]);
      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`).join(', ');
        const params = [objetivo_membresia_id, ...capacidades_ids, ...capacidades_ids.map(() => creador_membresia_id), ...capacidades_ids.map(() => creador_usuario_id), ...capacidades_ids.map(() => creador_nivel)];
        await consulta(`INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion) VALUES ${values}`, params);
      }
      if (puede_crear_hijos !== undefined) await consulta('UPDATE membresias SET puede_crear_hijos = $1 WHERE membresia_id = $2', [puede_crear_hijos, objetivo_membresia_id]);
      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, detalle_json) VALUES ('modificar_capacidades', $1, $2, $3, $4)`, [creador_membresia_id, creador_usuario_id, objetivo_membresia_id, JSON.stringify({nuevas_capacidades: capacidades_ids, puede_crear_hijos})]);
      res.json({ exito: true, mensaje: 'Capacidades modificadas', membresia_id: objetivo_membresia_id, capacidades_asignadas: capacidades_ids?.length||0 });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async eliminarHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (!creador_membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE r_membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
      if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es tu descendiente', codigo: 'NO_ES_DESCENDIENTE' });
      const infoObjetivo = await consulta('SELECT nivel, usuario_id FROM membresias WHERE membresia_id = $1', [objetivo_membresia_id]);
      if (infoObjetivo.rows[0]?.nivel === 0) return res.status(403).json({ error: 'No puedes eliminar superadmin', codigo: 'PROTECCION_SUPERADMIN' });
      await consulta("UPDATE membresias SET estado_membresia = 'suspended', padre_membresia_id = NULL WHERE membresia_id = $1", [objetivo_membresia_id]);
      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json) VALUES ('desactivar_usuario', $1, $2, $3, $4, $5)`, [creador_membresia_id, creador_usuario_id, objetivo_membresia_id, infoObjetivo.rows[0]?.usuario_id, JSON.stringify({metodo: 'soft_delete', nivel_previo: infoObjetivo.rows[0]?.nivel})]);
      res.json({ exito: true, mensaje: 'Usuario desactivado', membresia_id: objetivo_membresia_id });
    } catch (error) { console.error('Error eliminarHijo:', error); res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO', detalle: error.message }); }
  }

  async arbolCompletoInstitucion(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      if (!membresia_id || !institucion_id) return res.status(400).json({ error: 'Sin contexto', codigo: 'SIN_CONTEXTO' });
      const esSuperadmin = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [membresia_id]);
      if (esSuperadmin.rows.length === 0) return res.status(403).json({ error: 'Solo superadmin', codigo: 'NO_SUPERADMIN' });
      const resultado = await consulta(`SELECT m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia, u.correo_electronico, u.nombre_completo, u.avatar_url, COALESCE(jsonb_agg(jsonb_build_object('capacidad_id', c.capacidad_id, 'codigo', c.codigo, 'nombre', c.nombre) ORDER BY c.nombre) FILTER (WHERE c.capacidad_id IS NOT NULL), '[]'::jsonb) as capacidades FROM membresias m JOIN usuarios u ON m.usuario_id = u.usuario_id LEFT JOIN membresia_capacidades mc ON m.membresia_id = mc.membresia_id LEFT JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE m.institucion_id = $1 AND m.estado_membresia = 'active' GROUP BY m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia, u.correo_electronico, u.nombre_completo, u.avatar_url ORDER BY m.nivel, u.nombre_completo`, [institucion_id]);
      res.json({ exito: true, total: resultado.rows.length, arbol: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }
}

module.exports = new JerarquiaControlador();
