/* ============================================
   ARCHIVO: dashboard.ui.js
   MODULO: dashboard
   CONTRATO:
     - Solo renderizado HTML en #app
     - Recibe datos planos, NUNCA hace fetch
   ============================================ */

function renderizarDashboard({ usuario, institucion, rol, nombreRol, onLogout, onNavegar }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="topbar">
      <button class="brand-btn" id="btnSidebar">
        <div class="dots"><span></span><span></span><span></span></div>
        <div class="logo">A</div>
        <div class="brand-text">
          <strong>Academia Addison</strong>
          <span>${institucion?.nombre_institucion || 'Sin institución'}</span>
        </div>
      </button>
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="badge" style="background:var(--rol-${rol});color:#fff;">${nombreRol || rol}</span>
        <button class="user-btn" id="btnUsuario">${usuario?.nombre || 'Usuario'}</button>
        <button class="btn-icono" id="btnLogout" title="Cerrar sesión" style="font-size:18px;">🚪</button>
      </div>
    </header>
    <div class="app-body">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
      <main class="main" id="main"></main>
    </div>
    <footer class="app-footer">Academia Addison v3.3 • ${institucion?.nombre_institucion || ''}</footer>
  `;

  document.getElementById('btnSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('abierto');
    document.getElementById('sidebarBackdrop').classList.toggle('visible');
  });
  document.getElementById('sidebarBackdrop').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('abierto');
    document.getElementById('sidebarBackdrop').classList.remove('visible');
  });
  document.getElementById('btnLogout').addEventListener('click', onLogout);
}

function renderizarSidebar({ arbol, cursoActivoId, progreso, rol, onSeleccionarCurso, onNavegar }) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = `
    <div class="sidebar-top">
      <div class="sidebar-title-wrap">
        <div class="sidebar-header">📚 MIS CURSOS</div>
      </div>
    </div>
  `;

  // Boton de gestion para superadmin/director
  if (['superadmin','director'].includes(rol)) {
    html += `<button class="btn btn-sm" style="margin:0 16px 12px;" onclick="app.navegar('arbol')">🌳 Gestionar Arbol</button>`;
  }

  html += `<div style="padding:0 10px;">`;
  
  if (!arbol || arbol.length === 0) {
    html += `<p style="color:var(--texto-secundario);font-size:13px;padding:0 8px;">No hay cursos disponibles</p>`;
  } else {
    arbol.forEach(curso => {
      const prog = progreso?.cursos?.find(c => c.curso_id === curso.curso_id);
      const pct = formatearPorcentaje(prog?.porcentaje);
      const activo = curso.curso_id == cursoActivoId;
      const numTemas = (curso.hijos || []).length;
      const radio = 16;
      const circunferencia = 2 * Math.PI * radio;
      const offset = circunferencia - (pct / 100) * circunferencia;
      
      html += `
        <div class="curso-sidebar-item ${activo ? 'activo' : ''}" 
             data-curso-id="${curso.curso_id}">
          <div class="curso-sidebar-row">
            <div class="curso-sidebar-info">
              <div class="curso-nombre">${curso.nombre}</div>
              <div class="curso-temas-count">${numTemas} tema${numTemas !== 1 ? 's' : ''}</div>
            </div>
            <svg class="progreso-circular" viewBox="0 0 40 40">
              <circle class="progreso-circular-track" cx="20" cy="20" r="${radio}"/>
              <circle class="progreso-circular-fill" cx="20" cy="20" r="${radio}" 
                      stroke-dasharray="${circunferencia}" 
                      stroke-dashoffset="${offset}"/>
            </svg>
            <div class="curso-progreso-texto">${pct}%</div>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  
  // Separador y navegacion de modulos
  html += `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--borde);">
      <div class="sidebar-header" style="margin-bottom:8px;">⚙️ Modulos</div>
      <div style="padding:0 8px;">
  `;
  
  if (['superadmin','director'].includes(rol)) {
    html += `<div class="modulo-nav-item" onclick="app.navegar('instituciones')">🏛️ Instituciones</div>`;
    html += `<div class="modulo-nav-item" onclick="app.navegar('usuarios')">👥 Usuarios</div>`;
  }
  
  if (rol === 'superadmin') {
    html += `<div class="modulo-nav-item" onclick="app.navegar('finanzas-globales')">📈 Finanzas Globales</div>`;
    html += `<div class="modulo-nav-item" onclick="app.navegar('auditoria')">🔍 Auditoria</div>`;
  }
  
  html += `</div></div>`;
  
  sidebar.innerHTML = html;

  // Event listeners para cursos
  sidebar.querySelectorAll('.curso-sidebar-item').forEach(el => {
    el.addEventListener('click', () => {
      const cursoId = parseInt(el.dataset.cursoId);
      onSeleccionarCurso(cursoId);
    });
  });

  // Event listeners para navegacion de modulos
  sidebar.querySelectorAll(".nav-modulo-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const vista = btn.dataset.vista;
      onNavegar(vista);
      sidebar.classList.remove("abierto");
      document.getElementById("sidebarBackdrop")?.classList.remove("visible");
    });
  });
}
function renderizarPanelCurso({ curso, progreso, grabaciones, rol, puedeIniciarClase }) {
  const main = document.getElementById('main');
  if (!main) return;

  if (!curso) {
    main.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:40px;text-align:center;color:var(--texto-secundario);">
        <div style="font-size:64px;margin-bottom:16px;">📚</div>
        <h2 style="margin-bottom:8px;color:var(--texto-principal);">Bienvenido a Academia Addison</h2>
        <p>Selecciona un curso de la barra lateral para comenzar</p>
      </div>`;
    return;
  }

  const prog = progreso?.cursos?.find(c => c.curso_id === curso.curso_id);
  const pct = formatearPorcentaje(prog?.porcentaje);
  const temas = curso.hijos || [];
  
  // Filtrar grabaciones de este curso (por nombre_sala que contiene el curso_id)
  const grabacionesCurso = (grabaciones || []).filter(g => 
    g.nombre_sala && g.nombre_sala.includes(curso.nombre)
  );

  let html = `
    <div style="padding:20px;max-width:1000px;">
      <div class="panel-curso-header">
        <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:16px;">
          <div>
            <h1 class="panel-curso-titulo">📘 ${curso.nombre}</h1>
            <p class="panel-curso-desc">${curso.descripcion || 'Sin descripcion'}</p>
          </div>
          ${puedeIniciarClase ? `
            <button class="btn-clase-vivo" onclick="iniciarClaseEnVivo(${curso.curso_id}, '${curso.nombre.replace(/'/g, "\\'")}')">
              <span class="live-dot-inline"></span>
              Iniciar clase en vivo
            </button>
          ` : ''}
        </div>
        <div class="panel-curso-meta">
          <div class="panel-curso-progreso">
            <div class="progreso-barra-grande">
              <div class="progreso-barra-grande-fill" style="width:${pct}%;"></div>
            </div>
            <span class="progreso-porcentaje-grande">${pct}%</span>
          </div>
        </div>
      </div>
  `;

  if (temas.length === 0) {
    html += `<p style="color:var(--texto-secundario);">Este curso aun no tiene temas</p>`;
  } else {
    html += `<div class="temas-grid">`;
    temas.forEach((tema, idx) => {
      const subtemas = tema.hijos || [];
      html += `
        <div class="tema-card">
          <div class="tema-header" data-tema-id="${tema.tema_id}">
            <div>
              <div class="tema-nombre">📑 ${idx + 1}. ${tema.nombre}</div>
              <div class="tema-meta">${subtemas.length} subtema${subtemas.length !== 1 ? 's' : ''}</div>
            </div>
            <span class="tema-flecha">▼</span>
          </div>
          <div class="tema-body" id="tema-body-${tema.tema_id}">
            ${subtemas.length === 0 ? 
              `<p style="padding:16px 20px;color:var(--texto-secundario);font-size:13px;">Sin subtemas</p>` :
              `<div>
                ${subtemas.map((sub, sidx) => `
                  <div class="subtema-item">
                    <div class="subtema-numero">${sidx + 1}</div>
                    <div class="subtema-info">
                      <div class="subtema-nombre">📄 ${sub.nombre}</div>
                      <div class="subtema-estado">
                        <span class="subtema-estado-teoria">Teoria: ✗</span>
                        <span class="subtema-estado-examen">Examen: --</span>
                      </div>
                    </div>
                    <div class="subtema-acciones">
                      <button class="btn-subtema" onclick="app.mostrarToast('Teoria - En construccion', 'advertencia')">Teoria</button>
                      <button class="btn-subtema primario" onclick="app.mostrarToast('Examen - En construccion', 'advertencia')">Examen</button>
                    </div>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  // Grabaciones del curso
  if (grabacionesCurso.length > 0) {
    html += `
      <div class="grabaciones-section">
        <div class="grabaciones-titulo">🎥 Grabaciones de este curso</div>
        ${grabacionesCurso.map(g => {
          const duracion = g.duracion_segundos ? `${Math.floor(g.duracion_segundos / 60)}min` : 'En curso';
          const fecha = new Date(g.creado_en).toLocaleDateString('es-ES');
          return `
            <div class="grabacion-item" onclick="window.open('/live/room.html?grabacion=${g.grabacion_id}', '_blank')">
              <div class="grabacion-icono">▶</div>
              <div class="grabacion-info">
                <div class="grabacion-nombre">${g.nombre_sala}</div>
                <div class="grabacion-fecha">${fecha}</div>
              </div>
              <div class="grabacion-duracion">${duracion}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  html += `</div>`;
  main.innerHTML = html;

  // Acordeon de temas
  document.querySelectorAll('.tema-header').forEach(header => {
    header.addEventListener('click', () => {
      const temaId = header.dataset.temaId;
      const body = document.getElementById(`tema-body-${temaId}`);
      const isOpen = body.classList.contains('visible');
      
      if (isOpen) {
        body.classList.remove('visible');
        header.classList.remove('abierto');
      } else {
        body.classList.add('visible');
        header.classList.add('abierto');
      }
    });
  });
}

function renderizarPanel({ rol, onNavegar }) {
  const main = document.getElementById('main');
  if (!main) return;

  let html = '';
  if (['superadmin','director','profesor','professor'].includes(rol)) {
    html += `<div class="live-bar"><div class="live-bar-left"><div class="live-dot"></div><div><div class="live-bar-title">Clase en vivo</div><div class="live-bar-sub">Programa o inicia una clase</div></div></div><button class="live-bar-btn" onclick="app.iniciarClaseEnVivo()">Iniciar ahora</button></div>`;
  }
  html += `<div id="contenidoPrincipal"></div>`;
  main.innerHTML = html;
}

function renderizarPanelAlumno({ arbol, progreso, onSeleccionarCurso }) {
  const contenedor = document.getElementById('contenidoPrincipal');
  if (!contenedor) return;

  let html = `<h2 style="margin-bottom:8px;">Mis Cursos</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">`;
  if (!arbol || arbol.length === 0) {
    html += `<p style="color:var(--texto-secundario);">No estás matriculado en ningún curso</p>`;
  }

  arbol.forEach(curso => {
    const prog = progreso?.cursos?.find(c => c.curso_id === curso.curso_id);
    const pct = formatearPorcentaje(prog?.porcentaje);
    html += `
      <div class="tarjeta" style="cursor:pointer;" onclick="app.seleccionarCurso(${curso.curso_id})">
        <div class="tarjeta-cabecera"><strong>${curso.nombre}</strong><span class="badge">${pct}%</span></div>
        <div class="barra-progreso"><span style="width:${pct}%"></span></div>
        <p style="font-size:12px;color:var(--texto-secundario);margin-top:4px;">${truncarTexto(curso.descripcion, 80)}</p>
        <div style="margin-top:8px;font-size:12px;color:var(--texto-secundario);">${(curso.hijos || []).length} tema(s)</div>
      </div>`;
  });
  html += `</div>`;
  contenedor.innerHTML = html;
}

function renderizarPanelProfesor({ onNavegar }) {
  const contenedor = document.getElementById('contenidoPrincipal');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <h2 style="margin-bottom:20px;">Panel del Profesor</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('examenes')"><strong>📝 Exámenes</strong><p style="font-size:13px;color:var(--texto-secundario);">Crear y gestionar exámenes</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('teorias')"><strong>📚 Teorías</strong><p style="font-size:13px;color:var(--texto-secundario);">Subir contenido teórico</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('notas')"><strong>📊 Notas</strong><p style="font-size:13px;color:var(--texto-secundario);">Ver calificaciones</p></div>
    </div>`;
}

function renderizarPanelDirector({ onNavegar }) {
  const contenedor = document.getElementById('contenidoPrincipal');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <h2 style="margin-bottom:20px;">Panel de Administración</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('arbol')"><strong>🌳 Árbol Académico</strong><p style="font-size:13px;color:var(--texto-secundario);">Cursos, temas y subtemas</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('usuarios')"><strong>👥 Usuarios</strong><p style="font-size:13px;color:var(--texto-secundario);">Matricular y contratar</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('finanzas')"><strong>💰 Finanzas</strong><p style="font-size:13px;color:var(--texto-secundario);">Pagos y cierre de caja</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('calendario')"><strong>📅 Calendario</strong><p style="font-size:13px;color:var(--texto-secundario);">Horario y eventos</p></div>
    </div>`;
}

function renderizarPanelSuperadmin({ onNavegar }) {
  const contenedor = document.getElementById('contenidoPrincipal');
  if (!contenedor) return;
  contenedor.innerHTML = `
    <h2 style="margin-bottom:20px;">Panel Superadmin</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;">
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('usuarios')"><strong>👥 Usuarios</strong><p style="font-size:13px;color:var(--texto-secundario);">Administración de usuarios y permisos</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('instituciones')"><strong>🏛️ Instituciones</strong><p style="font-size:13px;color:var(--texto-secundario);">Crear y gestionar academias</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('finanzas-globales')"><strong>📈 Finanzas Globales</strong><p style="font-size:13px;color:var(--texto-secundario);">Comparativas</p></div>
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('auditoria')"><strong>🔍 Auditoría</strong><p style="font-size:13px;color:var(--texto-secundario);">Log del sistema</p></div>
    </div>`;
}
