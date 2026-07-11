const { consulta, transaccion } = require('../configuracion/base_de_datos');

// ============================================
// LISTAR INSTITUCIONES (con paginacion)
// ============================================
async function listarInstituciones(req, res) {
  try {
    const uid = req.usuario_autenticado.usuario_id;
    const { pagina = 1, limite = 50 } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Superadmin ve TODAS, otros solo las suyas
    const esSuperadmin = req.usuario_autenticado.rol === 'superadmin';
    
    let query, params;
    if (esSuperadmin) {
      query = `
        SELECT i.*, 
               (SELECT COUNT(*) FROM membresias m WHERE m.institucion_id = i.institucion_id AND m.estado_membresia = 'active') as total_usuarios,
               u.nombre_completo as superadmin_nombre
        FROM instituciones i
        LEFT JOIN usuarios u ON i.superadmin_id = u.usuario_id
        WHERE i.institucion_status = 'active'
        ORDER BY i.creado_en DESC
        LIMIT $1 OFFSET $2
      `;
      params = [parseInt(limite), offset];
    } else {
      query = `
        SELECT i.*, 
               (SELECT COUNT(*) FROM membresias m WHERE m.institucion_id = i.institucion_id AND m.estado_membresia = 'active') as total_usuarios
        FROM instituciones i
        JOIN membresias m ON i.institucion_id = m.institucion_id
        WHERE m.usuario_id = $1 AND m.estado_membresia = 'active' AND i.institucion_status = 'active'
        ORDER BY i.creado_en DESC
        LIMIT $2 OFFSET $3
      `;
      params = [uid, parseInt(limite), offset];
    }

    const resultado = await consulta(query, params);
    res.json({ 
      exito: true, 
      datos: { 
        instituciones: resultado.rows,
        total: resultado.rows.length,
        pagina: parseInt(pagina)
      } 
    });
  } catch (error) {
    console.error('Listar instituciones error:', error);
    res.status(500).json({ error: 'Error listando instituciones', codigo: 'LISTA_ERROR' });
  }
}

// ============================================
// OBTENER UNA INSTITUCION POR ID
// ============================================
async function obtenerInstitucion(req, res) {
  try {
    const { institucion_id } = req.params;
    const resultado = await consulta(`
      SELECT i.*, u.nombre_completo as superadmin_nombre, u.correo_electronico as superadmin_correo
      FROM instituciones i
      LEFT JOIN usuarios u ON i.superadmin_id = u.usuario_id
      WHERE i.institucion_id = $1
    `, [institucion_id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ error: 'Institucion no encontrada', codigo: 'NO_ENCONTRADA' });
    }

    // Obtener usuarios de la institucion
    const usuarios = await consulta(`
      SELECT m.membresia_id, m.usuario_id, m.tipo_rol, m.nivel, m.nombre_rol, m.estado_membresia,
             u.nombre_completo, u.correo_electronico
      FROM membresias m
      JOIN usuarios u ON m.usuario_id = u.usuario_id
      WHERE m.institucion_id = $1 AND m.estado_membresia = 'active'
      ORDER BY m.nivel, u.nombre_completo
    `, [institucion_id]);

    res.json({
      exito: true,
      datos: {
        institucion: resultado.rows[0],
        usuarios: usuarios.rows
      }
    });
  } catch (error) {
    console.error('Obtener institucion error:', error);
    res.status(500).json({ error: 'Error obteniendo institucion', codigo: 'OBTENER_ERROR' });
  }
}

// ============================================
// CREAR INSTITUCION (superadmin only)
// ============================================
async function crearInstitucion(req, res) {
  try {
    const { nombre_institucion, pais_codigo, director_correo, director_nombre } = req.body;
    
    if (!nombre_institucion || !director_correo || !director_nombre) {
      return res.status(400).json({ 
        error: 'Nombre, correo y nombre del director requeridos', 
        codigo: 'DATOS_FALTANTES' 
      });
    }

    const slug = nombre_institucion.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 100);
    
    const correo = director_correo.toLowerCase().trim();
    const uid = req.usuario_autenticado.usuario_id;

    // Verificar que el slug no exista
    const existente = await consulta('SELECT 1 FROM instituciones WHERE institucion_slug = $1', [slug]);
    if (existente.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Ya existe una institucion con ese nombre', 
        codigo: 'SLUG_DUPLICADO' 
      });
    }

    // Crear institucion
    const resultado = await consulta(
      `INSERT INTO instituciones (nombre_institucion, institucion_slug, pais_codigo, superadmin_id, institucion_status, creado_en) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING institucion_id`,
      [nombre_institucion, slug, pais_codigo || 'PE', uid, 'active']
    );
    
    const institucion_id = resultado.rows[0].institucion_id;

    // Crear o reutilizar usuario director
    const usuarioExistente = await consulta(
      'SELECT usuario_id, estado_usuario FROM usuarios WHERE correo_electronico = $1', 
      [correo]
    );
    
    let dir_id;
    if (usuarioExistente.rows.length > 0) {
      dir_id = usuarioExistente.rows[0].usuario_id;
      // Reactivar si estaba suspendido
      if (usuarioExistente.rows[0].estado_usuario === 'suspended') {
        await consulta(
          "UPDATE usuarios SET estado_usuario = 'active' WHERE usuario_id = $1",
          [dir_id]
        );
      }
    } else {
      dir_id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      await consulta(
        `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [dir_id, correo, director_nombre, 'manual', 'pending_verification']
      );
    }

    // Crear membresia nivel 1 para el director
    await consulta(
      `INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, nombre_rol, nivel, puede_crear_hijos, estado_membresia, invitado_por, creado_en) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [dir_id, institucion_id, 'director', 'Director', 1, true, 'active', uid]
    );

    res.json({ 
      exito: true,
      tipo: 'institucion_creada', 
      institucion_id, 
      director_id: dir_id,
      mensaje: 'Institucion y director creados correctamente'
    });
  } catch (error) {
    console.error('Crear institucion error:', error);
    res.status(500).json({ error: 'Error creando institucion', codigo: 'INSTITUCION_ERROR' });
  }
}

// ============================================
// EDITAR INSTITUCION
// ============================================
async function editarInstitucion(req, res) {
  try {
    const { institucion_id } = req.params;
    const { nombre_institucion, pais_codigo, institucion_status } = req.body;
    const uid = req.usuario_autenticado.usuario_id;

    // Verificar que existe
    const existente = await consulta(
      'SELECT superadmin_id FROM instituciones WHERE institucion_id = $1',
      [institucion_id]
    );
    
    if (existente.rows.length === 0) {
      return res.status(404).json({ error: 'Institucion no encontrada', codigo: 'NO_ENCONTRADA' });
    }

    // Solo superadmin o el creador pueden editar
    if (req.usuario_autenticado.rol !== 'superadmin' && existente.rows[0].superadmin_id !== uid) {
      return res.status(403).json({ error: 'Sin permiso para editar', codigo: 'SIN_PERMISO' });
    }

    const campos = [];
    const valores = [];
    let idx = 1;

    if (nombre_institucion) {
      campos.push(`nombre_institucion = $${idx++}`);
      valores.push(nombre_institucion);
      // Actualizar slug
      const nuevoSlug = nombre_institucion.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 100);
      campos.push(`institucion_slug = $${idx++}`);
      valores.push(nuevoSlug);
    }
    
    if (pais_codigo) {
      campos.push(`pais_codigo = $${idx++}`);
      valores.push(pais_codigo);
    }
    
    if (institucion_status) {
      campos.push(`institucion_status = $${idx++}`);
      valores.push(institucion_status);
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: 'Nada que actualizar', codigo: 'SIN_CAMBIOS' });
    }

    campos.push(`actualizado_en = NOW()`);
    valores.push(institucion_id);

    await consulta(
      `UPDATE instituciones SET ${campos.join(', ')} WHERE institucion_id = $${idx}`,
      valores
    );

    res.json({ 
      exito: true,
      mensaje: 'Institucion actualizada correctamente',
      institucion_id
    });
  } catch (error) {
    console.error('Editar institucion error:', error);
    res.status(500).json({ error: 'Error editando institucion', codigo: 'EDITAR_ERROR' });
  }
}

// ============================================
// ELIMINAR (soft delete) INSTITUCION
// ============================================
async function eliminarInstitucion(req, res) {
  try {
    const { institucion_id } = req.params;
    const uid = req.usuario_autenticado.usuario_id;

    const existente = await consulta(
      'SELECT superadmin_id FROM instituciones WHERE institucion_id = $1',
      [institucion_id]
    );
    
    if (existente.rows.length === 0) {
      return res.status(404).json({ error: 'Institucion no encontrada', codigo: 'NO_ENCONTRADA' });
    }

    if (req.usuario_autenticado.rol !== 'superadmin' && existente.rows[0].superadmin_id !== uid) {
      return res.status(403).json({ error: 'Sin permiso', codigo: 'SIN_PERMISO' });
    }

    await consulta(
      "UPDATE instituciones SET institucion_status = 'closed', actualizado_en = NOW() WHERE institucion_id = $1",
      [institucion_id]
    );

    res.json({ 
      exito: true,
      mensaje: 'Institucion cerrada correctamente',
      institucion_id
    });
  } catch (error) {
    console.error('Eliminar institucion error:', error);
    res.status(500).json({ error: 'Error cerrando institucion', codigo: 'ELIMINAR_ERROR' });
  }
}

module.exports = { 
  listarInstituciones, 
  obtenerInstitucion,
  crearInstitucion, 
  editarInstitucion,
  eliminarInstitucion
};
