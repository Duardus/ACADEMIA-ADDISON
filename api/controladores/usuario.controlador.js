const { consulta, transaccion } = require('../configuracion/base_de_datos');

async function crearUsuario(req, res) {
  try {
    const ctx = req.contexto_institucion;
    if (!ctx) {
      return res.status(500).json({ error: 'Sin contexto de institucion', codigo: 'SIN_CONTEXTO' });
    }

    const { correo_electronico, nombre_completo, tipo_rol } = req.body;
    if (!correo_electronico || !nombre_completo || !tipo_rol) {
      return res.status(400).json({ error: 'Correo, nombre y rol requeridos', codigo: 'DATOS_FALTANTES' });
    }

    const correo = correo_electronico.toLowerCase().trim();
    
    // Verificar si usuario ya existe
    const existente = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
    
    if (existente.rows.length > 0) {
      const u = existente.rows[0];
      const membresia = await consulta('SELECT * FROM membresias WHERE usuario_id = $1 AND institucion_id = $2', [u.usuario_id, ctx.institucion_id]);
      if (membresia.rows.length > 0) {
        return res.status(400).json({ error: 'Usuario ya en esta institucion', codigo: 'MEMBRESIA_EXISTENTE' });
      }
      await consulta('INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', [u.usuario_id, ctx.institucion_id, tipo_rol, 'active', ctx.usuario_id]);
      return res.json({ tipo: 'asignacion_directa', usuario_id: u.usuario_id });
    }

    // Crear nuevo usuario con transaccion
    const uid_temp = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await transaccion([
      { sql: 'INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', parametros: [uid_temp, correo, nombre_completo, 'manual', 'pending_verification'] },
      { sql: 'INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', parametros: [uid_temp, ctx.institucion_id, tipo_rol, 'active', ctx.usuario_id] }
    ]);
    
    res.json({ tipo: 'usuario_nuevo', usuario_id: uid_temp });
  } catch (error) {
    console.error('Error creando usuario:', error.message);
    res.status(500).json({ error: 'Error creando usuario: ' + error.message, codigo: 'USUARIO_ERROR' });
  }
}

async function listarUsuarios(req, res) {
  try {
    const ctx = req.contexto_institucion;
    if (!ctx) {
      return res.status(500).json({ error: 'Sin contexto', codigo: 'SIN_CONTEXTO' });
    }
    const usuarios = await consulta('SELECT u.usuario_id, u.correo_electronico, u.nombre_completo, u.estado_usuario, m.tipo_rol FROM usuarios u JOIN membresias m ON u.usuario_id = m.usuario_id WHERE m.institucion_id = $1', [ctx.institucion_id]);
    res.json({ usuarios: usuarios.rows });
  } catch (error) {
    console.error('Error listando usuarios:', error.message);
    res.status(500).json({ error: 'Error listando usuarios', codigo: 'LISTA_ERROR' });
  }
}

module.exports = { crearUsuario, listarUsuarios };
