/* ============================================
   🧠 APP.JS - Router SPA Principal v3.0
   Frontend adaptado al backend modular.
   Lee respuestas YA desempaquetadas por api.servicio.js
   ============================================ */

class App {
  constructor() {
    this.paginaActual = null;
    this.usuario = null;
    this.institucion = null;
    this.rol = null;
    this.nivel = null;
    this.nombreRol = null;
  }

  async iniciar() {
    console.log('[APP] Iniciando Academia Addison v3.0...');

    const token = localStorage.getItem('token_sesion');
    const institucionRaw = localStorage.getItem('institucion_activa');

    if (token && institucionRaw && institucionRaw !== 'undefined' && institucionRaw !== 'null') {
      try {
        this.institucion = JSON.parse(institucionRaw);
        const usuarioRaw = localStorage.getItem('usuario_activo');
        const usuario = usuarioRaw && usuarioRaw !== 'undefined' ? JSON.parse(usuarioRaw) : {};

        // El rol viene del backend en usuario.rol (ya desempaquetado por api.servicio.js)
        this.rol = usuario.rol || 'estudiante';
        this.nivel = usuario.nivel || 99;
        this.nombreRol = usuario.nombre_rol || this.rol;
        this.usuario = usuario;

        await this.mostrarDashboard();
        return;
      } catch (e) {
        console.warn('[APP] Datos corruptos en localStorage, limpiando...');
        this.limpiarSesion();
      }
    }

    this.mostrarLogin();
  }

  limpiarSesion() {
    localStorage.removeItem('token_sesion');
    localStorage.removeItem('institucion_activa');
    localStorage.removeItem('usuario_activo');
  }

  // ============ PAGINAS ============

  mostrarLogin() {
    console.log('[APP] Mostrando login...');
    const app = document.getElementById('app');
    app.innerHTML = '';

    const pantalla = document.createElement('div');
    pantalla.className = 'pantalla-bienvenida';
    pantalla.innerHTML = `
      <div class="bienvenida-izquierda">
        <h1>Academia Addison</h1>
        <p>Plataforma educativa profesional para academias preuniversitarias. Gestiona cursos, examenes, clases en vivo y progreso de alumnos en tiempo real.</p>
      </div>
      <div class="bienvenida-derecha">
        <div class="login-tarjeta">
          <h2>Bienvenido</h2>
          <p class="sub">Inicia sesion con tu cuenta Google para continuar</p>
          <button class="btn" id="btnLoginGoogle">
            <span style="margin-right:8px;">🔑</span> Entrar con Google
          </button>
          <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--texto-secundario);">
            ¿No tienes cuenta? Contacta a tu academia
          </p>
        </div>
      </div>
    `;
    app.appendChild(pantalla);

    document.getElementById('btnLoginGoogle').addEventListener('click', () => {
      this.handleLoginGoogle();
    });
  }

  async handleLoginGoogle() {
    try {
      const resultado = await auth.signInWithPopup(googleProvider);
      const tokenFirebase = await resultado.user.getIdToken(true);

      console.log('[APP] Firebase login OK, enviando al backend...');

      const datos = await api.login(tokenFirebase);

      // api.servicio.js ya desempaqueto { exito, datos } -> datos es plano
      if (datos && datos.tipo === 'login_directo') {
        // Login directo: una sola institucion
        localStorage.setItem('token_sesion', datos.token_sesion);
        localStorage.setItem('institucion_activa', JSON.stringify(datos.institucion));
        localStorage.setItem('usuario_activo', JSON.stringify(datos.usuario));

        this.institucion = datos.institucion;
        this.rol = datos.usuario.rol;
        this.nivel = datos.usuario.nivel;
        this.nombreRol = datos.usuario.nombre_rol;
        this.usuario = datos.usuario;

        await this.mostrarDashboard();
      }
      else if (datos && datos.tipo === 'selector_requerido') {
        // Multiples instituciones: mostrar selector
        this.mostrarSelectorInstituciones(datos);
      }
      else if (datos && datos.codigo === 'NO_REGISTRADO') {
        this.mostrarToast('⚠️ ' + datos.mensaje, 'error');
        auth.signOut();
      }
      else if (datos && datos.codigo === 'SIN_MEMBRESIA') {
        this.mostrarToast('⚠️ ' + datos.mensaje, 'error');
        auth.signOut();
      }
      else if (datos) {
        this.mostrarToast('Error: ' + (datos.error || 'No se pudo iniciar sesion'), 'error');
        auth.signOut();
      }
    } catch (error) {
      console.error('[APP] Error login:', error);
      this.mostrarToast('Error al iniciar sesion: ' + (error.message || 'Desconocido'), 'error');
    }
  }

  mostrarSelectorInstituciones(datos) {
    console.log('[APP] Selector de instituciones...');
    const app = document.getElementById('app');
    app.innerHTML = '';

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-tarjeta" style="max-width:500px;">
        <h3>Selecciona tu Institucion</h3>
        <p style="color:var(--texto-secundario);margin-bottom:16px;">
          Tienes acceso a ${datos.membresias.length} academias
        </p>
        <div id="listaInstituciones" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    `;
    app.appendChild(modal);

    const lista = document.getElementById('listaInstituciones');
    datos.membresias.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secundario';
      btn.style.textAlign = 'left';
      btn.innerHTML = `
        <div style="font-size:16px;font-weight:700;">${m.nombre_institucion}</div>
        <div style="font-size:12px;text-transform:uppercase;opacity:.7;">${m.nombre_rol || m.tipo_rol}</div>
      `;
      btn.addEventListener('click', async () => {
        try {
          const resultado = await api.seleccionarContexto(datos.token_preliminar, m.membresia_id);
          if (resultado && resultado.token_sesion) {
            localStorage.setItem('token_sesion', resultado.token_sesion);
            localStorage.setItem('institucion_activa', JSON.stringify(resultado.institucion));
            localStorage.setItem('usuario_activo', JSON.stringify(resultado.usuario));

            this.institucion = resultado.institucion;
            this.rol = resultado.usuario.rol;
            this.nivel = resultado.usuario.nivel;
            this.nombreRol = resultado.usuario.nombre_rol;
            this.usuario = resultado.usuario;

            await this.mostrarDashboard();
          }
        } catch (error) {
          this.mostrarToast('Error seleccionando institucion: ' + error.message, 'error');
        }
      });
      lista.appendChild(btn);
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar || !backdrop) return;
    sidebar.classList.toggle('abierto');
    backdrop.classList.toggle('visible');
  }

  async mostrarDashboard() {
    console.log('[APP] Dashboard para rol:', this.rol, 'nivel:', this.nivel);

    const app = document.getElementById('app');
    app.innerHTML = '';

    // Header
    const header = document.createElement('header');
    header.className = 'topbar';
    header.innerHTML = `
      <button class="brand-btn" id="btnSidebar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="logo">A</div>
        <div class="brand-text">
          <strong>Academia Addison</strong>
          <span>${this.institucion?.nombre_institucion || 'Sin institucion'}</span>
        </div>
      </button>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="badge" style="background:var(--rol-${this.rol});color:#fff;">${this.nombreRol || this.rol}</span>
        <button class="user-btn" id="btnUsuario">${this.usuario?.nombre || 'Usuario'}</button>
      </div>
    `;
    app.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'app-body';
    body.innerHTML = `
      <aside class="sidebar" id="sidebar"></aside>
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
      <main class="main" id="main"></main>
    `;
    app.appendChild(body);

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.innerHTML = `Academia Addison v3.0 • ${this.institucion?.nombre_institucion || ''}`;
    app.appendChild(footer);

    // Eventos
    document.getElementById('btnSidebar').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('abierto');
      document.getElementById('sidebarBackdrop').classList.toggle('visible');
    });
    document.getElementById('sidebarBackdrop').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('abierto');
      document.getElementById('sidebarBackdrop').classList.remove('visible');
    });

    // Renderizar contenido segun rol
    await this.renderizarSidebar();
    this.iniciarHeartbeat();
    await this.renderizarMain();
  }

  async renderizarSidebar() {
    const sidebar = document.getElementById('sidebar');

    try {
      const arbol = await api.obtenerArbol();
      // api.servicio.js ya desempaqueto -> arbol es { datos: [...] } o directo el array

      let html = `
        <div class="sidebar-top">
          <div class="sidebar-title-wrap">
            <div class="sidebar-header">Cursos</div>
            <div class="sidebar-group">${this.institucion?.nombre_institucion || ''}</div>
          </div>
          <div class="sidebar-overall">
            <div class="progreso-circular">
              <svg viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--borde)" stroke-width="3"/>
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--color-marca)" stroke-width="3" stroke-dasharray="0,100"/>
              </svg>
              <div class="pct">0%</div>
            </div>
          </div>
        </div>
      `;

      // Botones de admin
      if (['superadmin', 'director'].includes(this.rol)) {
        html += `<button class="btn btn-sm" style="margin:0 16px 12px;" id="btnCrearCurso">+ Nuevo Curso</button>`;
        html += `<button class="btn btn-sm btn-secundario" style="margin:0 16px 12px;display:flex;align-items:center;gap:6px;" onclick="app.navegar('arbol')">
          <span>🌳</span> Arbol Academico
        </button>`;
      }

      // Listar cursos del arbol
      html += `<div style="padding:0 16px;">`;
      const grupos = arbol?.datos || arbol || [];
      grupos.forEach(grupo => {
        html += `<div style="margin-bottom:8px;font-weight:700;font-size:13px;color:var(--texto-secundario);">${grupo.nombre_grupo}</div>`;
        const cursos = grupo.hijos || grupo.cursos || [];
        cursos.forEach(curso => {
          html += `
            <div class="curso-item" style="padding:10px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;font-size:14px;">${curso.nombre_curso}</span>
                <span class="badge">0%</span>
              </div>
            </div>
          `;
        });
      });
      html += `</div>`;

      sidebar.innerHTML = html;
    } catch (error) {
      console.error('[APP] Error cargando arbol:', error);
      sidebar.innerHTML = `<div style="padding:16px;color:var(--error);">Error cargando cursos</div>`;
    }
  }

  async renderizarMain() {
    const main = document.getElementById('main');

    // Live bar (profesor/director/superadmin)
    if (['superadmin', 'director', 'professor'].includes(this.rol)) {
      main.innerHTML += `
        <div class="live-bar">
          <div class="live-bar-left">
            <div class="live-dot"></div>
            <div>
              <div class="live-bar-title">Clase en vivo</div>
              <div class="live-bar-sub">Programa o inicia una clase</div>
            </div>
          </div>
          <button class="live-bar-btn" onclick="app.iniciarClaseEnVivo()">Iniciar ahora</button>
        </div>
      `;
    }

    main.innerHTML += `<div id="contenidoPrincipal"></div>`;

    if (this.rol === 'student') {
      await this.renderizarAlumno();
    } else if (this.rol === 'professor') {
      await this.renderizarProfesor();
    } else if (this.rol === 'director') {
      await this.renderizarDirector();
    } else if (this.rol === 'superadmin') {
      await this.renderizarSuperadmin();
    } else {
      // Rol desconocido: mostrar mensaje generico
      const contenedor = document.getElementById('contenidoPrincipal');
      contenedor.innerHTML = `<h2>Bienvenido ${this.usuario?.nombre || ''}</h2><p>Tu rol (${this.rol}) no tiene un panel asignado.</p>`;
    }
  }

  async renderizarAlumno() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
      <h2 style="margin-bottom:20px;">Mis Cursos</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
        <div class="tarjeta">
          <div class="tarjeta-cabecera">
            <strong>Algebra</strong>
            <span class="badge">45%</span>
          </div>
          <div class="barra-progreso"><span style="width:45%"></span></div>
          <p style="font-size:13px;color:var(--texto-secundario);">3 temas completados de 8</p>
        </div>
        <div class="tarjeta">
          <div class="tarjeta-cabecera">
            <strong>Aritmetica</strong>
            <span class="badge">20%</span>
          </div>
          <div class="barra-progreso"><span style="width:20%"></span></div>
          <p style="font-size:13px;color:var(--texto-secundario);">1 tema completado de 5</p>
        </div>
      </div>
    `;
  }

  async renderizarProfesor() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
      <h2 style="margin-bottom:20px;">Panel del Profesor</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('examenes')">
          <strong>📝 Examenes</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Crear y gestionar examenes</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('teorias')">
          <strong>📚 Teorias</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Subir contenido teorico</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('notas')">
          <strong>📊 Notas</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Ver calificaciones de alumnos</p>
        </div>
      </div>
    `;
  }

  async renderizarDirector() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
      <h2 style="margin-bottom:20px;">Panel de Administracion</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('arbol')">
          <strong>🌳 Arbol Academico</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Gestiona grupos, cursos, temas y subtemas</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('usuarios')">
          <strong>👥 Usuarios</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Matricular alumnos y contratar profesores</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('finanzas')">
          <strong>💰 Finanzas</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Pagos, descuentos y cierre de caja</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('calendario')">
          <strong>📅 Calendario</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Horario semanal y eventos</p>
        </div>
      </div>
    `;
  }

  async renderizarSuperadmin() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
      <h2 style="margin-bottom:20px;">Panel Superadmin</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('jerarquia')">
          <strong>🏛️ Jerarquia</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Gestion de usuarios por niveles infinitos</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('instituciones')">
          <strong>🏛️ Instituciones</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Crear y gestionar academias</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('finanzas-globales')">
          <strong>📈 Finanzas Globales</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Comparativas entre instituciones</p>
        </div>
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('auditoria')">
          <strong>🔍 Auditoria</strong>
          <p style="font-size:13px;color:var(--texto-secundario);">Log de actividades del sistema</p>
        </div>
      </div>
    `;
  }

  // ============ UTILIDADES ============

  mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo} fade-in`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('saliendo');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  navegar(vista) {
    console.log('[APP] Navegar a:', vista);
    if (vista === 'arbol') {
      ArbolAcademico.iniciar();
      return;
    }
    if (vista === 'jerarquia') {
      GestionJerarquia.iniciar();
      return;
    }
    if (vista === 'usuarios') {
      GestionUsuarios.iniciar();
      return;
    }
    this.mostrarToast('Navegando a ' + vista + '...', 'info');
  }

  iniciarClaseEnVivo() {
    this.mostrarToast('Iniciando clase en vivo...', 'info');
  }

  cerrarSesion() {
    this.detenerHeartbeat();
    this.limpiarSesion();
    auth.signOut();
    window.location.reload();
  }

  // ============ HEARTBEAT DE SESION ============
  // Verifica cada 30 segundos si la sesion sigue valida

  iniciarHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(async () => {
      const token = localStorage.getItem('token_sesion');
      if (!token) return;

      try {
        const resp = await fetch(`${API_CONFIG.BASE_URL}/sesion/verificar`, {
          headers: { 'Authorization': 'Bearer ' + token }
        });

        if (resp.status === 401) {
          const data = await resp.json().catch(() => ({}));
          let mensaje = 'Tu sesion ha sido cerrada por el administrador.';

          if (data.codigo === 'USUARIO_SUSPENDIDO') {
            mensaje = 'Tu cuenta ha sido suspendida. Contacta al administrador para renovar tu matricula.';
          } else if (data.codigo === 'USUARIO_ELIMINADO') {
            mensaje = 'Tu cuenta ha sido eliminada. Contacta al administrador para matricularte nuevamente.';
          } else if (data.codigo === 'SESION_REVOCADA') {
            mensaje = 'Tu sesion ha sido cerrada por el administrador. Vuelve a iniciar sesion.';
          }

          alert(mensaje);
          this.cerrarSesion();
          return;
        }

        if (!resp.ok) {
          console.warn('[HEARTBEAT] Error verificando sesion:', resp.status);
        }
      } catch (err) {
        console.warn('[HEARTBEAT] Error de red:', err.message);
      }
    }, 30000);
  }

  detenerHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// Inicializar app cuando cargue el DOM
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.iniciar();
});
