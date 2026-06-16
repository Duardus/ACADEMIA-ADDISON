const jwt = require('jsonwebtoken');

const SECRETO = process.env.SECRETO_JWT || 'clave-secreta-cambiar';
const EXPIRACION_DEFINITIVO = '24h';
const EXPIRACION_PRELIMINAR = '5m';

function crearTokenPreliminar(datosUsuario) {
  return jwt.sign({
    tipo: 'preliminar',
    usuario_id: datosUsuario.usuario_id,
    correo: datosUsuario.correo,
    nombre: datosUsuario.nombre
  }, SECRETO, { expiresIn: EXPIRACION_PRELIMINAR });
}

function crearTokenDefinitivo(datosUsuario, membresia) {
  return jwt.sign({
    tipo: 'definitivo',
    usuario_id: datosUsuario.usuario_id,
    correo: datosUsuario.correo,
    nombre: datosUsuario.nombre,
    membresia_id: membresia.membresia_id,
    institucion_id: membresia.institucion_id,
    tipo_rol: membresia.tipo_rol,
    estado_membresia: membresia.estado_membresia
  }, SECRETO, { expiresIn: EXPIRACION_DEFINITIVO });
}

function verificarToken(token) {
  return jwt.verify(token, SECRETO);
}

module.exports = {
  crearTokenPreliminar,
  crearTokenDefinitivo,
  verificarToken
};
