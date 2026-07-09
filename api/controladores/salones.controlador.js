const { consulta } = require('../configuracion/base_de_datos');

// ============================================
// LISTAR SALONES DE UNA INSTITUCION
// ============================================
async function listarSalones(req, res) {
  try {
    const { institucion_id } = req.query;
    const uid = req.usuario_autenticado.usuario_id;
    const membresiaId = req.contexto_institucion?.membresia_id;

    if (!institucion_id) {
      return res.status(400).json({ error: 'institucion_id requerido', codigo: 'FALTAN_DATOS' });
    }

    // Verificar que el usuario pertenece a la institucion
    const pertenece = await consulta(
      'SELECT 1 FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3',
      [uid, institucion_id, 'active']
    );

    if (pertenece.rows.length === 0 && req.usuario_autenticado.rol !== 'superadmin') {
      return res.status(403).json({ error: 'No perteneces a esta institucion', codigo: 'SIN_PERMITIDO' });
    }

    const salones = await consulta(`
      SELECT s.*, 
             (SELECT COUNT(*) FROM salon_usuarios su WHERE su.salon_id = s.salon_id) as total_usuarios,
             (SELECT COUNT(*) FROM salon_cursos sc WHERE sc.salon_id = s.salon_id) as total_cursos
      FROM salones s
      WHERE s.institucion_id = $1 AND s.estado_salon = 'active'
      ORDER BY s.creado_en DESC
    `, [institucion_id]);

    res.json({
      exito: true,
      datos: { salones: salones.rows }
    });
  } catch (error) {
    console.error('Listar salones error:', error);
    res.status(500).json({ error: 'Error listando salones', codigo: 'LISTA_ERROR' });
  }
}

// ============================================
// OBTENER UN SALON CON DETALLE
// ============================================
async function obtenerSalon(req, res) {
  try {
    const { salon_id } = req.params;
    const uid = req.usuario_autenticado.usuario_id;

    const salon = await consulta(`
      SELECT s.*, i.nombre_institucion
      FROM salones s
      JOIN instituciones i ON s.institucion_id = i.institucion_id
      WHERE s.salon_id = $1
    `, [salon_id]);

    if (salon.rows.length === 0) {
      return res.status(404).json({ error: 'Salon no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const salonData = salon.rows[0];

    // Verificar pertenencia
    const pertenece = await consulta(
      'SELECT 1 FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3',
      [uid, salonData.institucion_id, 'active']
    );

    if (pertenece.rows.length === 0 && req.usuario_autenticado.rol !== 'superadmin') {
      return res.status(403).json({ error: 'Sin permiso', codigo: 'SIN_PERMITIDO' });
    }

    // Usuarios del salon
    const usuarios = await consulta(`
      SELECT su.salon_usuario_id, su.rol_en_salon, su.asignado_en,
             m.membresia_id, m.nivel, m.nombre_rol,
             u.usuario_id, u.nombre_completo, u.correo_electronico
      FROM salon_usuarios su
      JOIN membresias m ON su.membresia_id = m.membresia_id
      JOIN usuarios u ON m.usuario_id = u.usuario_id
      WHERE su.salon_id = $1
      ORDER BY su.rol_en_salon, u.nombre_completo
    `, [salon_id]);

    // Cursos del salon
    const cursos = await consulta(`
      SELECT sc.salon_curso_id, sc.fecha_inicio, sc.fecha_fin, sc.estado_curso_salon,
             sc.curso_id
      FROM salon_cursos sc
      WHERE sc.salon_id = $1
      ORDER BY sc.asignado_en DESC
    `, [salon_id]);

    res.json({
      exito: true,
      datos: {
        salon: salonData,
        usuarios: usuarios.rows,
        cursos: cursos.rows
      }
    });
  } catch (error) {
    console.error('Obtener salon error:', error);
    res.status(500).json({ error: 'Error obteniendo salon', codigo: 'OBTENER_ERROR' });
  }
}

// ============================================
// CREAR SALON
// ============================================
async function crearSalon(req, res) {
  try {
    const { institucion_id, nombre_salon, descripcion } = req.body;
    const membresiaId = req.contexto_institucion?.membresia_id;

    if (!institucion_id || !nombre_salon) {
      return res.status(400).json({ error: 'institucion_id y nombre_salon requeridos', codigo: 'FALTAN_DATOS' });
    }

    const resultado = await consulta(
      `INSERT INTO salones (institucion_id, nombre_salon, descripcion, creado_por_membresia_id, estado_salon)
       VALUES ($1, $2, $3, $4, 'active') RETURNING salon_id`,
      [institucion_id, nombre_salon, descripcion || null, membresiaId]
    );

    res.json({
      exito: true,
      datos: { salon_id: resultado.rows[0].salon_id },
      mensaje: 'Salon creado correctamente'
    });
  } catch (error) {
    console.error('Crear salon error:', error);
    res.status(500).json({ error: 'Error creando salon', codigo: 'CREAR_ERROR' });
  }
}

// ============================================
// EDITAR SALON
// ============================================
async function editarSalon(req, res) {
  try {
    const { salon_id } = req.params;
    const { nombre_salon, descripcion, estado_salon } = req.body;

    const salon = await consulta('SELECT creado_por_membresia_id FROM salones WHERE salon_id = $1', [salon_id]);
    if (salon.rows.length === 0) {
      return res.status(404).json({ error: 'Salon no encontrado', codigo: 'NO_ENCONTRADO' });
    }

    const campos = [];
    const valores = [];
    let idx = 1;

    if (nombre_salon) { campos.push(`nombre_salon = $${idx++}`); valores.push(nombre_salon); }
    if (descripcion !== undefined) { campos.push(`descripcion = $${idx++}`); valores.push(descripcion); }
    if (estado_salon) { campos.push(`estado_salon = $${idx++}`); valores.push(estado_salon); }

    campos.push(`actualizado_en = NOW()`);
    valores.push(salon_id);

    await consulta(
      `UPDATE salones SET ${campos.join(', ')} WHERE salon_id = $${idx}`,
      valores
    );

    res.json({ exito: true, mensaje: 'Salon actualizado' });
  } catch (error) {
    console.error('Editar salon error:', error);
    res.status(500).json({ error: 'Error editando salon', codigo: 'EDITAR_ERROR' });
  }
}

// ============================================
// ELIMINAR SALON (soft)
// ============================================
async function eliminarSalon(req, res) {
  try {
    const { salon_id } = req.params;
    await consulta("UPDATE salones SET estado_salon = 'archived', actualizado_en = NOW() WHERE salon_id = $1", [salon_id]);
    res.json({ exito: true, mensaje: 'Salon archivado' });
  } catch (error) {
    console.error('Eliminar salon error:', error);
    res.status(500).json({ error: 'Error archivando salon', codigo: 'ELIMINAR_ERROR' });
  }
}

// ============================================
// ASIGNAR USUARIO A SALON
// ============================================
async function asignarUsuario(req, res) {
  try {
    const { salon_id } = req.params;
    const membresia_id = parseInt(req.body.membresia_id);
    const rol_en_salon = req.body.rol_en_salon || 'alumno';
    const asignadoPor = req.contexto_institucion?.membresia_id;

    await consulta(
      `INSERT INTO salon_usuarios (salon_id, membresia_id, rol_en_salon, asignado_por_membresia_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (salon_id, membresia_id) DO UPDATE SET rol_en_salon = $3, asignado_por_membresia_id = $4`,
      [salon_id, membresia_id, rol_en_salon, asignadoPor]
    );

    res.json({ exito: true, mensaje: 'Usuario asignado al salon' });
  } catch (error) {
    console.error('Asignar usuario error:', error);
    res.status(500).json({ error: 'Error asignando usuario', codigo: 'ASIGNAR_ERROR' });
  }
}

// ============================================
// QUITAR USUARIO DE SALON
// ============================================
async function quitarUsuario(req, res) {
  try {
    const { salon_id, membresia_id } = req.params;
    await consulta('DELETE FROM salon_usuarios WHERE salon_id = $1 AND membresia_id = $2', [salon_id, membresia_id]);
    res.json({ exito: true, mensaje: 'Usuario removido del salon' });
  } catch (error) {
    console.error('Quitar usuario error:', error);
    res.status(500).json({ error: 'Error removiendo usuario', codigo: 'QUITAR_ERROR' });
  }
}

// ============================================
// ASIGNAR CURSO A SALON
// ============================================
async function asignarCurso(req, res) {
  try {
    const { salon_id } = req.params;
    const curso_id = parseInt(req.body.curso_id);
    const { fecha_inicio, fecha_fin } = req.body;
    const asignadoPor = req.contexto_institucion?.membresia_id;

    await consulta(
      `INSERT INTO salon_cursos (salon_id, curso_id, asignado_por_membresia_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (salon_id, curso_id) DO NOTHING`,
      [salon_id, curso_id, asignadoPor, fecha_inicio || null, fecha_fin || null]
    );

    res.json({ exito: true, mensaje: 'Curso asignado al salon' });
  } catch (error) {
    console.error('Asignar curso error:', error);
    res.status(500).json({ error: 'Error asignando curso', codigo: 'ASIGNAR_ERROR' });
  }
}

// ============================================
// QUITAR CURSO DE SALON
// ============================================
async function quitarCurso(req, res) {
  try {
    const { salon_id, curso_id } = req.params;
    await consulta('DELETE FROM salon_cursos WHERE salon_id = $1 AND curso_id = $2', [salon_id, curso_id]);
    res.json({ exito: true, mensaje: 'Curso removido del salon' });
  } catch (error) {
    console.error('Quitar curso error:', error);
    res.status(500).json({ error: 'Error removiendo curso', codigo: 'QUITAR_ERROR' });
  }
}

module.exports = {
  listarSalones, obtenerSalon, crearSalon, editarSalon, eliminarSalon,
  asignarUsuario, quitarUsuario, asignarCurso, quitarCurso
};
