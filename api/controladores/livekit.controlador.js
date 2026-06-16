const { AccessToken } = require('livekit-server-sdk');

function generarTokenSala(req, res) {
  try {
    const { nombre_sala, rol_sala } = req.body;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const token = new AccessToken(apiKey, apiSecret, {
      identity: req.usuario_autenticado.usuario_id,
      name: req.usuario_autenticado.nombre
    });
    token.addGrant({
      roomJoin: true,
      room: nombre_sala,
      canPublish: rol_sala !== 'observer',
      canSubscribe: true,
      canPublishData: rol_sala !== 'observer',
      hidden: rol_sala === 'observer'
    });
    res.json({
      token: token.toJwt(),
      url: process.env.LIVEKIT_URL_PUBLICO,
      sala: nombre_sala
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generando token', codigo: 'LIVEKIT_ERROR' });
  }
}

module.exports = { generarTokenSala };
