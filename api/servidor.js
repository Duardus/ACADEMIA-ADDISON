require("dotenv").config();
const express = require('express');
const cors = require('cors');
const app = express();
app.set('trust proxy', 1);

app.use(cors({ 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Salud
app.get('/api/v1/salud', (req, res) => {
  res.json({ estado: 'ok', version: '3.0.0', timestamp: new Date().toISOString() });
});

// Rutas
const rutasAuth = require('./rutas/auth.rutas');
const rutasUsuario = require('./rutas/usuario.rutas');
const rutasInstitucion = require('./rutas/institucion.rutas');
const rutasArbol = require('./rutas/arbol.rutas');
const rutasLivekit = require('./rutas/livekit.rutas');
const rutasGrabacion = require('./rutas/grabacion.rutas');
const rutasTeoria = require('./rutas/teoria.rutas');
const rutasMaterial = require('./rutas/material.rutas');
const rutasPregunta = require('./rutas/pregunta.rutas');
const rutasExamen = require('./rutas/examen.rutas');
const rutasIntento = require('./rutas/intento.rutas');
const rutasProgreso = require('./rutas/progreso.rutas');

app.use('/api/v1/auth', rutasAuth);
app.use('/api/v1/usuarios', rutasUsuario);
app.use('/api/v1/instituciones', rutasInstitucion);
app.use('/api/v1/arbol', rutasArbol);
app.use('/api/v1/livekit', rutasLivekit);
app.use('/api/v1/grabaciones', rutasGrabacion);
app.use('/api/v1/teorias', rutasTeoria);
app.use('/api/v1/materiales', rutasMaterial);
app.use('/api/v1/preguntas', rutasPregunta);
app.use('/api/v1/examenes', rutasExamen);
app.use('/api/v1/intentos', rutasIntento);
app.use('/api/v1/progreso', rutasProgreso);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', ruta: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

const PORT = 3000;
app.listen(PORT, () => console.log('Servidor activo en puerto ' + PORT));
