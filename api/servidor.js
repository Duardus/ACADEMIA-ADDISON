require("dotenv").config();
const express = require("express");
const app = express();
app.set("trust proxy", 1);

app.use(express.json());

// ============================================
// 🌐 CORS - Cross-Origin Resource Sharing
// ============================================
const cors = require("cors");
const opcionesCORS = {
  origin: function (origin, callback) {
    const permitidos = [
      "https://academia-addison.pages.dev",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://localhost:8080"
    ];
    if (!origin || permitidos.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Origen no permitido por CORS: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400
};
app.use(cors(opcionesCORS));

// ============================================
// 📝 Middleware de logging
// ============================================
const { logger } = require("./utilidades/logger");
app.use((req, res, next) => {
  const inicio = Date.now();
  logger.request(req);
  res.on("finish", () => {
    const duracion = Date.now() - inicio;
    logger.response(req, res, duracion);
  });
  next();
});

// ============================================
// 💓 Salud
// ============================================
app.get("/api/v1/salud", (req, res) => {
  res.json({ estado: "ok", version: "3.0.2", timestamp: new Date().toISOString() });
});

// ============================================
// 🔀 Rutas
// ============================================
const rutasAuth = require("./rutas/auth.rutas");
const rutasUsuario = require("./rutas/usuario.rutas");
const rutasInstitucion = require("./rutas/institucion.rutas");
const rutasSalones = require("./rutas/salones.rutas");
const rutasArbol = require("./rutas/arbol.rutas");
const rutasPermisos = require("./rutas/permisos.rutas");
const rutasLivekit = require("./rutas/livekit.rutas");
const rutasGrabacion = require("./rutas/grabacion.rutas");
const rutasTeoria = require("./rutas/teoria.rutas");
const rutasMaterial = require("./rutas/material.rutas");
const rutasPregunta = require("./rutas/pregunta.rutas");
const rutasExamen = require("./rutas/examen.rutas");
const rutasIntento = require("./rutas/intento.rutas");
const rutasProgreso = require("./rutas/progreso.rutas");
const rutasJerarquia = require("./rutas/jerarquia.rutas");
const rutasDocs = require("./rutas/docs.rutas");

app.use("/api/v1/auth", rutasAuth);
app.use("/api/v1/usuarios", rutasUsuario);
app.use("/api/v1/instituciones", rutasInstitucion);
app.use("/api/v1/salones", rutasSalones);
app.use("/api/v1/arbol", rutasArbol);
app.use("/api/v1/permisos", rutasPermisos);
app.use("/api/v1/livekit", rutasLivekit);
app.use("/api/v1/grabaciones", rutasGrabacion);
app.use("/api/v1/teorias", rutasTeoria);
app.use("/api/v1/materiales", rutasMaterial);
app.use("/api/v1/preguntas", rutasPregunta);
app.use("/api/v1/examenes", rutasExamen);
app.use("/api/v1/intentos", rutasIntento);
app.use("/api/v1/progreso", rutasProgreso);
app.use("/api/v1/jerarquia", rutasJerarquia);
app.use("/api/v1/docs", rutasDocs);

// ============================================
// 💓 Heartbeat - Verificacion de sesion
// ============================================
const { middlewareAutenticar } = require("./middleware/autenticar");
app.get("/api/v1/sesion/verificar", middlewareAutenticar, (req, res) => {
  res.json({
    estado: "ok",
    usuario_id: req.usuario_autenticado.usuario_id,
    correo: req.usuario_autenticado.correo,
    rol: req.usuario_autenticado.tipo_rol || req.usuario_autenticado.rol || "estudiante",
    nombre: req.usuario_autenticado.nombre || req.usuario_autenticado.nombre_completo || "Usuario",
    membresia_id: req.usuario_autenticado.membresia_id,
    institucion_id: req.usuario_autenticado.institucion_id,
    nivel: req.usuario_autenticado.nivel || 99,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ❌ 404
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada", ruta: req.path });
});

// ============================================
// 🚨 Manejadores de error (SIEMPRE AL FINAL)
// ============================================
const {
  manejarErroresOperacionales,
  manejarErroresPostgres,
  manejarErroresFirebase,
  manejarErroresGenerales
} = require("./middleware/manejar_errores");

app.use(manejarErroresOperacionales);
app.use(manejarErroresPostgres);
app.use(manejarErroresFirebase);
app.use(manejarErroresGenerales);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Addison v3.0.2 en puerto ${PORT}`);
});

module.exports = app;
