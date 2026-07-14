// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Repositorio de Usuarios
// ═══════════════════════════════════════════════════════════════════════════

const { query } = require('../config/database');
const { RepositorioBase } = require('./base.repositorio');

const COLUMNAS_USUARIO = [
  'id', 'uid_firebase', 'email', 'nombre', 'foto_url', 'rol',
  'institucion_id', 'activo', 'creado_en', 'actualizado_en'
];

class UsuarioRepositorio extends RepositorioBase {
  constructor() {
    super('usuarios', COLUMNAS_USUARIO);
  }

  async obtenerPorUid(uidFirebase) {
    const sql = `SELECT * FROM usuarios WHERE uid_firebase = $1 LIMIT 1`;
    const resultado = await query(sql, [uidFirebase]);
    return resultado.rows[0] || null;
  }

  async obtenerPorEmail(email) {
    const sql = `SELECT * FROM usuarios WHERE email = $1 LIMIT 1`;
    const resultado = await query(sql, [email]);
    return resultado.rows[0] || null;
  }

  async crearDesdeFirebase(datosFirebase) {
    const sql = `
      INSERT INTO usuarios (uid_firebase, email, nombre, foto_url, rol, activo)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (uid_firebase) DO UPDATE SET
        email = EXCLUDED.email,
        nombre = EXCLUDED.nombre,
        foto_url = EXCLUDED.foto_url,
        actualizado_en = NOW()
      RETURNING *
    `;
    const valores = [
      datosFirebase.uid,
      datosFirebase.email,
      datosFirebase.nombre || null,
      datosFirebase.foto || null,
      datosFirebase.rol || 'estudiante',
      true
    ];
    const resultado = await query(sql, valores);
    return resultado.rows[0];
  }

  async actualizarRol(id, nuevoRol) {
    const sql = `UPDATE usuarios SET rol = $1, actualizado_en = NOW() WHERE id = $2 RETURNING *`;
    const resultado = await query(sql, [nuevoRol, id]);
    return resultado.rows[0] || null;
  }

  async listarPorInstitucion(institucionId, limite = 100, offset = 0) {
    const sql = `
      SELECT * FROM usuarios 
      WHERE institucion_id = $1 
      ORDER BY creado_en DESC 
      LIMIT $2 OFFSET $3
    `;
    return await query(sql, [institucionId, limite, offset]);
  }
}

module.exports = new UsuarioRepositorio();
