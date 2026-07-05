# 🏛️ ACADEMIA ADDISON - Arquitectura Modular

## 📋 Versión
- **Backend:** v3.0.1
- **Ultima actualizacion:** 2026-07-05
- **Rama:** main

---

## 🗺️ Mapa de la Arquitectura

Frontend (js/) <-> Backend (api/) <-> Base de Datos (PostgreSQL)

---

## 📁 Estructura de Carpetas

- api/servidor.js → Punto de entrada (66 lineas)
- api/validar.js → Script de validacion
- api/controladores/ → Logica de negocio
  - auth.controlador.js → Login y autenticacion
  - arbol.controlador.js → Arbol academico
  - jerarquia.usuarios.controlador.js → Gestion de subordinados
  - jerarquia.capacidades.controlador.js → Capacidades delegables
  - jerarquia.arbol.controlador.js → Arbol de institucion
- api/rutas/ → Definicion de URLs API
- api/middleware/ → Filtros de seguridad
- js/app.js → Router SPA principal
- js/servicios/api.servicio.js → Cliente API
- js/config/api.config.js → URL del backend

---

## 🔐 Flujo de Autenticacion

1. Usuario hace clic en Entrar con Google
2. Firebase Auth verifica la cuenta Google
3. Frontend envia token Firebase al backend (POST /api/v1/auth/login)
4. Backend verifica token con Firebase Admin
5. Backend busca usuario en PostgreSQL
6. Si existe → login_directo. Si no existe → crea usuario automaticamente
7. Backend devuelve: token_sesion, usuario, institucion
8. Frontend guarda en localStorage y muestra dashboard

---

## 📡 Contratos API Principales

### Auth
POST /api/v1/auth/login → login_directo o selector_requerido
POST /api/v1/auth/seleccionar-contexto → token_sesion, usuario, institucion
POST /api/v1/auth/switch-context → token_sesion, institucion, rol, nivel

### Arbol Academico
GET /api/v1/arbol → exito, datos, totales

### Jerarquia de Usuarios
POST   /api/v1/jerarquia/crear → Crear usuario hijo
GET    /api/v1/jerarquia/mis-subordinados → Listar subordinados
POST   /api/v1/jerarquia/cambiar-estado/:id → Cambiar estado
DELETE /api/v1/jerarquia/subordinado/:id → Desactivar subordinado
GET    /api/v1/jerarquia/superiores/:id → Ver superiores

### Capacidades
GET /api/v1/jerarquia/mis-capacidades → Capacidades delegables
PUT /api/v1/jerarquia/subordinado/:id/capacidades → Modificar capacidades
GET /api/v1/jerarquia/etiquetas → Etiquetas frecuentes

### Grupos Colaborativos
GET  /api/v1/jerarquia/arbol-completo → Arbol de institucion
POST /api/v1/jerarquia/grupos → Crear grupo colaborativo

---

## ✅ Validacion del Sistema

Para verificar que todo funciona:
cd ~/ACADEMIA-ADDISON/api && node validar.js

Resultado esperado: 6 pasaron | 0 fallaron | ~27ms

---

## 🗄️ Base de Datos (PostgreSQL)

- Contenedor Docker: postgres-academia
- Superusuario: addison
- Tablas principales: 23 tablas
  - usuarios, instituciones, membresias
  - grupos_academicos, cursos, temas, subtemas, teorias
  - examenes, preguntas, intentos, progreso
  - grabaciones, livekit_tokens, etc.

---

## 🔧 Infraestructura

| Componente | Tecnologia | URL |
|---|---|---|
| Frontend | HTML/CSS/JS | https://academia-addison.pages.dev |
| Backend API | Node.js + Express | https://academia-addison.duckdns.org/api/v1 |
| Base de Datos | PostgreSQL Docker | localhost:5432 |
| Auth | Firebase Admin SDK | Google OAuth |
| Proxy Inverso | Caddy | academia-addison.duckdns.org |
| Clases en Vivo | LiveKit | Puerto 7880 |

---

## 🚀 Comandos Utiles

Validar sistema: cd ~/ACADEMIA-ADDISON/api && node validar.js
Reiniciar backend: pm2 restart api-addison
Ver logs: pm2 logs api-addison --lines 20
Ver estado Git: cd ~/ACADEMIA-ADDISON && git status
Ver historial: cd ~/ACADEMIA-ADDISON && git log --oneline

---

## 📝 Notas de Diseno

### Reglas de Oro
1. Variables en espanol descriptivo
2. Asignacion directa sin invitaciones
3. 404 para no autorizado
4. Modo fantasma recv-only para suspendidos

### Principios de Modularizacion
- Cada controlador tiene una sola responsabilidad
- Las rutas usan el middleware autenticar unificado
- El servidor.js solo orquesta, no tiene logica de negocio
- Datos falsos reemplazados por conexion real al backend

---

## 🐛 Bugs Conocidos y Resueltos

| Bug | Estado | Solucion |
|---|---|---|
| Login devolvia 500 para token invalido | Resuelto | Ahora devuelve 401 |
| Rutas duplicadas en servidor.js | Resuelto | Solo rutas /api/v1/* |
| Middleware duplicado en arbol.rutas.js | Resuelto | Usa middlewareAutenticar global |
| jerarquia.controlador.js monolito (33KB) | Resuelto | Dividido en 3 modulos |

---

## 📅 Historial de Cambios Principales

| Fecha | Cambio |
|---|---|
| 2026-07-05 | Modularizacion completa: limpieza, division de jerarquia, validacion |
| 2026-06-20 | Fix de autenticacion y contexto de institucion |
| 2026-06-18 | Creacion de arbol academico y jerarquia de usuarios |
| 2026-06-16 | Setup inicial del backend v3.0 |

---

*Documento creado por Lead Software Architect - Sesion de Modularizacion*
*Para preguntas: ejecutar node validar.js y revisar logs de PM2*
