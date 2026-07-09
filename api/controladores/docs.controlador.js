const { execSync } = require('child_process');
const { pool } = require('../configuracion/base_de_datos');

async function generarDocumentacionViva(req, res) {
  try {
    const doc = {
      meta: {
        nombre: 'ACADEMIA-ADDISON',
        version: '3.4.0',
        superadmin: 'Eduardo Flores (flores.eduardo.666@gmail.com)',
        repositorio: 'https://github.com/Duardus/ACADEMIA-ADDISON',
        timestamp: new Date().toISOString(),
        entorno: process.env.NODE_ENV || 'production'
      },
      
      que_es: {
        descripcion: 'Plataforma educativa modular tipo escuela en la nube',
        funcionalidades: [
          'Gestion jerarquica: Grupos > Cursos > Temas > Subtemas > Teorias > Materiales > Preguntas > Examenes',
          'Auth segura: Login Google Firebase (OAuth 2.0) + tokens JWT propios',
          'Multi-institucion: Un usuario puede pertenecer a multiples instituciones con roles diferentes',
          'Video-clases en vivo: Integracion con LiveKit para streaming WebRTC',
          'Grabaciones persistentes: Clases grabadas en el arbol academico',
          'Examenes auto-calificados: Sistema de preguntas con intentos y progreso',
          'Modo Fantasma: Usuarios recv-only (solo ver, sin interactuar)',
          'Jerarquia de usuarios: Subordinados con capacidades delegables'
        ]
      },
      
      arquitectura: {
        principio: 'Frontend modular - Un archivo por responsabilidad (api/ui/eventos)',
        estructura: {
          '00-config': 'Configuracion global (api.config.js, firebase.config.js, permisos.config.js)',
          '01-nucleo': 'Core compartido (utilidades.js, sesion.js, peticiones.js)',
          '02-modulos': 'Modulos por dominio - cada uno con api.js, ui.js, eventos.js',
          '99-app.js': 'Entry point, router, onAuthStateChanged'
        },
        modulos_actuales: [
          'login (login.api.js, login.ui.js, login.eventos.js)',
          'dashboard (dashboard.api.js, dashboard.ui.js, dashboard.eventos.js)',
          'arbol (arbol.api.js, arbol.ui.js, arbol.eventos.js)',
          'jerarquia (jerarquia.api.js, jerarquia.ui.js, jerarquia.eventos.js)'
        ],
        regla_oro: 'NUNCA archivos monoliticos grandes. Cada archivo < 300 lineas.'
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
      
      autenticacion: {
        proveedor: 'Firebase Auth v8.10.1',
        metodo: 'Google OAuth 2.0',
        tokens: 'JWT propios (7 dias)',
        roles: ['superadmin', 'administrador', 'docente', 'estudiante', 'invitado'],
        flujo: [
          'Usuario hace clic en Entrar con Google',
          'Firebase Auth verifica la cuenta Google',
          'Frontend envia token Firebase al backend (POST /api/v1/auth/login)',
          'Backend verifica token con Firebase Admin',
          'Backend busca usuario en PostgreSQL',
          'Si existe -> login_directo. Si no existe -> crea usuario automaticamente',
          'Backend devuelve: token_sesion, usuario, institucion',
          'Frontend guarda en localStorage y muestra dashboard'
        ]
      },
      
      jerarquia_usuarios: {
        descripcion: 'Sistema de subordinados con capacidades delegables',
        endpoints: [
          'POST /api/v1/jerarquia/crear -> Crear usuario hijo',
          'GET /api/v1/jerarquia/mis-subordinados -> Listar subordinados',
          'POST /api/v1/jerarquia/cambiar-estado/:id -> Cambiar estado',
          'DELETE /api/v1/jerarquia/subordinado/:id -> Desactivar subordinado',
          'GET /api/v1/jerarquia/superiores/:id -> Ver superiores',
          'GET /api/v1/jerarquia/mis-capacidades -> Capacidades delegables',
          'PUT /api/v1/jerarquia/subordinado/:id/capacidades -> Modificar capacidades',
          'GET /api/v1/jerarquia/etiquetas -> Etiquetas frecuentes',
          'GET /api/v1/jerarquia/arbol-completo -> Arbol de institucion',
          'POST /api/v1/jerarquia/grupos -> Crear grupo colaborativo'
        ],
        frontend: {
          tabla: 'Lista de subordinados con nombre, correo, rol, estado, capacidades',
          crear: 'Modal para crear nuevo subordinado (nombre, correo, rol, etiqueta)',
          capacidades: 'Modal con checkboxes para delegar permisos',
          acciones: 'Cambiar estado, desactivar, gestionar capacidades'
        }
      },
      
      arbol_academico: {
        descripcion: 'Gestion jerarquica de contenido educativo',
        endpoints: [
          'GET /api/v1/arbol -> Obtener arbol completo',
          'POST /api/v1/arbol/grupos -> Crear grupo',
          'PUT /api/v1/arbol/grupos/:id -> Actualizar grupo',
          'DELETE /api/v1/arbol/grupos/:id -> Eliminar grupo',
          'POST /api/v1/arbol/cursos -> Crear curso',
          'PUT /api/v1/arbol/cursos/:id -> Actualizar curso',
          'DELETE /api/v1/arbol/cursos/:id -> Eliminar curso'
        ]
      },
      
      livekit: {
        descripcion: 'Video-clases en vivo via WebRTC',
        endpoints: [
          'POST /api/v1/livekit/token -> Generar token para sala',
          'GET /api/v1/livekit/rooms -> Listar salas activas'
        ]
      },
      
      git: {
        ultimo_commit: execSync('git log -1 --format="%h - %s (%ar)"').toString().trim(),
        rama: execSync('git branch --show-current').toString().trim(),
        total_commits: execSync('git rev-list --count HEAD').toString().trim()
      },
      
      reglas_oro: [
        'Variables en espanol descriptivo: nombre_completo, tipo_rol, token_sesion',
        'Asignacion directa sin invitaciones: Auto-registro al login',
        '404 para no autorizado: Sin mensajes de acceso denegado',
        'Modo fantasma recv-only: Solo ver sin interactuar',
        'CORS solo en Express: Nunca en nginx ni Caddy',
        'Frontend modular: Un archivo por responsabilidad (api/ui/eventos)',
        'Auth solo Firebase: Datos persistentes en PostgreSQL, no en Firestore',
        'NUNCA archivos monoliticos: Cada archivo < 300 lineas'
      ],
      
      nota_para_ia: 'Plataforma educativa en produccion. Eduardo Flores es superadmin. Usar espanol descriptivo para variables. Respetar Reglas de Oro. Frontend modular: cada modulo tiene api.js (HTTP), ui.js (renderizado), eventos.js (orquestacion). NUNCA crear archivos monoliticos grandes. Revisar js/02-modulos/ y api/rutas/ para dudas tecnicas.'
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
  return [
    '/api/v1/auth/login',
    '/api/v1/auth/seleccionar-contexto',
    '/api/v1/auth/switch-context',
    '/api/v1/sesion/verificar',
    '/api/v1/arbol',
    '/api/v1/jerarquia/crear',
    '/api/v1/jerarquia/mis-subordinados',
    '/api/v1/jerarquia/cambiar-estado/:id',
    '/api/v1/jerarquia/subordinado/:id',
    '/api/v1/jerarquia/superiores/:id',
    '/api/v1/jerarquia/mis-capacidades',
    '/api/v1/jerarquia/subordinado/:id/capacidades',
    '/api/v1/jerarquia/etiquetas',
    '/api/v1/jerarquia/arbol-completo',
    '/api/v1/jerarquia/grupos',
    '/api/v1/livekit/token',
    '/api/v1/livekit/rooms',
    '/api/v1/salud',
    '/api/v1/docs'
  ];
}

module.exports = { generarDocumentacionViva };
