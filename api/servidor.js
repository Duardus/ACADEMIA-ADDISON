require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const { probarConexion } = require('./configuracion/base_de_datos');
const { iniciarFirebase } = require('./configuracion/firebase');

const rutasAuth = require('./rutas/auth.rutas');
const rutasUsuario = require('./rutas/usuario.rutas');
const rutasInstitucion = require('./rutas/institucion.rutas');
const rutasArbol = require('./rutas/arbol.rutas');
const rutasLiveKit = require('./rutas/livekit.rutas');
const rutasTeoria = require('./rutas/teoria.rutas');
const rutasMaterial = require('./rutas/material.rutas');
const rutasPregunta = require('./rutas/pregunta.rutas');
const rutasExamen = require('./rutas/examen.rutas');
const rutasIntento = require('./rutas/intento.rutas');
const rutasProgreso = require('./rutas/progreso.rutas');
const rutasGrabacion = require('./rutas/grabacion.rutas');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

app.get('/salud', (req, res) => {
  res.json({ estado: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', rutasAuth);
app.use('/api/v1/usuarios', rutasUsuario);
app.use('/api/v1/instituciones', rutasInstitucion);
app.use('/api/v1/arbol', rutasArbol);
app.use('/api/v1/livekit', rutasLiveKit);
app.use('/api/v1/grabaciones', rutasGrabacion);

app.use((error, req, res, next) => {
  console.error('ERROR:', error);
  res.status(error.status || 500).json({ error: error.message || 'Error interno', codigo: 'ERROR_DESCONOCIDO' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Recurso no encontrado', codigo: 'NO_ENCONTRADO' });
});

async function iniciar() {
  try {
    await probarConexion();
    console.log('✅ PostgreSQL conectado');
    iniciarFirebase();
    const puerto = process.env.PUERTO || 3000;
    app.listen(puerto, '0.0.0.0', () => {
      console.log('🚀 Servidor Addison v3.0 en puerto ' + puerto);
    });
  } catch (error) {
    console.error('❌ FATAL:', error.message);
    process.exit(1);
  }
}

iniciar();
