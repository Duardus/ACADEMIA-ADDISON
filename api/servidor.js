require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { probarConexion } = require('./config/database');
const { configurarRutas } = require('./rutas');
const { manejadorErrores, rutaNoEncontrada } = require('./middlewares/manejador_errores');

const app = express();
const PUERTO = process.env.PORT || 3000;

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['https://academia-addison.pages.dev', 'https://academia-addison.duckdns.org', '*'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check RAIZ (antes de rutas)
app.get('/health', (req, res) => {
  res.status(200).json({
    exito: true,
    mensaje: 'ACADEMIA-ADDISON API saludable',
    version: '3.0.0-phoenix',
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development',
  });
});

// Rutas API
configurarRutas(app);

// 404 y errores
app.use(rutaNoEncontrada);
app.use(manejadorErrores);

async function iniciarServidor() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        ACADEMIA-ADDISON API v3.0.0-phoenix                      ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  const bdOk = await probarConexion();
  if (!bdOk) {
    console.log('║  ⚠️  PostgreSQL no responde                                   ║');
  }
  app.listen(PUERTO, '0.0.0.0', () => {
    console.log('║  🚀 Servidor escuchando en puerto:', PUERTO);
    console.log('║  📡 CORS origin:', process.env.CORS_ORIGIN || '*');
    console.log('║  🔧 Ambiente:', process.env.NODE_ENV || 'development');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

process.on('SIGTERM', () => { console.log('[SERVIDOR] SIGTERM...'); process.exit(0); });
process.on('SIGINT', () => { console.log('[SERVIDOR] SIGINT...'); process.exit(0); });

iniciarServidor();
module.exports = app;
