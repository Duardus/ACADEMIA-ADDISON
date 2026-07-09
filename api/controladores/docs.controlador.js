const { execSync } = require('child_process');
const { pool } = require('../configuracion/base_de_datos');

async function generarDocumentacionViva(req, res) {
  try {
    const doc = {
      meta: {
        nombre: 'ACADEMIA-ADDISON',
        version: '3.3.1',
        superadmin: 'Eduardo Flores (flores.eduardo.666@gmail.com)',
        repositorio: 'https://github.com/Duardus/ACADEMIA-ADDISON',
        timestamp: new Date().toISOString(),
        entorno: process.env.NODE_ENV || 'produccion'
      },
      
      infraestructura: {
        servidor: {
          hostname: execSync('hostname').toString().trim(),
          uptime: execSync('uptime -p').toString().trim(),
          usuario: process.env.USER || 'ubuntu'
        },
        servicios: {
          nginx: verificarServicio('nginx'),
          pm2: verificarServicio('pm2'),
          postgres_docker: verificarDocker('postgres-academia'),
          backend: verificarPuerto(3000)
        },
        urls: {
          frontend: 'https://academia-addison.pages.dev',
          api: 'https://academia-addison.duckdns.org/api/v1/',
          health: 'https://academia-addison.duckdns.org/api/v1/salud',
          docs: 'https://academia-addison.duckdns.org/api/v1/docs'
        }
      },
      
      base_de_datos: {
        motor: 'PostgreSQL 15',
        contenedor: 'postgres-academia',
        tablas: await obtenerTablas(),
        conexiones_activas: await obtenerConexiones()
      },
      
      backend: {
        framework: 'Express.js',
        puerto: process.env.PORT || 3000,
        proceso: 'api-addison',
        rutas: obtenerRutas(),
        middleware: ['cors', 'json', 'autenticar', 'manejar_errores']
      },
      
      frontend: {
        arquitectura: 'SPA Vanilla JS modular v3.3',
        hosting: 'Cloudflare Pages',
        modulos: [
          'login (login.api.js, login.ui.js, login.eventos.js)',
          'dashboard (dashboard.api.js, dashboard.ui.js, dashboard.eventos.js)',
          'arbol (arbol.api.js, arbol.ui.js, arbol.eventos.js)'
        ],
        entry_point: '99-app.js'
      },
      
      autenticacion: {
        proveedor: 'Firebase Auth v8.10.1',
        metodo: 'Google OAuth 2.0',
        tokens: 'JWT propios (7 dias)',
        roles: ['superadmin', 'administrador', 'docente', 'estudiante', 'invitado']
      },
      
      git: {
        ultimo_commit: execSync('git log -1 --format="%h - %s (%ar)"').toString().trim(),
        rama: execSync('git branch --show-current').toString().trim(),
        total_commits: execSync('git rev-list --count HEAD').toString().trim()
      },
      
      reglas_oro: [
        'Variables en espanol descriptivo',
        'Asignacion directa sin invitaciones (auto-registro)',
        '404 para no autorizado',
        'Modo fantasma recv-only',
        'CORS solo en Express, nunca en nginx',
        'Frontend modular: api/ui/eventos',
        'Auth solo Firebase, datos en PostgreSQL'
      ],
      
      nota_para_ia: 'Plataforma educativa en produccion. Eduardo Flores es superadmin. Usar espanol descriptivo para variables. Respetar Reglas de Oro. Revisar js/02-modulos/ y api/rutas/ para dudas tecnicas.'
    };

    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Error generando documentacion', detalle: error.message });
  }
}

function verificarServicio(nombre) {
  try {
    execSync(`systemctl is-active --quiet ${nombre}`);
    return { estado: 'activo', pid: execSync(`pgrep ${nombre}`).toString().trim() };
  } catch {
    try {
      const pid = execSync(`pgrep ${nombre}`).toString().trim();
      return { estado: 'activo', pid };
    } catch {
      return { estado: 'inactivo', pid: null };
    }
  }
}

function verificarDocker(contenedor) {
  try {
    const estado = execSync(`docker inspect -f '{{.State.Status}}' ${contenedor} 2>/dev/null`).toString().trim();
    return { estado, activo: estado === 'running' };
  } catch {
    return { estado: 'desconocido', activo: false };
  }
}

function verificarPuerto(puerto) {
  try {
    execSync(`ss -tlnp | grep :${puerto} > /dev/null`);
    return { estado: 'escuchando', puerto };
  } catch {
    return { estado: 'cerrado', puerto };
  }
}

async function obtenerTablas() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    return result.rows.map(r => r.table_name);
  } catch (error) {
    return { error: error.message };
  }
}

async function obtenerConexiones() {
  try {
    const result = await pool.query(`
      SELECT count(*) as total 
      FROM pg_stat_activity 
      WHERE datname = 'academia_addison'
    `);
    return parseInt(result.rows[0].total);
  } catch (error) {
    return { error: error.message };
  }
}

function obtenerRutas() {
  const rutas = [
    '/api/v1/auth/login',
    '/api/v1/auth/seleccionar-contexto',
    '/api/v1/auth/switch-context',
    '/api/v1/sesion/verificar',
    '/api/v1/arbol',
    '/api/v1/livekit/token',
    '/api/v1/salud',
    '/api/v1/docs'
  ];
  return rutas;
}

module.exports = { generarDocumentacionViva };
