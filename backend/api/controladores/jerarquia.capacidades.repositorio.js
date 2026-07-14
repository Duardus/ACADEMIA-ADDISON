const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaCapacidadesRepositorio {

  async obtenerCapacidadesDelegables(membresiaId) {
    const result = await consulta(
      `SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria, c.es_delegable, c.es_crear_usuarios
       FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1 AND c.es_delegable = true AND c.es_crear_usuarios = false
       ORDER BY c.categoria, c.nombre`,
      [membresiaId]
    );
    return result.rows;
  }

  async obtenerPuedeCrearHijos(membresiaId) {
    const result = await consulta(
      'SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1',
      [membresiaId]
    );
    return result.rows[0]?.puede_crear_hijos || false;
  }

  async esSubordinadoDirecto(superiorId, subordinadoId) {
    const result = await consulta(
      `SELECT 1 FROM superiores_membresia
       WHERE superior_membresia_id = $1 AND subordinado_membresia_id = $2`,
      [superiorId, subordinadoId]
    );
    return result.rows.length > 0;
  }

  async obtenerNiveles(membresiaIds) {
    const result = await consulta(
      'SELECT membresia_id, nivel FROM membresias WHERE membresia_id = ANY($1::int[])',
      [membresiaIds]
    );
    const mapa = {};
    result.rows.forEach(r => { mapa[r.membresia_id] = r.nivel; });
    return mapa;
  }

  async obtenerCapacidadesDelCreador(membresiaId, capacidadesIds) {
    const result = await consulta(
      `SELECT c.capacidad_id FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`,
      [membresiaId, capacidadesIds]
    );
    return result.rows.map(r => r.capacidad_id);
  }

  async obtenerNivelMembresia(membresiaId) {
    const result = await consulta(
      'SELECT nivel FROM membresias WHERE membresia_id = $1',
      [membresiaId]
    );
    return result.rows[0]?.nivel ?? null;
  }

  async limpiarCapacidadesSubordinado(membresiaId) {
    await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [membresiaId]);
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

  async actualizarPuedeCrearHijos(membresiaId, puedeCrear) {
    await consulta(
      'UPDATE membresias SET puede_crear_hijos = $1 WHERE membresia_id = $2',
      [puedeCrear, membresiaId]
    );
  }

  async obtenerEtiquetasFrecuentes(institucionId) {
    const result = await consulta(
      `SELECT nombre_etiqueta, usos_count FROM etiquetas_cargo
       WHERE institucion_id = $1
       ORDER BY usos_count DESC, ultimo_uso DESC
       LIMIT 20`,
      [institucionId]
    );
    return result.rows;
  }

  async registrarLog(accion, actorMembresiaId, actorUsuarioId, objetivoMembresiaId, detalle) {
    await consulta(
      `INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, detalle_json)
       VALUES ($1, $2, $3, $4, $5)`,
      [accion, actorMembresiaId, actorUsuarioId, objetivoMembresiaId, JSON.stringify(detalle)]
    );
  }
}

module.exports = new JerarquiaCapacidadesRepositorio();
