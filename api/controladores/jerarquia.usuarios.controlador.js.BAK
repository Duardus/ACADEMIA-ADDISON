const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaUsuariosControlador {

  // ============================================
  // CREAR USUARIO HIJO
  // ============================================
  async crearUsuarioHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      
      if (!creador_membresia_id || !creador_usuario_id || !institucion_id) {
        return res.status(400).json({ error: 'Falta contexto', codigo: 'SIN_CONTEXTO' });
      }

      const { 
        email, 
        nombre_rol, 
        nombre_completo, 
        nivel_jerarquico,
        superior_inmediato_id,
        superiores_adicionales,
        capacidades_ids, 
        puede_crear_hijos 
      } = req.body;

      // Validar campos obligatorios
      if (!email || !nombre_rol || nivel_jerarquico === undefined || !superior_inmediato_id) {
        return res.status(400).json({ 
          error: 'Email, nombre_rol, nivel_jerarquico y superior_inmediato_id son obligatorios', 
          codigo: 'CAMPOS_INCOMPLETOS' 
        });
      }

      // Verificar que el creador tiene capacidad de crear_usuarios
      const tienePoder = await consulta(
        `SELECT 1 FROM membresia_capacidades mc 
         INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id 
         WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`,
        [creador_membresia_id]
      );
      if (tienePoder.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso para crear usuarios', codigo: 'SIN_PODER_CREAR' });
      }

      // Verificar que el creador puede crear hijos
      const puedeCrear = await consulta(
        'SELECT puede_crear_hijos, nivel FROM membresias WHERE membresia_id = $1', 
        [creador_membresia_id]
      );
      if (!puedeCrear.rows[0]?.puede_crear_hijos) {
        return res.status(403).json({ error: 'Creacion deshabilitada para tu cuenta', codigo: 'CREACION_DESHABILITADA' });
      }
      const creador_nivel = puedeCrear.rows[0].nivel;

      // REGLA: El nuevo usuario DEBE tener nivel MAYOR que su creador
      if (parseInt(nivel_jerarquico) <= creador_nivel) {
        return res.status(403).json({ 
          error: `El nivel del nuevo usuario (${nivel_jerarquico}) debe ser mayor que el tuyo (${creador_nivel})`, 
          codigo: 'NIVEL_INVALIDO' 
        });
      }

      // REGLA: El superior inmediato DEBE existir y tener nivel MENOR que el nuevo
      const superiorInfo = await consulta(
        'SELECT nivel, estado_membresia FROM membresias WHERE membresia_id = $1 AND institucion_id = $2',
        [superior_inmediato_id, institucion_id]
      );
      if (superiorInfo.rows.length === 0) {
        return res.status(404).json({ error: 'Superior inmediato no encontrado', codigo: 'SUPERIOR_NO_EXISTE' });
      }
      if (superiorInfo.rows[0].estado_membresia !== 'active') {
        return res.status(403).json({ error: 'Superior inmediato no esta activo', codigo: 'SUPERIOR_INACTIVO' });
      }
      if (superiorInfo.rows[0].nivel >= parseInt(nivel_jerarquico)) {
        return res.status(403).json({ 
          error: `El superior (${superiorInfo.rows[0].nivel}) debe tener nivel menor que el nuevo (${nivel_jerarquico})`, 
          codigo: 'SUPERIOR_NIVEL_INVALIDO' 
        });
      }

      // Pre-registro: generar UID bootstrap
      let uid_firebase = `bootstrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const usuarioExiste = await consulta(
        'SELECT usuario_id, estado_usuario FROM usuarios WHERE correo_electronico = $1', 
        [email]
      );
      if (usuarioExiste.rows.length > 0) {
        uid_firebase = usuarioExiste.rows[0].usuario_id;
        // REACTIVAR: Si el usuario estaba suspendido/deleted, volver a activarlo
        if (usuarioExiste.rows[0].estado_usuario !== 'active') {
          await consulta(
            "UPDATE usuarios SET estado_usuario = 'active', sesion_revocada_en = NULL, auth_provider = 'bootstrap', ultimo_login = NOW() WHERE correo_electronico = $1",
            [email]
          );
        }
      } else {
        await consulta(
          `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [uid_firebase, email, nombre_completo || email.split('@')[0], 'bootstrap', 'active']
        );
      }

      // Verificar membresia activa existente
      const existeActiva = await consulta(
        'SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3',
        [uid_firebase, institucion_id, 'active']
      );
      if (existeActiva.rows.length > 0) {
        return res.status(409).json({ error: 'Ya tiene membresia activa', codigo: 'MEMBRESIA_EXISTENTE' });
      }

      // Validar capacidades delegables
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
            error: 'No puedes delegar capacidades que no posees', 
            codigo: 'DELEGACION_ILEGAL', 
            capacidades_ilegales: idsIlegales 
          });
        }
      }

      // No permitir delegar 'crear_usuarios' directamente
      const capCrear = await consulta("SELECT capacidad_id FROM capacidades WHERE codigo = 'crear_usuarios'");
      if (capacidades_ids?.includes(capCrear.rows[0]?.capacidad_id)) {
        return res.status(403).json({ 
          error: 'crear_usuarios no delegable directamente', 
          codigo: 'CREAR_USUARIOS_NO_DELEGABLE' 
        });
      }

      // Crear o reactivar membresia
      const membresiaExistente = await consulta(
        'SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2',
        [uid_firebase, institucion_id]
      );
      
      let nueva_membresia_id;
      
      if (membresiaExistente.rows.length > 0) {
        // Reactivar
        nueva_membresia_id = membresiaExistente.rows[0].membresia_id;
        await consulta(
          `UPDATE membresias SET 
            estado_membresia = 'active',
            tipo_rol = 'miembro',
            nombre_rol = $1,
            nivel = $2,
            padre_membresia_id = $3,
            puede_crear_hijos = $4,
            creado_por_usuario_id = $5,
            creado_por_membresia_id = $6
           WHERE membresia_id = $7`,
          [nombre_rol, nivel_jerarquico, superior_inmediato_id, puede_crear_hijos || false, creador_usuario_id, creador_membresia_id, nueva_membresia_id]
        );
        await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [nueva_membresia_id]);
        await consulta('DELETE FROM superiores_membresia WHERE subordinado_membresia_id = $1', [nueva_membresia_id]);
      } else {
        // Crear nueva
        const nuevaMembresia = await consulta(
          `INSERT INTO membresias (
            usuario_id, institucion_id, tipo_rol, nombre_rol, nivel,
            padre_membresia_id, puede_crear_hijos, creado_por_usuario_id,
            creado_por_membresia_id, estado_membresia, creado_en
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING membresia_id`,
          [
            uid_firebase, institucion_id, 'miembro', nombre_rol, nivel_jerarquico,
            superior_inmediato_id, puede_crear_hijos || false, creador_usuario_id,
            creador_membresia_id, 'active'
          ]
        );
        nueva_membresia_id = nuevaMembresia.rows[0].membresia_id;
      }

      // Registrar superior inmediato
      await consulta(
        `INSERT INTO superiores_membresia (superior_membresia_id, subordinado_membresia_id, tipo_vinculo, asignado_por_membresia_id)
         VALUES ($1, $2, 'directo', $3)`,
        [superior_inmediato_id, nueva_membresia_id, creador_membresia_id]
      );

      // Registrar superiores adicionales
      if (superiores_adicionales && superiores_adicionales.length > 0) {
        for (const sup_id of superiores_adicionales) {
          const supInfo = await consulta('SELECT nivel FROM membresias WHERE membresia_id = $1', [sup_id]);
          if (supInfo.rows.length > 0 && supInfo.rows[0].nivel < parseInt(nivel_jerarquico)) {
            await consulta(
              `INSERT INTO superiores_membresia (superior_membresia_id, subordinado_membresia_id, tipo_vinculo, asignado_por_membresia_id)
               VALUES ($1, $2, 'asignado', $3)
               ON CONFLICT DO NOTHING`,
              [sup_id, nueva_membresia_id, creador_membresia_id]
            );
          }
        }
      }

      // Asignar capacidades
      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => 
          `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`
        ).join(', ');
        const params = [
          nueva_membresia_id, 
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

      // Log
      await consulta(
        `INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json)
         VALUES ('crear_usuario', $1, $2, $3, $4, $5)`,
        [
          creador_membresia_id, creador_usuario_id, nueva_membresia_id, uid_firebase,
          JSON.stringify({
            nombre_rol, 
            nivel: nivel_jerarquico, 
            superior_inmediato_id,
            superiores_adicionales: superiores_adicionales || [],
            capacidades_ids: capacidades_ids || [],
            puede_crear_hijos: puede_crear_hijos || false,
            institucion_id
          })
        ]
      );

      res.status(201).json({ 
        exito: true, 
        mensaje: 'Usuario creado exitosamente', 
        membresia: { 
          membresia_id: nueva_membresia_id,
          usuario_id: uid_firebase,
          email,
          nombre_rol,
          nivel: nivel_jerarquico,
          superior_inmediato_id,
          puede_crear_hijos: puede_crear_hijos || false
        }
      });

    } catch (error) {
      console.error('Error crearUsuarioHijo:', error);
      res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO', detalle: error.message });
    }
  }


  async obtenerMisSubordinados(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      
      if (!membresia_id) {
        return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      }

      // Obtener mi nivel
      const miInfo = await consulta(
        'SELECT nivel FROM membresias WHERE membresia_id = $1',
        [membresia_id]
      );
      const miNivel = miInfo.rows[0]?.nivel;

      let resultado;
      
      if (miNivel === 0) {
        // SOY NIVEL 0: Ver TODOS los usuarios de la institucion incluyendome
        resultado = await consulta(
          `SELECT 
            m.membresia_id as sub_membresia_id,
            m.usuario_id as sub_usuario_id,
            m.nivel as sub_nivel,
            m.nombre_rol as sub_nombre_rol,
            m.estado_membresia as sub_estado,
            m.puede_crear_hijos as sub_puede_crear_hijos,
            u.correo_electronico as sub_correo,
            u.nombre_completo as sub_nombre_completo,
            'directo' as sub_tipo_vinculo
           FROM membresias m
           JOIN usuarios u ON m.usuario_id = u.usuario_id
           WHERE m.institucion_id = $1 AND m.estado_membresia = 'active'
           ORDER BY m.nivel, u.nombre_completo`,
          [institucion_id]
        );
      } else {
        // SOY NIVEL > 0: Ver solo mis subordinados
        resultado = await consulta(
          `SELECT * FROM obtener_subordinados_membresia($1)`,
          [membresia_id]
        );
      }

      // Obtener capacidades de cada uno
      const subordinadosConCapacidades = await Promise.all(
        resultado.rows.map(async (sub) => {
          const caps = await consulta(
            `SELECT c.capacidad_id, c.codigo, c.nombre, c.categoria 
             FROM membresia_capacidades mc 
             INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id 
             WHERE mc.membresia_id = $1`,
            [sub.sub_membresia_id]
          );
          return { ...sub, capacidades: caps.rows };
        })
      );

      res.json({ 
        exito: true, 
        total: subordinadosConCapacidades.length, 
        subordinados: subordinadosConCapacidades 
      });

    } catch (error) {
      console.error('Error obtenerMisSubordinados:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  async desactivarSubordinado(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);

      if (!creador_membresia_id) {
        return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      }

      // PROTECCION: No puedes desactivarte a ti mismo
      if (objetivo_membresia_id === creador_membresia_id) {
        return res.status(403).json({ error: 'No puedes desactivarte a ti mismo', codigo: 'AUTO_DESACTIVACION' });
      }

      // Verificar que es subordinado
      const esSubordinado = await consulta(
        `SELECT 1 FROM superiores_membresia 
         WHERE superior_membresia_id = $1 AND subordinado_membresia_id = $2`,
        [creador_membresia_id, objetivo_membresia_id]
      );
      if (esSubordinado.rows.length === 0) {
        return res.status(403).json({ error: 'No es tu subordinado', codigo: 'NO_ES_SUBORDINADO' });
      }

      const infoObjetivo = await consulta(
        'SELECT nivel, usuario_id FROM membresias WHERE membresia_id = $1',
        [objetivo_membresia_id]
      );
      
      // PROTECCION: No puedes desactivar nivel 0
      if (infoObjetivo.rows[0]?.nivel === 0) {
        return res.status(403).json({ error: 'No puedes desactivar nivel 0', codigo: 'PROTECCION_NIVEL_CERO' });
      }

      const objetivo_usuario_id = infoObjetivo.rows[0]?.usuario_id;

      // 1. Suspender membresia
      await consulta(
        "UPDATE membresias SET estado_membresia = 'suspended', padre_membresia_id = NULL WHERE membresia_id = $1",
        [objetivo_membresia_id]
      );

      // 2. Limpiar superiores
      await consulta(
        'DELETE FROM superiores_membresia WHERE subordinado_membresia_id = $1',
        [objetivo_membresia_id]
      );

      // 3. REVOCAR SESION: Suspender usuario y revocar token
      await consulta(
        "UPDATE usuarios SET estado_usuario = 'suspended', sesion_revocada_en = NOW() WHERE usuario_id = $1",
        [objetivo_usuario_id]
      );

      await consulta(
        `INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json)
         VALUES ('desactivar_usuario', $1, $2, $3, $4, $5)`,
        [
          creador_membresia_id, creador_usuario_id, objetivo_membresia_id,
          objetivo_usuario_id,
          JSON.stringify({ metodo: 'soft_delete', nivel_previo: infoObjetivo.rows[0]?.nivel, sesion_revocada: true })
        ]
      );

      res.json({ exito: true, mensaje: 'Usuario desactivado y sesion cerrada', membresia_id: objetivo_membresia_id });

    } catch (error) {
      console.error('Error desactivarSubordinado:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO', detalle: error.message });
    }
  }

  // ============================================
  // OBTENER ETIQUETAS DE CARGO FRECUENTES
  // ============================================

  async obtenerSuperiores(req, res) {
    try {
      const membresia_id = req.params.membresia_id;
      const resultado = await consulta(
        `SELECT * FROM obtener_superiores_membresia($1)`,
        [membresia_id]
      );
      res.json({ exito: true, superiores: resultado.rows });
    } catch (error) {
      console.error('Error obtenerSuperiores:', error);
      res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' });
    }
  }

  // ============================================
  // CREAR GRUPO COLABORATIVO
  // ============================================

}

module.exports = new JerarquiaUsuariosControlador();
