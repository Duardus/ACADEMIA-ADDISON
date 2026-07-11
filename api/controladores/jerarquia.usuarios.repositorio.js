const { consulta, transaccion } = require('../configuracion/base_de_datos');

class JerarquiaUsuariosRepositorio {

  // --- Validaciones de permisos ---
  async verificarCapacidadCrearUsuarios(membresiaId) {
    const result = await consulta(
      `SELECT 1 FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`,
      [membresiaId]
    );
    return result.rows.length > 0;
  }

  async obtenerInfoCreador(membresiaId) {
    const result = await consulta(
      'SELECT puede_crear_hijos, nivel FROM membresias WHERE membresia_id = $1',
      [membresiaId]
    );
    return result.rows[0] || null;
  }

  async obtenerInfoSuperior(membresiaId, institucionId) {
    const result = await consulta(
      'SELECT nivel, estado_membresia FROM membresias WHERE membresia_id = $1 AND institucion_id = $2',
      [membresiaId, institucionId]
    );
    return result.rows[0] || null;
  }

  // --- Gestión de usuarios ---
  async buscarUsuarioPorCorreo(email) {
    const result = await consulta(
      'SELECT usuario_id, estado_usuario FROM usuarios WHERE correo_electronico = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async crearUsuarioBootstrap(uid, email, nombreCompleto) {
    await consulta(
      `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uid, email, nombreCompleto || email.split('@')[0], 'bootstrap', 'active']
    );
  }

  async reactivarUsuario(email) {
    await consulta(
      `UPDATE usuarios SET estado_usuario = 'active', sesion_revocada_en = NULL,
       auth_provider = 'bootstrap', ultimo_login = NOW() WHERE correo_electronico = $1`,
      [email]
    );
  }

  async reactivarUsuarioPorId(usuarioId) {
    await consulta(
      "UPDATE usuarios SET estado_usuario = 'active' WHERE usuario_id = $1",
      [usuarioId]
    );
  }

  async actualizarCamposUsuario(usuarioId, campos) {
    const updates = [];
    const values = [];
    let idx = 1;
    
    if (campos.carrera_interes !== undefined) { updates.push(`carrera_interes = $${idx++}`); values.push(campos.carrera_interes); }
    if (campos.cursos_enseña !== undefined) { updates.push(`cursos_enseña = $${idx++}`); values.push(campos.cursos_enseña); }
    if (campos.nivel_academico !== undefined) { updates.push(`nivel_academico = $${idx++}`); values.push(campos.nivel_academico); }
    if (campos.numero_celular !== undefined) { updates.push(`numero_celular = $${idx++}`); values.push(campos.numero_celular); }
    if (campos.fecha_nacimiento !== undefined) { updates.push(`fecha_nacimiento = $${idx++}`); values.push(campos.fecha_nacimiento); }
    if (campos.direccion !== undefined) { updates.push(`direccion = $${idx++}`); values.push(campos.direccion); }
    if (campos.distrito !== undefined) { updates.push(`distrito = $${idx++}`); values.push(campos.distrito); }
    if (campos.observaciones !== undefined) { updates.push(`observaciones = $${idx++}`); values.push(campos.observaciones); }
    if (campos.etiquetas !== undefined) { updates.push(`etiquetas = $${idx++}`); values.push(campos.etiquetas); }
    if (campos.campos_dinamicos !== undefined) { updates.push(`campos_dinamicos = $${idx++}`); values.push(campos.campos_dinamicos); }
    
    if (updates.length === 0) return;
    
    values.push(usuarioId);
    await consulta(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE usuario_id = $${idx}`,
      values
    );
  }

  // --- Salones ---
  async asignarSalonUsuario(salonId, membresiaId, asignadoPorId, rolEnSalon) {
    await consulta(
      `INSERT INTO salon_usuarios (salon_id, membresia_id, asignado_por_membresia_id, rol_en_salon)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (salon_id, membresia_id) DO UPDATE SET rol_en_salon = $4, asignado_por_membresia_id = $3`,
      [salonId, membresiaId, asignadoPorId, rolEnSalon]
    );
  }

  async obtenerSalonesSubordinado(usuarioId, institucionId) {
    const result = await consulta(
      `SELECT s.salon_id, s.nombre_salon, su.rol_en_salon
       FROM salones s
       JOIN salon_usuarios su ON s.salon_id = su.salon_id
       JOIN membresias m ON su.membresia_id = m.membresia_id
       WHERE m.usuario_id = $1 AND s.institucion_id = $2 AND s.estado_salon != 'archived'`,
      [usuarioId, institucionId]
    );
    return result.rows;
  }

  async eliminarSalonesUsuario(usuarioId) {
    await consulta(
      `DELETE FROM salon_usuarios WHERE membresia_id IN (
         SELECT membresia_id FROM membresias WHERE usuario_id = $1
       )`,
      [usuarioId]
    );
  }

  // --- Gestión de membresías ---
  async buscarMembresiaActiva(usuarioId, institucionId) {
    const result = await consulta(
      'SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3',
      [usuarioId, institucionId, 'active']
    );
    return result.rows[0] || null;
  }

  async buscarMembresiaPorUsuarioInstitucion(usuarioId, institucionId) {
    const result = await consulta(
      'SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2',
      [usuarioId, institucionId]
    );
    return result.rows[0] || null;
  }

  async crearMembresia(datos) {
    const result = await consulta(
      `INSERT INTO membresias (
        usuario_id, institucion_id, tipo_rol, nombre_rol, nivel,
        padre_membresia_id, puede_crear_hijos, creado_por_usuario_id,
        creado_por_membresia_id, estado_membresia, creado_en
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING membresia_id`,
      [
        datos.usuario_id, datos.institucion_id, datos.tipo_rol, datos.nombre_rol,
        datos.nivel, datos.padre_membresia_id, datos.puede_crear_hijos,
        datos.creado_por_usuario_id, datos.creado_por_membresia_id, datos.estado_membresia
      ]
    );
    return result.rows[0].membresia_id;
  }

  async reactivarMembresia(membresiaId, datos) {
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
      [
        datos.nombre_rol, datos.nivel, datos.padre_membresia_id,
        datos.puede_crear_hijos, datos.creado_por_usuario_id,
        datos.creado_por_membresia_id, membresiaId
      ]
    );
  }

  async limpiarCapacidadesMembresia(membresiaId) {
    await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [membresiaId]);
  }

  async limpiarSuperioresSubordinado(membresiaId) {
    await consulta('DELETE FROM superiores_membresia WHERE subordinado_membresia_id = $1', [membresiaId]);
  }

  // ============================================
  // ELIMINACIÓN PERMANENTE - CASCADA COMPLETA
  // ============================================
  async eliminarUsuarioCompleto(usuarioId, membresiaId) {
    const client = await require('../configuracion/base_de_datos').pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. TABLAS HIJAS DE MEMBRESIAS (eliminar primero)
      await client.query('DELETE FROM membresia_capacidades WHERE membresia_id = $1 OR asignado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM suscripciones WHERE membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM salon_usuarios WHERE membresia_id = $1 OR asignado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM miembros_grupo_colaborativo WHERE miembro_membresia_id = $1 OR agregado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM superiores_membresia WHERE superior_membresia_id = $1 OR subordinado_membresia_id = $1 OR asignado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM etiquetas_cargo WHERE creado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM grupos_colaborativos WHERE creador_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM salones WHERE creado_por_membresia_id = $1', [membresiaId]);
      await client.query('DELETE FROM salon_cursos WHERE asignado_por_membresia_id = $1', [membresiaId]);

      // 2. MEMBRESIAS HIJAS (subordinados) - recursivo
      await this._eliminarSubordinadosRecursivo(client, membresiaId);

      // 3. TABLAS HIJAS DE USUARIOS
      await client.query('DELETE FROM asistencia_clases WHERE alumno_id = $1 OR profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM calificaciones_clase WHERE alumno_id = $1', [usuarioId]);
      await client.query('DELETE FROM calificaciones_dificultad WHERE alumno_id = $1', [usuarioId]);
      await client.query('DELETE FROM examenes WHERE profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM grabaciones WHERE profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM horario_semanal WHERE profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM intentos_examen WHERE alumno_id = $1', [usuarioId]);
      await client.query('DELETE FROM notificaciones WHERE usuario_id = $1', [usuarioId]);
      await client.query('DELETE FROM pagos_alumnos WHERE alumno_id = $1', [usuarioId]);
      await client.query('DELETE FROM pagos_historial WHERE usuario_id = $1', [usuarioId]);
      await client.query('DELETE FROM pagos_profesores WHERE profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM papelera WHERE eliminado_por = $1', [usuarioId]);
      await client.query('DELETE FROM preguntas WHERE profesor_id = $1', [usuarioId]);
      await client.query('DELETE FROM progreso_alumno WHERE alumno_id = $1', [usuarioId]);
      await client.query('DELETE FROM usuarios_campos_valores WHERE usuario_id = $1', [usuarioId]);

      // 4. Eliminar membresía objetivo
      await client.query('DELETE FROM membresias WHERE membresia_id = $1', [membresiaId]);

      // 5. Verificar si usuario tiene otras membresías
      const otras = await client.query('SELECT COUNT(*) as total FROM membresias WHERE usuario_id = $1', [usuarioId]);
      
      // Solo eliminar usuario si no tiene más membresías
      if (parseInt(otras.rows[0].total) === 0) {
        await client.query('DELETE FROM usuarios WHERE usuario_id = $1', [usuarioId]);
      }

      await client.query('COMMIT');
      return { eliminado: true, usuario_completo: parseInt(otras.rows[0].total) === 0 };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Método auxiliar recursivo para eliminar subordinados
  async _eliminarSubordinadosRecursivo(client, padreMembresiaId) {
    const subordinados = await client.query(
      `SELECT m.membresia_id, m.usuario_id 
       FROM membresias m
       JOIN superiores_membresia sm ON m.membresia_id = sm.subordinado_membresia_id
       WHERE sm.superior_membresia_id = $1`,
      [padreMembresiaId]
    );

    for (const sub of subordinados.rows) {
      // Primero eliminar sub-subordinados
      await this._eliminarSubordinadosRecursivo(client, sub.membresia_id);

      const mid = sub.membresia_id;
      const uid = sub.usuario_id;

      // Limpiar tablas hijas de esta membresía
      await client.query('DELETE FROM membresia_capacidades WHERE membresia_id = $1 OR asignado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM suscripciones WHERE membresia_id = $1', [mid]);
      await client.query('DELETE FROM salon_usuarios WHERE membresia_id = $1 OR asignado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM miembros_grupo_colaborativo WHERE miembro_membresia_id = $1 OR agregado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM superiores_membresia WHERE superior_membresia_id = $1 OR subordinado_membresia_id = $1 OR asignado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM etiquetas_cargo WHERE creado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM grupos_colaborativos WHERE creador_membresia_id = $1', [mid]);
      await client.query('DELETE FROM salones WHERE creado_por_membresia_id = $1', [mid]);
      await client.query('DELETE FROM salon_cursos WHERE asignado_por_membresia_id = $1', [mid]);

      // Limpiar tablas hijas del usuario
      await client.query('DELETE FROM asistencia_clases WHERE alumno_id = $1 OR profesor_id = $1', [uid]);
      await client.query('DELETE FROM calificaciones_clase WHERE alumno_id = $1', [uid]);
      await client.query('DELETE FROM calificaciones_dificultad WHERE alumno_id = $1', [uid]);
      await client.query('DELETE FROM examenes WHERE profesor_id = $1', [uid]);
      await client.query('DELETE FROM grabaciones WHERE profesor_id = $1', [uid]);
      await client.query('DELETE FROM horario_semanal WHERE profesor_id = $1', [uid]);
      await client.query('DELETE FROM intentos_examen WHERE alumno_id = $1', [uid]);
      await client.query('DELETE FROM notificaciones WHERE usuario_id = $1', [uid]);
      await client.query('DELETE FROM pagos_alumnos WHERE alumno_id = $1', [uid]);
      await client.query('DELETE FROM pagos_historial WHERE usuario_id = $1', [uid]);
      await client.query('DELETE FROM pagos_profesores WHERE profesor_id = $1', [uid]);
      await client.query('DELETE FROM papelera WHERE eliminado_por = $1', [uid]);
      await client.query('DELETE FROM preguntas WHERE profesor_id = $1', [uid]);
      await client.query('DELETE FROM progreso_alumno WHERE alumno_id = $1', [uid]);
      await client.query('DELETE FROM usuarios_campos_valores WHERE usuario_id = $1', [uid]);

      // Eliminar membresía
      await client.query('DELETE FROM membresias WHERE membresia_id = $1', [mid]);

      // Verificar si quedan más membresías
      const otras = await client.query('SELECT COUNT(*) as total FROM membresias WHERE usuario_id = $1', [uid]);
      if (parseInt(otras.rows[0].total) === 0) {
        await client.query('DELETE FROM usuarios WHERE usuario_id = $1', [uid]);
      }
    }
  }

  // --- Métodos antiguos (mantener compatibilidad) ---
  async eliminarMembresia(membresiaId) {
    await consulta('DELETE FROM membresias WHERE membresia_id = $1', [membresiaId]);
  }

  async eliminarUsuario(usuarioId) {
    await consulta('DELETE FROM pagos_alumnos WHERE alumno_id = $1', [usuarioId]);
    await consulta('DELETE FROM pagos_profesores WHERE profesor_id = $1', [usuarioId]);
    await consulta('DELETE FROM progreso_alumno WHERE alumno_id = $1', [usuarioId]);
    await consulta('DELETE FROM notificaciones WHERE usuario_id = $1', [usuarioId]);
    await consulta('DELETE FROM membresia_capacidades WHERE membresia_id IN (SELECT membresia_id FROM membresias WHERE usuario_id = $1)', [usuarioId]);
    await consulta('DELETE FROM superiores_membresia WHERE superior_membresia_id IN (SELECT membresia_id FROM membresias WHERE usuario_id = $1) OR subordinado_membresia_id IN (SELECT membresia_id FROM membresias WHERE usuario_id = $1)', [usuarioId]);
    await consulta('DELETE FROM membresias WHERE usuario_id = $1', [usuarioId]);
    await consulta('DELETE FROM usuarios WHERE usuario_id = $1', [usuarioId]);
  }

  // --- Capacidades ---
  async obtenerCapacidadesDelegables(membresiaId, capacidadesIds) {
    const result = await consulta(
      `SELECT c.capacidad_id FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`,
      [membresiaId, capacidadesIds]
    );
    return result.rows.map(r => r.capacidad_id);
  }

  async obtenerCapacidadCrearUsuarios() {
    const result = await consulta("SELECT capacidad_id FROM capacidades WHERE codigo = 'crear_usuarios'");
    return result.rows[0]?.capacidad_id || null;
  }

  async asignarCapacidades(membresiaId, capacidadesIds, creadorMembresiaId, creadorUsuarioId, creadorNivel) {
    if (!capacidadesIds || capacidadesIds.length === 0) return;

    const values = capacidadesIds.map((_, idx) =>
      `($1, $${idx + 2}, $${idx + 2 + capacidadesIds.length}, $${idx + 2 + 2 * capacidadesIds.length}, $${idx + 2 + 3 * capacidadesIds.length})`
    ).join(', ');

    const params = [
      membresiaId,
      ...capacidadesIds,
      ...capacidadesIds.map(() => creadorMembresiaId),
      ...capacidadesIds.map(() => creadorUsuarioId),
      ...capacidadesIds.map(() => creadorNivel)
    ];

    await consulta(
      `INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion)
       VALUES ${values}`,
      params
    );
  }

  // --- Superiores ---
  async registrarSuperiorInmediato(superiorId, subordinadoId, asignadoPorId) {
    await consulta(
      `INSERT INTO superiores_membresia (superior_membresia_id, subordinado_membresia_id, tipo_vinculo, asignado_por_membresia_id)
       VALUES ($1, $2, 'directo', $3)`,
      [superiorId, subordinadoId, asignadoPorId]
    );
  }

  async registrarSuperiorAdicional(superiorId, subordinadoId, asignadoPorId) {
    await consulta(
      `INSERT INTO superiores_membresia (superior_membresia_id, subordinado_membresia_id, tipo_vinculo, asignado_por_membresia_id)
       VALUES ($1, $2, 'asignado', $3)
       ON CONFLICT DO NOTHING`,
      [superiorId, subordinadoId, asignadoPorId]
    );
  }

  async obtenerNivelSuperior(membresiaId) {
    const result = await consulta('SELECT nivel FROM membresias WHERE membresia_id = $1', [membresiaId]);
    return result.rows[0]?.nivel ?? null;
  }

  // --- Subordinados ---
  
  // SUPERADMIN: Todos los usuarios de TODAS las instituciones
  async obtenerTodosSubordinadosTodasInstituciones() {
    const result = await consulta(
      `SELECT
        m.membresia_id as sub_membresia_id,
        m.usuario_id as sub_usuario_id,
        m.nivel as sub_nivel,
        m.nombre_rol as sub_nombre_rol,
        m.estado_membresia as sub_estado,
        m.puede_crear_hijos as sub_puede_crear_hijos,
        m.institucion_id as sub_institucion_id,
        u.correo_electronico as sub_correo,
        u.nombre_completo as sub_nombre_completo,
        u.avatar_url as sub_avatar_url,
        u.numero_celular as sub_celular,
        u.carrera_interes as sub_carrera,
        u.nivel_academico as sub_nivel_academico,
        u.observaciones as sub_observaciones,
        u.creado_en as sub_creado_en,
        i.nombre_institucion as sub_institucion_nombre,
        'directo' as sub_tipo_vinculo,
        (SELECT string_agg(s.nombre_salon, ', ' ORDER BY s.nombre_salon)
         FROM salones s
         JOIN salon_usuarios su ON s.salon_id = su.salon_id
         WHERE su.membresia_id = m.membresia_id
        ) as sub_salones
       FROM membresias m
       JOIN usuarios u ON m.usuario_id = u.usuario_id
       LEFT JOIN instituciones i ON m.institucion_id = i.institucion_id
       ORDER BY m.institucion_id, m.nivel, u.nombre_completo`
    );
    return result.rows;
  }

  // NO-SUPERADMIN: Solo usuarios de SU institución
  async obtenerTodosSubordinadosInstitucion(institucionId) {
    const result = await consulta(
      `SELECT
        m.membresia_id as sub_membresia_id,
        m.usuario_id as sub_usuario_id,
        m.nivel as sub_nivel,
        m.nombre_rol as sub_nombre_rol,
        m.estado_membresia as sub_estado,
        m.puede_crear_hijos as sub_puede_crear_hijos,
        m.institucion_id as sub_institucion_id,
        u.correo_electronico as sub_correo,
        u.nombre_completo as sub_nombre_completo,
        u.avatar_url as sub_avatar_url,
        u.numero_celular as sub_celular,
        u.carrera_interes as sub_carrera,
        u.nivel_academico as sub_nivel_academico,
        u.observaciones as sub_observaciones,
        u.creado_en as sub_creado_en,
        i.nombre_institucion as sub_institucion_nombre,
        'directo' as sub_tipo_vinculo,
        (SELECT string_agg(s.nombre_salon, ', ' ORDER BY s.nombre_salon)
         FROM salones s
         JOIN salon_usuarios su ON s.salon_id = su.salon_id
         WHERE su.membresia_id = m.membresia_id
        ) as sub_salones
       FROM membresias m
       JOIN usuarios u ON m.usuario_id = u.usuario_id
       LEFT JOIN instituciones i ON m.institucion_id = i.institucion_id
       WHERE m.institucion_id = $1
       ORDER BY m.nivel, u.nombre_completo`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerSubordinadosPorMembresia(membresiaId) {
    const result = await consulta(
      'SELECT * FROM obtener_subordinados_membresia($1)',
      [membresiaId]
    );
    return result.rows;
  }

  async obtenerCapacidadesSubordinado(membresiaId) {
    const result = await consulta(
      `SELECT c.capacidad_id, c.codigo, c.nombre, c.categoria
       FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1`,
      [membresiaId]
    );
    return result.rows;
  }

  // --- Desactivación ---
  async esSubordinadoDirecto(superiorId, subordinadoId) {
    const result = await consulta(
      `SELECT 1 FROM superiores_membresia
       WHERE superior_membresia_id = $1 AND subordinado_membresia_id = $2`,
      [superiorId, subordinadoId]
    );
    return result.rows.length > 0;
  }

  async obtenerInfoMembresia(membresiaId) {
    const result = await consulta(
      'SELECT nivel, usuario_id, nombre_rol, puede_crear_hijos, padre_membresia_id FROM membresias WHERE membresia_id = $1',
      [membresiaId]
    );
    return result.rows[0] || null;
  }

  async suspenderMembresia(membresiaId) {
    await consulta(
      "UPDATE membresias SET estado_membresia = 'suspended', padre_membresia_id = NULL WHERE membresia_id = $1",
      [membresiaId]
    );
  }

  async suspenderUsuario(usuarioId) {
    await consulta(
      "UPDATE usuarios SET estado_usuario = 'suspended', sesion_revocada_en = NOW() WHERE usuario_id = $1",
      [usuarioId]
    );
  }

  // --- Superiores (wrapper) ---
  async obtenerSuperioresMembresia(membresiaId) {
    const result = await consulta(
      'SELECT * FROM obtener_superiores_membresia($1)',
      [membresiaId]
    );
    return result.rows;
  }

  // --- SUSCRIPCIONES ---
  async crearSuscripcion(datos) {
    const result = await consulta(
      `INSERT INTO suscripciones (
        membresia_id, usuario_id, institucion_id, tipo_plan, duracion_dias,
        monto_pagado, moneda, fecha_inicio, fecha_vencimiento, fecha_pago,
        estado_suscripcion, comprobante_url, comprobante_tipo, notas_pago,
        creado_por_membresia_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING suscripcion_id`,
      [
        datos.membresia_id, datos.usuario_id, datos.institucion_id,
        datos.tipo_plan, datos.duracion_dias, datos.monto_pagado, datos.moneda,
        datos.fecha_inicio, datos.fecha_vencimiento, datos.fecha_pago,
        datos.estado_suscripcion, datos.comprobante_url, datos.comprobante_tipo,
        datos.notas_pago, datos.creado_por_membresia_id
      ]
    );
    return result.rows[0].suscripcion_id;
  }

  async obtenerSuscripcionActiva(membresiaId) {
    const result = await consulta(
      `SELECT * FROM suscripciones 
       WHERE membresia_id = $1 AND estado_suscripcion = 'activa'
       ORDER BY fecha_vencimiento DESC LIMIT 1`,
      [membresiaId]
    );
    return result.rows[0] || null;
  }

  async obtenerDiasRestantes(membresiaId) {
    const result = await consulta(
      'SELECT dias_restantes_suscripcion($1) as dias',
      [membresiaId]
    );
    return result.rows[0]?.dias || 0;
  }

  // --- CAMPOS DINÁMICOS (Notion-style) ---
  async crearCampoDinamico(institucionId, campoNombre, campoTipo, opciones, requerido) {
    const result = await consulta(
      `INSERT INTO usuarios_campos_dinamicos (institucion_id, campo_nombre, campo_tipo, campo_opciones, requerido)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (institucion_id, campo_nombre) DO UPDATE SET
         campo_tipo = $3, campo_opciones = $4, requerido = $5
       RETURNING campo_id`,
      [institucionId, campoNombre, campoTipo, JSON.stringify(opciones || []), requerido || false]
    );
    return result.rows[0].campo_id;
  }

  async obtenerCamposDinamicos(institucionId) {
    const result = await consulta(
      `SELECT * FROM usuarios_campos_dinamicos 
       WHERE institucion_id = $1 ORDER BY campo_orden, campo_nombre`,
      [institucionId]
    );
    return result.rows;
  }

  async obtenerValoresCamposDinamicos(usuarioId) {
    const result = await consulta(
      `SELECT c.campo_nombre, c.campo_tipo, v.valor_texto, v.valor_numero, v.valor_fecha, v.valor_json
       FROM usuarios_campos_valores v
       JOIN usuarios_campos_dinamicos c ON v.campo_id = c.campo_id
       WHERE v.usuario_id = $1`,
      [usuarioId]
    );
    return result.rows;
  }

  // --- PAGOS ---
  async registrarPago(datos) {
    const result = await consulta(
      `INSERT INTO pagos_historial (
        suscripcion_id, usuario_id, institucion_id, monto, moneda,
        concepto, metodo_pago, comprobante_url, comprobante_tipo,
        fecha_pago, periodo_desde, periodo_hasta, registrado_por_membresia_id, notas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING pago_id`,
      [
        datos.suscripcion_id, datos.usuario_id, datos.institucion_id,
        datos.monto, datos.moneda, datos.concepto, datos.metodo_pago,
        datos.comprobante_url, datos.comprobante_tipo, datos.fecha_pago,
        datos.periodo_desde, datos.periodo_hasta, datos.registrado_por_membresia_id, datos.notas
      ]
    );
    return result.rows[0].pago_id;
  }

  async obtenerPagosUsuario(usuarioId) {
    const result = await consulta(
      `SELECT * FROM pagos_historial WHERE usuario_id = $1 ORDER BY fecha_pago DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  async obtenerTotalPagosInstitucion(institucionId) {
    const result = await consulta(
      `SELECT COALESCE(SUM(monto), 0) as total FROM pagos_historial WHERE institucion_id = $1`,
      [institucionId]
    );
    return result.rows[0].total;
  }

  // --- Logging ---
  async registrarLog(accion, actorMembresiaId, actorUsuarioId, objetivoMembresiaId, objetivoUsuarioId, detalle) {
    await consulta(
      `INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [accion, actorMembresiaId, actorUsuarioId, objetivoMembresiaId, objetivoUsuarioId, JSON.stringify(detalle)]
    );
  }
}

module.exports = new JerarquiaUsuariosRepositorio();
