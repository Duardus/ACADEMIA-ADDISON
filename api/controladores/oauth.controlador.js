const { verificarTokenFirebase } = require('../config/firebase');
const authServicio = require('../servicios/auth.servicio');
const { respuestaError } = require('../utilidades/respuesta');

async function loginGoogleDirecto(req, res, next) {
  try {
    const { id_token } = req.body;
    
    if (!id_token) {
      return res.status(400).json(respuestaError('id_token de Google requerido', 400));
    }

    // Verificar token con Firebase Admin
    const resultado = await verificarTokenFirebase(id_token);
    
    if (!resultado.valido) {
      return res.status(401).json(respuestaError('Token invalido: ' + resultado.error, 401));
    }

    // Login con el servicio
    const datos = await authServicio.loginConFirebase(id_token);
    res.status(200).json(datos);
  } catch (err) {
    next(err);
  }
}

module.exports = { loginGoogleDirecto };
