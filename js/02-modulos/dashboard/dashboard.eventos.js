/* ============================================
   ARCHIVO: dashboard.eventos.js
   MODULO: dashboard
   ============================================ */

let heartbeatTimer = null;
let arbolCache = [];
let progresoCache = {};
let grabacionesCache = [];

async function iniciarDashboard({ onLogout, onNavegar, onError }) {
  try {
    const datosSesion = obtenerUsuario();
    const institucion = obtenerInstitucion();

    if (!datosSesion || !institucion) {
      onError('Sesion invalida');
      return;
    }

    const rol = datosSesion.rol || 'estudiante';
    const nombreRol = datosSesion.nombre_rol || rol;

    renderizarDashboard({
      usuario: datosSesion,
      institucion,
      rol,
      nombreRol,
      onLogout,
      onNavegar
    });

    // Cargar datos en paralelo
    const [arbolResp, progresoResp, grabacionesResp] = await Promise.all([
      apiObtenerArbol().catch(() => ({ datos: [] })),
      apiObtenerProgreso().catch(() => ({ datos: { cursos: [] } })),
      apiListarGrabaciones().catch(() => ({ grabaciones: [] }))
    ]);

    arbolCache = arbolResp.datos || arbolResp || [];
    progresoCache = progresoResp.datos || progresoResp || { cursos: [] };
    grabacionesCache = grabacionesResp.grabaciones || [];

    // Renderizar sidebar con cursos
    renderizarSidebar({
      arbol: arbolCache,
      cursoActivoId: null,
      progreso: progresoCache,
      rol,
      onSeleccionarCurso: (cursoId) => seleccionarCurso(cursoId),
      onNavegar
    });

    // Panel segun rol
    if (rol === 'student' || rol === 'alumno' || rol === 'estudiante') {
      renderizarPanelCurso({ curso: null, progreso: progresoCache, grabaciones: grabacionesCache, rol, puedeIniciarClase: false });
    } else if (rol === 'profesor' || rol === 'professor') {
      renderizarPanelCurso({ curso: null, progreso: progresoCache, grabaciones: grabacionesCache, rol, puedeIniciarClase: true });
    } else if (rol === 'director') {
      renderizarPanelCurso({ curso: null, progreso: progresoCache, grabaciones: grabacionesCache, rol, puedeIniciarClase: true });
    } else if (rol === 'superadmin') {
      renderizarPanelCurso({ curso: null, progreso: progresoCache, grabaciones: grabacionesCache, rol, puedeIniciarClase: true });
    }

    // Iniciar heartbeat
    iniciarHeartbeat({ onLogout });

  } catch (error) {
    onError(error.message || 'Error cargando dashboard');
  }
}

function seleccionarCurso(cursoId) {
  const curso = arbolCache.find(c => c.curso_id === cursoId);
  if (!curso) return;

  const datosSesion = obtenerUsuario();
  const rol = datosSesion?.rol || 'estudiante';
  const puedeIniciarClase = ['superadmin', 'director', 'profesor', 'professor'].includes(rol);

  // Actualizar sidebar con curso activo resaltado
  renderizarSidebar({
    arbol: arbolCache,
    cursoActivoId: cursoId,
    progreso: progresoCache,
    rol,
    onSeleccionarCurso: (id) => seleccionarCurso(id),
    onNavegar: (vista) => app.navegar(vista)
  });

  // Renderizar panel con temas/subtemas del curso
  renderizarPanelCurso({ curso, progreso: progresoCache, grabaciones: grabacionesCache, rol, puedeIniciarClase });
}

async function iniciarClaseEnVivo(cursoId, nombreCurso) {
  try {
    const datosSesion = obtenerUsuario();
    const rol = datosSesion?.rol || 'estudiante';
    
    // Solo profesores, directores y superadmin pueden iniciar clases
    if (!['superadmin', 'director', 'profesor', 'professor'].includes(rol)) {
      app.mostrarToast('No tienes permisos para iniciar clases en vivo', 'error');
      return;
    }

    const nombreSala = `curso-${cursoId}-${Date.now()}`;
    
    // 1. Obtener token de LiveKit
    const tokenResp = await apiObtenerTokenLivekit(nombreSala, 'publisher');
    
    // 2. Iniciar grabacion
    const grabacionResp = await apiIniciarGrabacion(nombreSala, nombreCurso);
    
    // 3. Abrir sala de LiveKit
    const url = new URL('/live/room.html', window.location.origin);
    url.searchParams.set('course', nombreCurso);
    url.searchParams.set('sala', nombreSala);
    url.searchParams.set('token', tokenResp.token);
    url.searchParams.set('url', tokenResp.url);
    url.searchParams.set('grabacion_id', grabacionResp.grabacion?.grabacion_id);
    url.searchParams.set('rol', rol);
    
    window.open(url.toString(), '_blank');
    
    app.mostrarToast('Clase en vivo iniciada', 'exito');
    
  } catch (error) {
    console.error('Error iniciando clase en vivo:', error);
    app.mostrarToast('Error al iniciar clase en vivo', 'error');
  }
}

function iniciarHeartbeat({ onLogout }) {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  heartbeatTimer = setInterval(async () => {
    const token = obtenerToken();
    if (!token) return;

    try {
      const resp = await fetch(`${API_CONFIG.BASE_URL}/sesion/verificar`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (resp.status === 401) {
        const data = await resp.json().catch(() => ({}));
        let mensaje = 'Tu sesion ha expirado.';
        if (data.codigo === 'USUARIO_SUSPENDIDO') mensaje = 'Tu cuenta ha sido suspendida.';
        else if (data.codigo === 'USUARIO_ELIMINADO') mensaje = 'Tu cuenta ha sido eliminada.';
        alert(mensaje);
        onLogout();
      }
    } catch (err) {
      console.warn('[HEARTBEAT] Error de red:', err.message);
    }
  }, 30000);
}

function detenerHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
