const { consulta } = require('../configuracion/base_de_datos');

class PermisosRepositorio {

  // ============================================
  // OBTENER: Qué cursos puede ver un usuario según su nivel y salones
  // ============================================
  async obtenerCursosPermitidos(usuarioId, institucionId, nivel) {
    // NIVEL 0: Superadmin - ve TODO
    if (nivel === 0) {
      const result = await consulta(
        `SELECT curso_id, nombre_curso, descripcion, orden, estado 
         FROM cursos 
         WHERE institucion_id = $1 AND estado != 'archived' 
         ORDER BY orden, curso_id`,
        [institucionId]
      );
      return result.rows;
    }

    // NIVEL 1+: Ve solo los cursos de sus salones asignados
    const result = await consulta(
      `SELECT DISTINCT c.curso_id, c.nombre_curso, c.descripcion, c.orden, c.estado
       FROM cursos c
       JOIN salon_cursos sc ON c.curso_id = sc.curso_id
       JOIN salon_usuarios su ON sc.salon_id = su.salon_id
       JOIN membresias m ON su.membresia_id = m.membresia_id
       WHERE c.institucion_id = $1 
         AND c.estado != 'archived'
         AND m.usuario_id = $2
         AND m.estado_membresia = 'active'
       ORDER BY c.orden, c.curso_id`,
      [institucionId, usuarioId]
    );
    return result.rows;
  }

  // ============================================
  // OBTENER: Qué temas puede ver (de los cursos permitidos)
  // ============================================
  async obtenerTemasPermitidos(usuarioId, institucionId, nivel) {
    if (nivel === 0) {
      const result = await consulta(
        `SELECT t.tema_id, t.curso_id, t.nombre_tema, t.orden, t.estado 
         FROM temas t 
         JOIN cursos c ON t.curso_id = c.curso_id 
         WHERE c.institucion_id = $1 AND t.estado != 'archived' AND c.estado != 'archived' 
         ORDER BY t.orden, t.tema_id`,
        [institucionId]
      );
      return result.rows;
    }

    const result = await consulta(
      `SELECT DISTINCT t.tema_id, t.curso_id, t.nombre_tema, t.orden, t.estado
       FROM temas t
       JOIN cursos c ON t.curso_id = c.curso_id
       JOIN salon_cursos sc ON c.curso_id = sc.curso_id
       JOIN salon_usuarios su ON sc.salon_id = su.salon_id
       JOIN membresias m ON su.membresia_id = m.membresia_id
       WHERE c.institucion_id = $1 
         AND t.estado != 'archived'
         AND c.estado != 'archived'
         AND m.usuario_id = $2
         AND m.estado_membresia = 'active'
       ORDER BY t.orden, t.tema_id`,
      [institucionId, usuarioId]
    );
    return result.rows;
  }

  // ============================================
  // OBTENER: Qué subtemas puede ver
  // ============================================
  async obtenerSubtemasPermitidos(usuarioId, institucionId, nivel) {
    if (nivel === 0) {
      const result = await consulta(
        `SELECT s.subtema_id, s.tema_id, s.nombre_subtema, s.orden, s.estado 
         FROM subtemas s 
         JOIN temas t ON s.tema_id = t.tema_id 
         JOIN cursos c ON t.curso_id = c.curso_id 
         WHERE c.institucion_id = $1 AND s.estado != 'archived' AND t.estado != 'archived' AND c.estado != 'archived' 
         ORDER BY s.orden, s.subtema_id`,
        [institucionId]
      );
      return result.rows;
    }

    const result = await consulta(
      `SELECT DISTINCT s.subtema_id, s.tema_id, s.nombre_subtema, s.orden, s.estado
       FROM subtemas s
       JOIN temas t ON s.tema_id = t.tema_id
       JOIN cursos c ON t.curso_id = c.curso_id
       JOIN salon_cursos sc ON c.curso_id = sc.curso_id
       JOIN salon_usuarios su ON sc.salon_id = su.salon_id
       JOIN membresias m ON su.membresia_id = m.membresia_id
       WHERE c.institucion_id = $1 
         AND s.estado != 'archived'
         AND t.estado != 'archived'
         AND c.estado != 'archived'
         AND m.usuario_id = $2
         AND m.estado_membresia = 'active'
       ORDER BY s.orden, s.subtema_id`,
      [institucionId, usuarioId]
    );
    return result.rows;
  }

  // ============================================
  // VERIFICAR: Si un usuario puede crear subordinados
  // ============================================
  async puedeCrearSubordinados(membresiaId) {
    const result = await consulta(
      `SELECT puede_crear_hijos, nivel FROM membresias WHERE membresia_id = $1`,
      [membresiaId]
    );
    if (result.rows.length === 0) return false;
    const m = result.rows[0];
    return m.puede_crear_hijos === true || m.nivel === 0;
  }

  // ============================================
  // OBTENER: Subordinados de un usuario (los que él creó)
  // ============================================
  async obtenerSubordinados(creadorMembresiaId) {
    const result = await consulta(
      `SELECT m.membresia_id, m.usuario_id, u.nombre, u.email, 
              m.nivel, m.nombre_rol, m.estado_membresia, m.puede_crear_hijos,
              m.creado_en
       FROM membresias m
       JOIN usuarios u ON m.usuario_id = u.usuario_id
       WHERE m.creado_por_membresia_id = $1
       ORDER BY m.nivel, u.nombre`,
      [creadorMembresiaId]
    );
    return result.rows;
  }

  // ============================================
  // OBTENER: Salones de un usuario
  // ============================================
  async obtenerSalonesUsuario(usuarioId, institucionId) {
    const result = await consulta(
      `SELECT s.salon_id, s.nombre_salon, s.descripcion, su.rol_en_salon
       FROM salones s
       JOIN salon_usuarios su ON s.salon_id = su.salon_id
       JOIN membresias m ON su.membresia_id = m.membresia_id
       WHERE s.institucion_id = $1 
         AND s.estado_salon != 'archived'
         AND m.usuario_id = $2
         AND m.estado_membresia = 'active'`,
      [institucionId, usuarioId]
    );
    return result.rows;
  }
}

module.exports = new PermisosRepositorio();
