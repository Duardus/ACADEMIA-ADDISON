const authServicio = require('./auth.servicio');
const respuesta = require('../utilidades/respuesta');

async function login(req, res, next) {
  const { token_firebase } = req.body;
  const resultado = await authServicio.login(token_firebase);
  respuesta.exito(res, resultado, 'Login exitoso');
}

async function seleccionarContexto(req, res, next) {
  const { token_preliminar, membresia_id } = req.body;
  const resultado = await authServicio.seleccionarContexto(token_preliminar, membresia_id);
  respuesta.exito(res, resultado, 'Contexto seleccionado');
}

async function switchContext(req, res, next) {
  const { membresia_id } = req.body;
  const resultado = await authServicio.switchContext(req.usuario_id, membresia_id);
  respuesta.exito(res, resultado, 'Contexto cambiado');
}

module.exports = { login, seleccionarContexto, switchContext };
