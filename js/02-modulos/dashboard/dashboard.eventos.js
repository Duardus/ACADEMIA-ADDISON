/* ============================================
   ARCHIVO: dashboard.eventos.js
   MODULO: dashboard
   ============================================ */

let heartbeatTimer = null;
let arbolCache = [];
let progresoCache = {};

async function iniciarDashboard({ onLogout, onNavegar, onError }) {
  try {
    const datosSesion = obtenerUsuario();
    const institucion = obtenerInstitucion();

    if (!datosSesion || !institucion) {
      onError('Sesión inválida');
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
    const [arbolResp, progresoResp] = await Promise.all([
      apiObtenerArbol().catch(() => ({ datos: [] })),
      apiObtenerProgreso().catch(() => ({ datos: { cursos: [] } }))
    ]);

    arbolCache = arbolResp.datos || arbolResp || [];
    progresoCache = progresoResp.datos || progresoResp || { cursos: [] };

    // Renderizar sidebar con cursos
    renderizarSidebar({
      arbol: arbolCache,
      cursoActivoId: null,
      progreso: progresoCache,
      rol,
      onSeleccionarCurso: (cursoId) => seleccionarCurso(cursoId),
      onNavegar
    });

    // Panel según rol
    if (rol === 'student' || rol === 'alumno' || rol === 'estudiante') {
      renderizarPanel({ rol, onNavegar });
      renderizarPanelAlumno({ arbol: arbolCache, progreso: progresoCache, onSeleccionarCurso: (id) => seleccionarCurso(id) });
    } else if (rol === 'profesor' || rol === 'professor') {
      renderizarPanel({ rol, onNavegar });
      renderizarPanelProfesor({ onNavegar });
    } else if (rol === 'director') {
      renderizarPanel({ rol, onNavegar });
      renderizarPanelDirector({ onNavegar });
    } else if (rol === 'superadmin') {
      renderizarPanel({ rol, onNavegar });
      renderizarPanelSuperadmin({ onNavegar });
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

  // Actualizar sidebar con curso activo resaltado
  const datosSesion = obtenerUsuario();
  const rol = datosSesion?.rol || 'estudiante';
  
  renderizarSidebar({
    arbol: arbolCache,
    cursoActivoId: cursoId,
    progreso: progresoCache,
    rol,
    onSeleccionarCurso: (id) => seleccionarCurso(id),
    onNavegar: (vista) => app.navegar(vista)
  });

  // Renderizar panel con temas/subtemas del curso
  renderizarPanelCurso({ curso, progreso: progresoCache });
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
        let mensaje = 'Tu sesión ha expirado.';
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
