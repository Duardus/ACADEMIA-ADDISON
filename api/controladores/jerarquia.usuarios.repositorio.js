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
  async obtenerTodosSubordinadosInstitucion(institucionId) {
    const result = await consulta(
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
      'SELECT nivel, usuario_id FROM membresias WHERE membresia_id = $1',
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
