const cors = require('cors');
const opcionesCORS = {
  origin: function (origin, callback) {
    const permitidos = [
      'https://academia-addison.pages.dev',
      'http://localhost:3000',
      'http://localhost:5500',
      'http://localhost:8080'
    ];
    if (!origin || permitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
};
module.exports = cors(opcionesCORS);
