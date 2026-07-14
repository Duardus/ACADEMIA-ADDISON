// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio de Passkeys
// ═══════════════════════════════════════════════════════════════════════════

const { consulta } = require('../configuracion/base_de_datos');

class PasskeyRepositorio {
  
  async buscarUsuarioPorCorreo(correo) {
    const result = await consulta(
      `SELECT * FROM usuarios WHERE correo_electronico = $1 LIMIT 1`,
      [correo]
    );
    return result.rows[0] || null;
  }

  async crearUsuario(correo, nombre) {
    const result = await consulta(
      `INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, passkey_registrado, creado_en)
       VALUES (gen_random_uuid(), $1, $2, 'passkey', 'por_activar', false, NOW())
       RETURNING *`,
      [correo, nombre]
    );
    return result.rows[0];
  }

  async actualizarPasskeyRegistrado(usuarioId) {
    await consulta(
      `UPDATE usuarios SET passkey_registrado = true, estado_usuario = 'active', ultimo_login = NOW() WHERE usuario_id = $1`,
      [usuarioId]
    );
  }

  async guardarPasskey(usuarioId, credentialId, publicKey, nombreDispositivo, tipoDispositivo) {
    const result = await consulta(
      `INSERT INTO passkeys (usuario_id, credential_id, public_key, nombre_dispositivo, tipo_dispositivo, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [usuarioId, credentialId, publicKey, nombreDispositivo, tipoDispositivo]
    );
    return result.rows[0];
  }

  async buscarPasskeyPorCredentialId(credentialId) {
    const result = await consulta(
      `SELECT p.*, u.* FROM passkeys p
       JOIN usuarios u ON p.usuario_id = u.usuario_id
       WHERE p.credential_id = $1 AND p.revocado = false
       LIMIT 1`,
      [credentialId]
    );
    return result.rows[0] || null;
  }

  async actualizarSignCount(credentialId, newSignCount) {
    await consulta(
      `UPDATE passkeys SET sign_count = $1, ultimo_uso = NOW() WHERE credential_id = $2`,
      [newSignCount, credentialId]
    );
  }

  async listarPasskeysPorUsuario(usuarioId) {
    const result = await consulta(
      `SELECT id, nombre_dispositivo, tipo_dispositivo, creado_en, ultimo_uso, revocado
       FROM passkeys WHERE usuario_id = $1 ORDER BY creado_en DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  async revocarPasskey(id, usuarioId) {
    await consulta(
      `UPDATE passkeys SET revocado = true WHERE id = $1 AND usuario_id = $2`,
      [id, usuarioId]
    );
  }

  async guardarMagicLink(usuarioId, tokenHash, expiraEn) {
    const result = await consulta(
      `INSERT INTO magic_links (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3) RETURNING *`,
      [usuarioId, tokenHash, expiraEn]
    );
    return result.rows[0];
  }

  async buscarMagicLink(tokenHash) {
    const result = await consulta(
      `SELECT m.*, u.* FROM magic_links m
       JOIN usuarios u ON m.usuario_id = u.usuario_id
       WHERE m.token_hash = $1 AND m.usado = false AND m.expira_en > NOW()
       LIMIT 1`,
      [tokenHash]
    );
    return result.rows[0] || null;
  }

  async marcarMagicLinkUsado(id) {
    await consulta(`UPDATE magic_links SET usado = true WHERE id = $1`, [id]);
  }

  async guardarSesion(usuarioId, refreshTokenHash, dispositivo, navegador, ipAddress, expiraEn) {
    const result = await consulta(
      `INSERT INTO sesiones_passkey (usuario_id, refresh_token_hash, dispositivo, navegador, ip_address, expira_en)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuarioId, refreshTokenHash, dispositivo, navegador, ipAddress, expiraEn]
    );
    return result.rows[0];
  }

  async buscarSesionPorRefreshToken(refreshTokenHash) {
    const result = await consulta(
      `SELECT s.*, u.* FROM sesiones_passkey s
       JOIN usuarios u ON s.usuario_id = u.usuario_id
       WHERE s.refresh_token_hash = $1 AND s.activa = true AND s.expira_en > NOW()
       LIMIT 1`,
      [refreshTokenHash]
    );
    return result.rows[0] || null;
  }

  async revocarSesion(refreshTokenHash) {
    await consulta(
      `UPDATE sesiones_passkey SET activa = false WHERE refresh_token_hash = $1`,
      [refreshTokenHash]
    );
  }

  async actualizarUltimoLogin(correo) {
    await consulta(
      `UPDATE usuarios SET ultimo_login = NOW() WHERE correo_electronico = $1`,
      [correo]
    );
  }
}

module.exports = new PasskeyRepositorio();
