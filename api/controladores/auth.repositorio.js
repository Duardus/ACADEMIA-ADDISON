const { consulta } = require('../configuracion/base_de_datos');

class AuthRepositorio {
  async buscarUsuarioPorCorreo(correo) {
    const result = await consulta(
      `SELECT * FROM usuarios WHERE correo_electronico = $1 
       ORDER BY CASE WHEN auth_provider = 'firebase' THEN 0 ELSE 1 END, creado_en DESC`,
      [correo]
    );
    return result.rows[0] || null;
  }

  async migrarUsuarioBootstrap(uid, correo) {
    await consulta(
      'UPDATE usuarios SET usuario_id = $1, auth_provider = $2, ultimo_login = NOW() WHERE correo_electronico = $3',
      [uid, 'firebase', correo]
    );
  }

  async actualizarUltimoLogin(correo) {
    await consulta(
      'UPDATE usuarios SET ultimo_login = NOW() WHERE correo_electronico = $1',
      [correo]
    );
  }

  async crearUsuario(uid, correo, nombre) {
    await consulta(
      `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en, ultimo_login)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [uid, correo, nombre, 'firebase', 'active']
    );
  }

  async obtenerMembresiasActivas(usuarioId) {
    const result = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, 
              m.nivel, m.nombre_rol, i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.usuario_id = $1 AND m.estado_membresia = 'active'`,
      [usuarioId]
    );
    return result.rows;
  }

  async obtenerMembresiasSuspendidas(usuarioId) {
    const result = await consulta(
      'SELECT 1 FROM membresias WHERE usuario_id = $1 AND estado_membresia = $2',
      [usuarioId, 'suspended']
    );
    return result.rows.length > 0;
  }

  async obtenerMembresiaPorId(membresiaId, usuarioId) {
    const result = await consulta(
      `SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, 
              m.nivel, m.nombre_rol, i.nombre_institucion, i.institucion_slug 
       FROM membresias m 
       JOIN instituciones i ON m.institucion_id = i.institucion_id 
       WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = 'active'`,
      [membresiaId, usuarioId]
    );
    return result.rows[0] || null;
  }
}

module.exports = new AuthRepositorio();
