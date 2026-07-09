/* ============================================
   📁 ARCHIVO: dashboard.eventos.js
   📂 MÓDULO: dashboard
   🔗 DEPENDENCIAS:
     - dashboard.api.js (HTTP)
     - dashboard.ui.js (renderizado)
     - sesion.js (localStorage)
   📝 CONTRATO:
     - Orquesta carga de datos + renderizado
     - Maneja heartbeat cada 30s
     - Recibe callbacks: onLogout, onNavegar
   ============================================ */

let heartbeatTimer = null;

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
    const [arbol, progreso] = await Promise.all([
      apiObtenerArbol().catch(() => []),
      apiObtenerProgreso().catch(() => ({ cursos: [] }))
    ]);

    renderizarSidebar({ arbol, progreso, rol, onNavegar });
    renderizarPanel({ rol, onNavegar });

    // Panel según rol
    if (rol === 'student' || rol === 'alumno' || rol === 'estudiante') {
      renderizarPanelAlumno({ arbol, progreso });
    } else if (rol === 'profesor' || rol === 'professor') {
      renderizarPanelProfesor({ onNavegar });
    } else if (rol === 'director') {
      renderizarPanelDirector({ onNavegar });
    } else if (rol === 'superadmin') {
      renderizarPanelSuperadmin({ onNavegar });
    }

    // Iniciar heartbeat
    iniciarHeartbeat({ onLogout });

  } catch (error) {
    onError(error.message || 'Error cargando dashboard');
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
