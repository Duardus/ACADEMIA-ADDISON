# ACADEMIA-ADDISON - Documentacion Maestra
> Ultima actualizacion: 2026-07-09 10:00 UTC
> Version: 3.3.1
> Autor: Eduardo Flores (superadmin)
> Repositorio: https://github.com/Duardus/ACADEMIA-ADDISON

## 1. Que es ACADEMIA-ADDISON?

Plataforma educativa modular tipo "escuela en la nube":
- Gestion jerarquica: Grupos > Cursos > Temas > Subtemas > Teorias > Materiales > Preguntas > Examenes
- Auth segura: Login Google Firebase (OAuth 2.0) + tokens JWT propios
- Multi-institucion: Un usuario puede pertenecer a multiples instituciones con roles diferentes
- Video-clases en vivo: Integracion con LiveKit para streaming WebRTC
- Grabaciones persistentes: Clases grabadas en el arbol academico
- Examenes auto-calificados: Sistema de preguntas con intentos y progreso
- Modo Fantasma: Usuarios recv-only (solo ver, sin interactuar)

## 2. Arquitectura Tecnica

| Capa | Tecnologia | Rol |
|------|-----------|-----|
| Frontend | Vanilla JS (ES6+) | SPA modular por dominio |
| Hosting Frontend | Cloudflare Pages | CDN global, HTTPS gratis |
| Backend | Node.js + Express | API REST v3.0 |
| Proceso Backend | PM2 | api-addison |
| Base de Datos | PostgreSQL 15 | 23 tablas |
| Contenedor DB | Docker | postgres-academia |
| Auth | Firebase Auth v8.10.1 | Solo login Google |
| Video Streaming | LiveKit | WebRTC clases en vivo |
| Reverse Proxy | nginx 1.18.0 | SSL + proxy |
| DNS | DuckDNS | academia-addison.duckdns.org |
| SSL | Lets Encrypt | Certbot automatico |

## 3. URLs de Produccion

| Servicio | URL |
|----------|-----|
| Frontend | https://academia-addison.pages.dev |
| API Backend | https://academia-addison.duckdns.org/api/v1/ |
| LiveKit | https://academia-addison.duckdns.org/livekit/ |
| Health Check | https://academia-addison.duckdns.org/api/v1/salud |

## 4. Infraestructura Fisica

- Servidor: VPS Ubuntu (Oracle Cloud)
- Usuario: ubuntu@academia-addison
- Backend: ~/ACADEMIA-ADDISON/api/servidor.js (puerto 3000)
- Frontend: ~/ACADEMIA-ADDISON/ (deploy via Git > Cloudflare Pages)
- Git: main branch en github.com:Duardus/ACADEMIA-ADDISON

## 5. Estructura Frontend (v3.3 Modular)

js/
  00-config/
    api.config.js          - URL del backend
    firebase.config.js     - Firebase Auth config
    permisos.config.js     - Roles y permisos
  01-nucleo/
    utilidades.js          - Helpers
    sesion.js              - localStorage wrapper
    peticiones.js          - Fetch + auth headers + unwrap datos
  02-modulos/
    login/
      login.api.js         - POST /auth/login
      login.ui.js          - Render pantalla login
      login.eventos.js     - Popup Firebase > API > guardar sesion
    dashboard/
      dashboard.api.js
      dashboard.ui.js      - Render tarjetas
      dashboard.eventos.js - Navegacion
    arbol/
      arbol.api.js         - CRUD arbol academico
      arbol.ui.js          - Render grupos/cursos + modales
      arbol.eventos.js     - Eventos CRUD
  99-app.js                - Entry point, router, onAuthStateChanged

## 6. Flujo de Autenticacion

Usuario (navegador) > Cloudflare Pages > nginx (SSL) > Express (3000) > Firebase Auth (verifica token Google) > PostgreSQL (busca/crea usuario) > JWT propio (token sesion 7 dias)

Respuestas del backend:
- login_directo: 1 membresia > Guardar token > Dashboard
- selector_requerido: Multiples membresias > Mostrar selector
- AUTENTICACION_FALLIDA: Token invalido > Error
- USUARIO_NO_ENCONTRADO: Auto-registro automatico

## 7. Modelo de Datos (23 Tablas)

Tablas principales: usuarios, instituciones, membresias, grupos, cursos, temas, subtemas, teorias, materiales, preguntas, examenes, intentos, progreso, grabaciones, jerarquia

Roles: superadmin, administrador, docente, estudiante, invitado

## 8. API Endpoints

Auth:
  POST /api/v1/auth/login
  POST /api/v1/auth/seleccionar-contexto
  POST /api/v1/auth/switch-context

Sesion:
  GET /api/v1/sesion/verificar

Arbol:
  GET    /api/v1/arbol
  POST   /api/v1/arbol/grupos
  PUT    /api/v1/arbol/grupos/:id
  DELETE /api/v1/arbol/grupos/:id
  POST   /api/v1/arbol/cursos
  PUT    /api/v1/arbol/cursos/:id
  DELETE /api/v1/arbol/cursos/:id

LiveKit:
  POST /api/v1/livekit/token
  GET  /api/v1/livekit/rooms

## 9. Configuracion nginx

server {
    server_name academia-addison.duckdns.org;
    location /api/v1/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / { return 200 "ok"; }
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/academia-addison.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/academia-addison.duckdns.org/privkey.pem;
}

Importante: NO anadir add_header Access-Control-* en nginx. CORS lo maneja Express.

## 10. Configuracion CORS (Express)

origin: https://academia-addison.pages.dev (y localhosts para dev)
methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
allowedHeaders: Content-Type, Authorization, X-Requested-With
credentials: true
maxAge: 86400

## 11. Variables de Entorno (.env)

DATABASE_URL=postgresql://addison:PASSWORD@localhost:5432/academia_addison
JWT_SECRET=super_secreto_jwt
JWT_EXPIRES_IN=7d
FIREBASE_PROJECT_ID=academia-adison
LIVEKIT_URL=wss://academia-addison.duckdns.org/livekit
PORT=3000

## 12. Comandos Utiles

pm2 status                    - Ver estado backend
pm2 logs api-addison --lines 20  - Ver logs
pm2 restart api-addison       - Reiniciar backend
sudo nginx -t                 - Verificar nginx
sudo systemctl reload nginx   - Recargar nginx
curl -s -D - https://academia-addison.duckdns.org/api/v1/salud -H "Origin: https://academia-addison.pages.dev"  - Verificar CORS
docker logs postgres-academia --tail 20  - Logs PostgreSQL
git add -A -f && git commit -m "mensaje" && git push origin main  - Deploy frontend

## 13. Reglas de Oro

1. Variables en espanol descriptivo: nombre_completo, tipo_rol, token_sesion
2. Asignacion directa sin invitaciones: Auto-registro al login
3. 404 para no autorizado: Sin mensajes de "acceso denegado"
4. Modo fantasma recv-only: Solo ver sin interactuar
5. CORS solo en Express: Nunca en nginx ni Caddy
6. Frontend modular: Un archivo por responsabilidad (api/ui/eventos)
7. Auth solo Firebase: Datos en PostgreSQL, no en Firestore

## 14. Historial de Cambios

| Fecha | Version | Cambio | Archivos |
|-------|---------|--------|----------|
| 2026-07-09 | 3.3.1 | Fix: Arbol UI limpio - modales sin duplicados, btn crear grupo | arbol.ui.js, arbol.eventos.js |
| 2026-07-09 | 3.3.0 | Fix: Eliminar scripts legacy del index.html | index.html |
| 2026-07-09 | 3.2.9 | Fix: CORS duplicado en nginx eliminado | nginx addison |
| 2026-07-09 | 3.2.8 | Fix: Preflight OPTIONS pasa a Express | nginx addison |
| 2026-07-09 | 3.2.7 | Frontend modular v3.0 | js/02-modulos/* |
| 2026-06-16 | 3.0.0 | Backend v3.0 - PostgreSQL, JWT, Firebase Auth | api/ |

## 15. Contacto

Superadmin: Eduardo Flores (flores.eduardo.666@gmail.com)
Repositorio: https://github.com/Duardus/ACADEMIA-ADDISON
Servidor: ubuntu@academia-addison (VPS Oracle Cloud)

Nota para IA: Plataforma educativa en produccion. Eduardo Flores es superadmin. Usar espanol descriptivo para variables. Respetar Reglas de Oro (seccion 13). Revisar js/02-modulos/ y api/rutas/ para dudas tecnicas.
