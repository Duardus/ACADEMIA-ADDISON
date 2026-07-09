/* ============================================
   📁 ARCHIVO: dashboard.ui.js
   📂 MÓDULO: dashboard
   🔗 DEPENDENCIAS: utilidades.js (01-nucleo)
   📝 CONTRATO:
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

function renderizarSidebar({ arbol, progreso, rol, onNavegar }) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let html = `
    <div class="sidebar-top">
      <div class="sidebar-title-wrap">
        <div class="sidebar-header">Cursos</div>
      </div>
    </div>
  `;

  if (['superadmin','director'].includes(rol)) {
    html += `<button class="btn btn-sm" style="margin:0 16px 12px;" onclick="app.navegar('arbol')">+ Nuevo Curso</button>`;
  }

  html += `<div style="padding:0 16px;">`;
  if (!arbol || arbol.length === 0) {
    html += `<p style="color:var(--texto-secundario);font-size:13px;">No hay cursos disponibles</p>`;
  }

  arbol.forEach(grupo => {
    html += `<div style="margin-bottom:12px;">
      <div style="font-weight:700;font-size:13px;color:var(--texto-secundario);margin-bottom:4px;">📁 ${grupo.nombre_grupo || grupo.nombre}</div>`;
    const cursos = grupo.hijos || grupo.cursos || [];
    cursos.forEach(curso => {
      const prog = progreso?.cursos?.find(c => c.curso_id === (curso.curso_id || curso.id));
      const pct = formatearPorcentaje(prog?.porcentaje);
      html += `
        <div class="curso-item" style="padding:8px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:4px;background:var(--fondo-secundario);" onclick="app.navegar('curso-${curso.curso_id || curso.id}')">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;font-size:13px;">${curso.nombre_curso || curso.nombre}</span>
            <span class="badge">${pct}%</span>
          </div>
          <div style="width:100%;height:3px;background:var(--borde);border-radius:2px;overflow:hidden;margin-top:4px;">
            <div style="width:${pct}%;height:100%;background:var(--color-marca);transition:width .3s;"></div>
          </div>
        </div>`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  sidebar.innerHTML = html;
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

function renderizarPanelAlumno({ arbol, progreso }) {
  const contenedor = document.getElementById('contenidoPrincipal');
  if (!contenedor) return;

  let html = `<h2 style="margin-bottom:8px;">Mis Cursos</h2><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">`;
  if (!arbol || arbol.length === 0) {
    html += `<p style="color:var(--texto-secundario);">No estás matriculado en ningún curso</p>`;
  }

  arbol.forEach(grupo => {
    const cursos = grupo.hijos || grupo.cursos || [];
    cursos.forEach(curso => {
      const prog = progreso?.cursos?.find(c => c.curso_id === (curso.curso_id || curso.id));
      const pct = formatearPorcentaje(prog?.porcentaje);
      html += `
        <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('curso-${curso.curso_id || curso.id}')">
          <div class="tarjeta-cabecera"><strong>${curso.nombre_curso || curso.nombre}</strong><span class="badge">${pct}%</span></div>
          <div class="barra-progreso"><span style="width:${pct}%"></span></div>
          <p style="font-size:12px;color:var(--texto-secundario);margin-top:4px;">${truncarTexto(curso.descripcion, 80)}</p>
        </div>`;
    });
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
      <div class="tarjeta" style="cursor:pointer;" onclick="app.navegar('arbol')"><strong>🌳 Árbol Académico</strong><p style="font-size:13px;color:var(--texto-secundario);">Grupos, cursos, temas y subtemas</p></div>
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
