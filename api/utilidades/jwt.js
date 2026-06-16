const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'academia-addison-secret-v3-dev';
function generarToken(datos) { return jwt.sign(datos, SECRET, { expiresIn: '24h' }); }
function verificarToken(token) { return jwt.verify(token, SECRET); }
module.exports = { generarToken, verificarToken };
