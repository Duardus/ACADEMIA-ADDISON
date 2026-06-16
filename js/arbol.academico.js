/**
 * ÁRBOL ACADÉMICO INTERACTIVO — ACADEMIA ADDISON v3.0
 * Standalone: no depende de app.renderizarVista()
 */

const ArbolAcademico = {
  datos: [],
  nodoEliminando: null,
  tipoEliminando: null,

  iconos: { grupo: '📁', curso: '📘', tema: '📄', subtema: '🔖' },
  colores: { grupo: '#D30000', curso: '#FF4D8D', tema: '#4A90D9', subtema: '#50C878' },
  nombres: { grupo: 'Grupo', curso: 'Curso', tema: 'Tema', subtema: 'Subtema' },

  iniciar() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    
    appDiv.innerHTML = `
      <div class="layout-app">
        <header class="app-header">
          <div class="header-left">
            <button class="btn-icono" onclick="app.toggleSidebar()" id="btnMenu">☰</button>
            <span class="app-titulo">Academia Addison</span>
          </div>
          <div class="header-right">
            <span class="usuario-nombre">${app.usuario?.nombre || 'Usuario'}</span>
            <button class="btn-icono" onclick="app.cerrarSesion()">🚪</button>
          </div>
        </header>
        <div class="app-body">
          <aside class="sidebar" id="sidebar"></aside>
          <div class="sidebar-backdrop" id="sidebarBackdrop" onclick="app.toggleSidebar()"></div>
          <main class="main" id="main">
            <div class="arbol-header">
              <h2 class="arbol-titulo">🌳 Árbol Académico</h2>
              <button class="btn-primario" onclick="ArbolAcademico.mostrarModalCrear('grupo')">
                <span>+</span> Nuevo Grupo
              </button>
            </div>
            <div class="arbol-contenedor" id="arbol-contenedor">
              <div class="cargando-arbol">
                <div class="spinner"></div>
                <p>Cargando estructura académica...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
    
    // Renderizar sidebar
    if (app.renderizarSidebar) app.renderizarSidebar();
    
    this.cargar();
  },

  async cargar() {
    const contenedor = document.getElementById('arbol-contenedor');
    try {
      const respuesta = await api.obtenerArbol();
      this.datos = respuesta?.datos || respuesta?.arbol || [];
      this.renderizar();
    } catch (error) {
      if (contenedor) contenedor.innerHTML = `
        <div class="estado-vacio">
          <p>❌ Error al cargar: ${error.message}</p>
          <button class="btn-secundario" onclick="ArbolAcademico.cargar()">Reintentar</button>
        </div>`;
    }
  },

  renderizar() {
    const contenedor = document.getElementById('arbol-contenedor');
    if (!contenedor) return;

    if (this.datos.length === 0) {
      contenedor.innerHTML = `
        <div class="estado-vacio">
          <p>📭 No hay grupos creados</p>
          <button class="btn-primario" onclick="ArbolAcademico.mostrarModalCrear('grupo')">Crear Grupo</button>
        </div>`;
      return;
    }

    let html = '<div class="arbol-nivel arbol-nivel-raiz">';
    this.datos.forEach((grupo, i) => {
      html += this.renderizarNodo(grupo, 'grupo', 0, i === this.datos.length - 1);
    });
    html += '</div>';
    contenedor.innerHTML = html;
  },

  renderizarNodo(nodo, tipo, nivel = 0, esUltimo = false) {
    const id = nodo[`${tipo}_id`];
    const nombre = nodo[`nombre_${tipo}`] || nodo.nombre || 'Sin nombre';
    const orden = nodo.orden || 0;
    const estado = nodo.estado || 'active';
    const hijos = nodo.hijos || [];
    const tieneHijos = hijos.length > 0;
    const siguienteTipo = this.siguienteTipo(tipo);
    const puedeAgregar = tipo !== 'subtema';

    const clases = ['arbol-nodo'];
    if (estado !== 'active') clases.push('nodo-inactivo');
    if (esUltimo) clases.push('nodo-ultimo');

    let html = `
      <div class="${clases.join(' ')}" data-id="${id}" data-tipo="${tipo}" data-nivel="${nivel}">
        <div class="nodo-conector"></div>
        <div class="nodo-cabecera" style="border-left-color: ${this.colores[tipo]}">
          <span class="nodo-toggle ${tieneHijos ? '' : 'nodo-toggle-vacio'}" onclick="ArbolAcademico.toggle('${id}', '${tipo}')">${tieneHijos ? '▼' : '•'}</span>
          <span class="nodo-icono" style="color: ${this.colores[tipo]}">${this.iconos[tipo]}</span>
          <span class="nodo-nombre">${this.escaparHtml(nombre)}</span>
          <span class="nodo-meta"><span class="nodo-orden">#${orden}</span>${estado !== 'active' ? '<span class="nodo-estado-inactivo">borrador</span>' : ''}</span>
          <div class="nodo-acciones">
            <button class="btn-icono" onclick="ArbolAcademico.editar('${id}', '${tipo}')" title="Editar">✏️</button>
            <button class="btn-icono btn-peligro" onclick="ArbolAcademico.mostrarImpacto('${id}', '${tipo}')" title="Eliminar">🗑️</button>
            ${puedeAgregar ? `<button class="btn-icono btn-agregar" onclick="ArbolAcademico.mostrarModalCrear('${siguienteTipo}', '${id}')" title="Agregar">+</button>` : ''}
          </div>
        </div>
        <div class="nodo-hijos" id="hijos-${tipo}-${id}" style="display: block;">
    `;

    if (tieneHijos && siguienteTipo) {
      html += `<div class="arbol-nivel">`;
      hijos.forEach((hijo, idx) => {
        html += this.renderizarNodo(hijo, siguienteTipo, nivel + 1, idx === hijos.length - 1);
      });
      html += `</div>`;
    }
    html += `</div></div>`;
    return html;
  },

  siguienteTipo(tipo) {
    const m = { grupo: 'curso', curso: 'tema', tema: 'subtema' };
    return m[tipo];
  },

  toggle(id, tipo) {
    const hijos = document.getElementById(`hijos-${tipo}-${id}`);
    const nodo = document.querySelector(`[data-id="${id}"][data-tipo="${tipo}"]`);
    if (!hijos || !nodo) return;
    const toggle = nodo.querySelector('.nodo-toggle');
    const visible = hijos.style.display !== 'none';
    hijos.style.display = visible ? 'none' : 'block';
    toggle.textContent = visible ? '▶' : '▼';
  },

  mostrarModalCrear(tipo, padreId = null) {
    this.mostrarModal({ titulo: `Crear ${this.nombres[tipo]}`, tipo, padreId, datos: null });
  },

  editar(id, tipo) {
    const nodo = this.buscarNodo(this.datos, id, tipo);
    if (!nodo) return;
    this.mostrarModal({ titulo: `Editar ${this.nombres[tipo]}`, tipo, padreId: null, datos: nodo });
  },

  mostrarModal(config) {
    const { titulo, tipo, padreId, datos } = config;
    const nombre = datos ? (datos[`nombre_${tipo}`] || datos.nombre || '') : '';
    const orden = datos ? (datos.orden || 1) : 1;
    const id = datos ? (datos[`${tipo}_id`] || '') : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay activo';
    modal.id = 'modal-arbol';
    modal.innerHTML = `
      <div class="modal-panel modal-panel-arbol">
        <div class="modal-header"><h3>${titulo}</h3><button class="btn-cerrar" onclick="ArbolAcademico.cerrarModal()">✕</button></div>
        <form id="form-arbol" onsubmit="ArbolAcademico.guardar(event)">
          <input type="hidden" id="arbol-tipo" value="${tipo}">
          <input type="hidden" id="arbol-id" value="${id}">
          <input type="hidden" id="arbol-padre-id" value="${padreId || ''}">
          <div class="campo-formulario">
            <label>Nombre del ${this.nombres[tipo]}</label>
            <input type="text" id="arbol-nombre" value="${this.escaparHtml(nombre)}" placeholder="Ej: ${this.ejemploNombre(tipo)}" required maxlength="100">
          </div>
          <div class="campo-formulario">
            <label>Orden</label>
            <input type="number" id="arbol-orden" value="${orden}" min="1" max="999" required>
          </div>
          <div class="modal-acciones">
            <button type="button" class="btn-secundario" onclick="ArbolAcademico.cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primario">Guardar</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('arbol-nombre').focus(), 100);
  },

  cerrarModal() {
    const m = document.getElementById('modal-arbol');
    if (m) m.remove();
  },

  async guardar(evento) {
    evento.preventDefault();
    const tipo = document.getElementById('arbol-tipo').value;
    const id = document.getElementById('arbol-id').value;
    const padreId = document.getElementById('arbol-padre-id').value;
    const nombre = document.getElementById('arbol-nombre').value.trim();
    const orden = parseInt(document.getElementById('arbol-orden').value);

    if (!nombre) { app.mostrarToast('Nombre obligatorio', 'error'); return; }

    const datos = { [`nombre_${tipo}`]: nombre, orden: orden, estado: 'active' };
    if (padreId) {
      const campoPadre = { curso: 'grupo_id', tema: 'curso_id', subtema: 'tema_id' }[tipo];
      if (campoPadre) datos[campoPadre] = padreId;
    }

    try {
      const btn = evento.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Guardando...';

      if (id) {
        await api.actualizarArbol(tipo, id, datos);
        app.mostrarToast(`${this.nombres[tipo]} actualizado`, 'exito');
      } else {
        const endpoint = { grupo: 'grupos', curso: 'cursos', tema: 'temas', subtema: 'subtemas' }[tipo];
        await api._llamar(`/arbol/${endpoint}`, { method: 'POST', body: JSON.stringify(datos) });
        app.mostrarToast(`${this.nombres[tipo]} creado`, 'exito');
      }
      this.cerrarModal();
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
      const btn = evento.target.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    }
  },

  mostrarImpacto(id, tipo) {
    const nodo = this.buscarNodo(this.datos, id, tipo);
    if (!nodo) return;
    this.nodoEliminando = nodo;
    this.tipoEliminando = tipo;

    const impacto = this.calcularImpacto(nodo, tipo);
    const nombre = nodo[`nombre_${tipo}`] || nodo.nombre || 'Sin nombre';

    const drawer = document.createElement('div');
    drawer.className = 'drawer-overlay activo';
    drawer.id = 'drawer-impacto';
    drawer.innerHTML = `
      <div class="drawer-panel drawer-panel-impacto">
        <div class="drawer-header"><h3>⚠️ Confirmar Eliminación</h3><button class="btn-cerrar" onclick="ArbolAcademico.cerrarDrawer()">✕</button></div>
        <div class="drawer-contenido">
          <div class="impacto-resumen">
            <p>Vas a eliminar: <strong>${this.escaparHtml(nombre)}</strong></p>
            <p class="impacto-total">Afectará a <strong>${impacto.total} elementos</strong></p>
          </div>
          <div class="arbol-impacto">${this.renderizarImpacto(impacto.detalles)}</div>
          <div class="confirmacion-eliminacion">
            <p>Escribe <strong>ELIMINAR</strong> para confirmar:</p>
            <input type="text" id="confirmar-texto" placeholder="ELIMINAR" autocomplete="off">
            <select id="motivo-eliminacion">
              <option value="">Motivo...</option>
              <option value="error_creacion">Error de creación</option>
              <option value="contenido_obsoleto">Contenido obsoleto</option>
              <option value="reestructuracion">Reestructuración</option>
              <option value="duplicado">Duplicado</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="drawer-acciones">
          <button class="btn-secundario" onclick="ArbolAcademico.cerrarDrawer()">Cancelar</button>
          <button class="btn-peligro" onclick="ArbolAcademico.confirmarEliminar()" id="btn-confirmar-eliminar">Eliminar</button>
        </div>
      </div>`;
    document.body.appendChild(drawer);
  },

  cerrarDrawer() {
    const d = document.getElementById('drawer-impacto');
    if (d) d.remove();
    this.nodoEliminando = null;
    this.tipoEliminando = null;
  },

  calcularImpacto(nodo, tipo) {
    let total = 0;
    const detalles = [];
    const recorrer = (n, t, p = 0) => {
      const hijos = n.hijos || [];
      const st = this.siguienteTipo(t);
      if (!st) return;
      hijos.forEach(h => {
        total++;
        detalles.push({ tipo: st, nombre: h[`nombre_${st}`] || h.nombre || 'Sin nombre', profundidad: p, icono: this.iconos[st], color: this.colores[st] });
        recorrer(h, st, p + 1);
      });
    };
    recorrer(nodo, tipo);
    return { total, detalles };
  },

  renderizarImpacto(detalles) {
    if (!detalles.length) return '<p class="impacto-vacio">No hay elementos dependientes.</p>';
    let html = '<ul class="lista-impacto">';
    detalles.forEach(i => {
      html += `<li class="item-impacto" style="padding-left:${i.profundidad * 20}px"><span class="item-icono" style="color:${i.color}">${i.icono}</span><span class="item-nombre">${this.escaparHtml(i.nombre)}</span><span class="item-tipo">${this.nombres[i.tipo]}</span></li>`;
    });
    html += '</ul>';
    return html;
  },

  async confirmarEliminar() {
    const texto = document.getElementById('confirmar-texto').value.trim();
    const motivo = document.getElementById('motivo-eliminacion').value;
    if (texto !== 'ELIMINAR') { app.mostrarToast('Escribe ELIMINAR exactamente', 'error'); return; }
    if (!motivo) { app.mostrarToast('Selecciona un motivo', 'error'); return; }

    const nodo = this.nodoEliminando;
    const tipo = this.tipoEliminando;
    const id = nodo[`${tipo}_id`];

    try {
      document.getElementById('btn-confirmar-eliminar').disabled = true;
      document.getElementById('btn-confirmar-eliminar').textContent = 'Eliminando...';
      await api.eliminarArbol(tipo, id, motivo);
      app.mostrarToast(`${this.nombres[tipo]} eliminado`, 'exito');
      this.cerrarDrawer();
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
      const btn = document.getElementById('btn-confirmar-eliminar');
      if (btn) { btn.disabled = false; btn.textContent = 'Eliminar'; }
    }
  },

  buscarNodo(arbol, id, tipo) {
    for (const n of arbol) {
      if (n[`${tipo}_id`] === id) return n;
      if (n.hijos) { const e = this.buscarNodo(n.hijos, id, tipo); if (e) return e; }
    }
    return null;
  },

  escaparHtml(t) {
    if (!t) return '';
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  ejemploNombre(tipo) {
    return { grupo: 'Grupo A - 2026', curso: 'Matemáticas Avanzadas', tema: 'Álgebra Lineal', subtema: 'Matrices y Determinantes' }[tipo];
  }
};

window.ArbolAcademico = ArbolAcademico;
