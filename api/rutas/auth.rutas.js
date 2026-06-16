const express = require('express');
const router = express.Router();
const { login, seleccionarContexto, switchContext } = require('../controladores/auth.controlador');
const { verificarToken } = require('../utilidades/jwt');

function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verificarToken(token);
    req.usuario_id = payload.usuario_id;
    req.membresia_id = payload.membresia_id;
    req.institucion_id = payload.institucion_id;
    req.tipo_rol = payload.tipo_rol;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

router.post('/login', login);
router.post('/seleccionar-contexto', seleccionarContexto);
router.post('/switch-context', autenticar, switchContext);

module.exports = router;
