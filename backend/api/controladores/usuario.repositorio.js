const { consulta, transaccion } = require('../configuracion/base_de_datos');

class UsuarioRepositorio {

  async buscarPorCorreo(correo) {
    const result = await consulta(
      'SELECT * FROM usuarios WHERE correo_electronico = $1',
      [correo]
    );
    return result.rows[0] || null;
  }

  async verificarMembresia(usuarioId, institucionId) {
    const result = await consulta(
      'SELECT * FROM membresias WHERE usuario_id = $1 AND institucion_id = $2',
      [usuarioId, institucionId]
    );
    return result.rows[0] || null;
  }

  async crearMembresia(usuarioId, institucionId, tipoRol, invitadoPor) {
    await consulta(
      'INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())',
      [usuarioId, institucionId, tipoRol, 'active', invitadoPor]
    );
  }

  async crearUsuarioConMembresia(correo, nombre, tipoRol, institucionId, invitadoPor) {
    const uid_temp = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await transaccion([
      { sql: 'INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', parametros: [uid_temp, correo, nombre, 'manual', 'pending_verification'] },
      { sql: 'INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())', parametros: [uid_temp, institucionId, tipoRol, 'active', invitadoPor] }
    ]);
    return uid_temp;
  }

  async listarPorInstitucion(institucionId) {
    const result = await consulta(
      'SELECT u.usuario_id, u.correo_electronico, u.nombre_completo, u.estado_usuario, m.tipo_rol FROM usuarios u JOIN membresias m ON u.usuario_id = m.usuario_id WHERE m.institucion_id = $1',
      [institucionId]
    );
    return result.rows;
  }
}

module.exports = new UsuarioRepositorio();
