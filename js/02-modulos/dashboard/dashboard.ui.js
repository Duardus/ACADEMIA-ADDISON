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
        <div class="sidebar-header">📚 Cursos</div>
      </div>
    </div>
  `;

  // Botón de gestión para superadmin/director
  if (['superadmin','director'].includes(rol)) {
    html += `<button class="btn btn-sm" style="margin:0 16px 12px;" onclick="app.navegar('arbol')">🌳 Gestionar Árbol</button>`;
  }

  html += `<div style="padding:0 8px;">`;
  
  if (!arbol || arbol.length === 0) {
    html += `<p style="color:var(--texto-secundario);font-size:13px;padding:0 8px;">No hay cursos disponibles</p>`;
  } else {
    arbol.forEach(curso => {
      const prog = progreso?.cursos?.find(c => c.curso_id === curso.curso_id);
      const pct = formatearPorcentaje(prog?.porcentaje);
      const activo = curso.curso_id == cursoActivoId;
      
      html += `
        <div class="curso-sidebar-item ${activo ? 'activo' : ''}" 
             data-curso-id="${curso.curso_id}"
             style="padding:10px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:3px;${activo ? 'background:var(--primario);color:#fff;' : 'background:var(--fondo-secundario);'}transition:all .2s;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;font-size:13px;">📘 ${curso.nombre}</span>
            <span class="badge" style="${activo ? 'background:rgba(255,255,255,0.2);color:#fff;' : ''}">${pct}%</span>
          </div>
          <div style="width:100%;height:3px;background:${activo ? 'rgba(255,255,255,0.3)' : 'var(--borde)'};border-radius:2px;overflow:hidden;margin-top:6px;">
            <div style="width:${pct}%;height:100%;background:${activo ? '#fff' : 'var(--color-marca)'};transition:width .3s;"></div>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  
  // Separador y navegación de módulos
  html += `
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--borde);">
      <div class="sidebar-header" style="margin-bottom:8px;">⚙️ Módulos</div>
      <div style="padding:0 8px;">
  `;
  
  if (['superadmin','director'].includes(rol)) {
    html += `<div class="modulo-nav-item" onclick="app.navegar('instituciones')" style="padding:8px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:3px;font-size:13px;">🏛️ Instituciones</div>`;
    html += `<div class="modulo-nav-item" onclick="app.navegar('usuarios')" style="padding:8px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:3px;font-size:13px;">👥 Usuarios</div>`;
  }
  
  if (rol === 'superadmin') {
    html += `<div class="modulo-nav-item" onclick="app.navegar('finanzas-globales')" style="padding:8px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:3px;font-size:13px;">📈 Finanzas Globales</div>`;
    html += `<div class="modulo-nav-item" onclick="app.navegar('auditoria')" style="padding:8px 12px;border-radius:var(--radio-borde-sm);cursor:pointer;margin-bottom:3px;font-size:13px;">🔍 Auditoría</div>`;
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
}

function renderizarPanelCurso({ curso, progreso }) {
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

  let html = `
    <div style="padding:20px;max-width:900px;">
      <div style="margin-bottom:24px;">
        <h1 style="margin:0 0 8px;font-size:28px;">📘 ${curso.nombre}</h1>
        <p style="color:var(--texto-secundario);margin:0 0 12px;">${curso.descripcion || 'Sin descripción'}</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="flex:1;height:8px;background:var(--borde);border-radius:4px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:var(--color-marca);transition:width .3s;"></div>
          </div>
          <span style="font-weight:700;color:var(--color-marca);">${pct}%</span>
        </div>
      </div>
  `;

  const temas = curso.hijos || [];
  if (temas.length === 0) {
    html += `<p style="color:var(--texto-secundario);">Este curso aún no tiene temas</p>`;
  } else {
    html += `<div style="display:flex;flex-direction:column;gap:12px;">`;
    temas.forEach((tema, idx) => {
      const subtemas = tema.hijos || [];
      html += `
        <div class="tema-card" style="background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);overflow:hidden;">
          <div class="tema-header" data-tema-id="${tema.tema_id}" style="padding:16px 20px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:16px;">📑 ${idx + 1}. ${tema.nombre}</div>
              <div style="font-size:12px;color:var(--texto-secundario);margin-top:2px;">${subtemas.length} subtema${subtemas.length !== 1 ? 's' : ''}</div>
            </div>
            <span class="tema-flecha" style="transition:transform .2s;">▼</span>
          </div>
          <div class="tema-body" id="tema-body-${tema.tema_id}" style="display:none;border-top:1px solid var(--borde);">
            ${subtemas.length === 0 ? 
              `<p style="padding:16px 20px;color:var(--texto-secundario);font-size:13px;">Sin subtemas</p>` :
              `<div style="padding:12px 20px;">
                ${subtemas.map((sub, sidx) => `
                  <div style="display:flex;align-items:center;padding:10px 12px;border-radius:var(--radio-borde-sm);margin-bottom:4px;background:var(--fondo-secundario);cursor:pointer;transition:background .2s;" onmouseover="this.style.background='var(--borde)'" onmouseout="this.style.background='var(--fondo-secundario)'">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:var(--primario);color:#fff;font-size:11px;font-weight:700;margin-right:12px;">${sidx + 1}</span>
                    <span style="font-size:14px;">📄 ${sub.nombre}</span>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  main.innerHTML = html;

  // Acordeón de temas
  document.querySelectorAll('.tema-header').forEach(header => {
    header.addEventListener('click', () => {
      const temaId = header.dataset.temaId;
      const body = document.getElementById(`tema-body-${temaId}`);
      const flecha = header.querySelector('.tema-flecha');
      
      if (body.style.display === 'none') {
        body.style.display = 'block';
        flecha.style.transform = 'rotate(180deg)';
      } else {
        body.style.display = 'none';
        flecha.style.transform = 'rotate(0deg)';
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
