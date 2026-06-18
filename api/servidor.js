require("dotenv").config();
const express = require('express');
const app = express();
app.set('trust proxy', 1);

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
const rutasJerarquia = require('./rutas/jerarquia.rutas');

app.use('/api/v1/auth', rutasAuth);
app.use('/api/auth', rutasAuth);
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
app.use('/api/v1/jerarquia', rutasJerarquia);
app.use('/api/jerarquia', rutasJerarquia);

// Endpoint para verificar sesión (heartbeat)
const { middlewareAutenticar } = require('./middleware/autenticar');
app.get('/api/v1/sesion/verificar', middlewareAutenticar, (req, res) => {
  res.json({ 
    estado: 'ok', 
    usuario_id: req.usuario_autenticado.usuario_id,
    correo: req.usuario_autenticado.correo,
    timestamp: new Date().toISOString() 
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', ruta: req.path });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Addison v3.0 en puerto ${PORT}`);
});

module.exports = app;
