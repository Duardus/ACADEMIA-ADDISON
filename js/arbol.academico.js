/**
 * ÁRBOL ACADÉMICO INTERACTIVO — ACADEMIA ADDISON v3.0
 * Grupos > Cursos > Temas > Subtemas
 * Reglas: Español descriptivo, acciones directas, drawer de impacto
 */

const ArbolAcademico = {
  datos: [],
  nodoEliminando: null,
  tipoEliminando: null,

  iconos: {
    grupo: '📁',
    curso: '📘',
    tema: '📄',
    subtema: '🔖'
  },

  colores: {
    grupo: '#D30000',
    curso: '#FF4D8D',
    tema: '#4A90D9',
    subtema: '#50C878'
  },

  nombres: {
    grupo: 'Grupo Académico',
    curso: 'Curso',
    tema: 'Tema',
    subtema: 'Subtema'
  },

  async iniciar() {
    app.renderizarVista({
      titulo: 'Árbol Académico',
      contenido: `
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
      `,
      accionPost: () => this.cargar()
    });
  },

  async cargar() {
    try {
      const respuesta = await api.obtenerArbol();
      this.datos = respuesta?.datos || respuesta?.arbol || [];
      this.renderizar();
    } catch (error) {
      document.getElementById('arbol-contenedor').innerHTML = `
        <div class="estado-vacio">
          <p>❌ Error al cargar el árbol académico</p>
          <p class="texto-secundario">${error.message}</p>
          <button class="btn-secundario" onclick="ArbolAcademico.cargar()">Reintentar</button>
        </div>
      `;
    }
  },

  renderizar() {
    const contenedor = document.getElementById('arbol-contenedor');
    if (!contenedor) return;

    if (this.datos.length === 0) {
      contenedor.innerHTML = `
        <div class="estado-vacio">
          <p>📭 No hay grupos académicos creados</p>
          <p class="texto-secundario">Comienza creando tu primer grupo académico</p>
          <button class="btn-primario" onclick="ArbolAcademico.mostrarModalCrear('grupo')">Crear Grupo</button>
        </div>
      `;
      return;
    }

    let html = '<div class="arbol-nivel arbol-nivel-raiz">';
    this.datos.forEach((grupo, indice) => {
      html += this.renderizarNodo(grupo, 'grupo', 0, indice === this.datos.length - 1);
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

    const clasesNodo = ['arbol-nodo'];
    if (estado !== 'active') clasesNodo.push('nodo-inactivo');
    if (esUltimo) clasesNodo.push('nodo-ultimo');

    let html = `
      <div class="${clasesNodo.join(' ')}" data-id="${id}" data-tipo="${tipo}" data-nivel="${nivel}">
        <div class="nodo-conector"></div>
        <div class="nodo-cabecera" style="border-left-color: ${this.colores[tipo]}">
          <span class="nodo-toggle ${tieneHijos ? '' : 'nodo-toggle-vacio'}" 
                onclick="ArbolAcademico.toggle('${id}', '${tipo}')">
            ${tieneHijos ? '▼' : '•'}
          </span>
          <span class="nodo-icono" style="color: ${this.colores[tipo]}">${this.iconos[tipo]}</span>
          <span class="nodo-nombre">${this.escaparHtml(nombre)}</span>
          <span class="nodo-meta">
            <span class="nodo-orden">#${orden}</span>
            ${estado !== 'active' ? '<span class="nodo-estado nodo-estado-inactivo">borrador</span>' : ''}
          </span>
          <div class="nodo-acciones">
            <button class="btn-icono" onclick="ArbolAcademico.clonar('${id}', '${tipo}')" title="Clonar">📋</button>
            <button class="btn-icono" onclick="ArbolAcademico.editar('${id}', '${tipo}')" title="Editar">✏️</button>
            <button class="btn-icono btn-peligro" onclick="ArbolAcademico.mostrarImpacto('${id}', '${tipo}')" title="Eliminar">🗑️</button>
            ${puedeAgregar ? `
              <button class="btn-icono btn-agregar" onclick="ArbolAcademico.mostrarModalCrear('${siguienteTipo}', '${id}')" 
                      title="Agregar ${this.nombres[siguienteTipo]}">+</button>
            ` : ''}
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
    const mapa = { grupo: 'curso', curso: 'tema', tema: 'subtema' };
    return mapa[tipo];
  },

  toggle(id, tipo) {
    const hijos = document.getElementById(`hijos-${tipo}-${id}`);
    const nodo = document.querySelector(`[data-id="${id}"][data-tipo="${tipo}"]`);
    if (!hijos || !nodo) return;
    const toggle = nodo.querySelector('.nodo-toggle');
    const estaVisible = hijos.style.display !== 'none';
    if (estaVisible) {
      hijos.style.display = 'none';
      toggle.textContent = '▶';
    } else {
      hijos.style.display = 'block';
      toggle.textContent = '▼';
    }
  },

  mostrarModalCrear(tipo, padreId = null) {
    const titulo = padreId ? `Crear ${this.nombres[tipo]}` : `Crear ${this.nombres[tipo]}`;
    this.mostrarModal({ titulo, tipo, padreId, datos: null });
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
        <div class="modal-header">
          <h3>${titulo}</h3>
          <button class="btn-cerrar" onclick="ArbolAcademico.cerrarModal()">✕</button>
        </div>
        <form id="form-arbol" onsubmit="ArbolAcademico.guardar(event)">
          <input type="hidden" id="arbol-tipo" value="${tipo}">
          <input type="hidden" id="arbol-id" value="${id}">
          <input type="hidden" id="arbol-padre-id" value="${padreId || ''}">
          
          <div class="campo-formulario">
            <label for="arbol-nombre">Nombre del ${this.nombres[tipo]}</label>
            <input type="text" id="arbol-nombre" value="${this.escaparHtml(nombre)}" 
                   placeholder="Ej: ${this.ejemploNombre(tipo)}" required maxlength="100">
          </div>
          
          <div class="campo-formulario">
            <label for="arbol-orden">Orden de aparición</label>
            <input type="number" id="arbol-orden" value="${orden}" min="1" max="999" required>
            <span class="ayuda-campo">Número para ordenar en la lista (1 = primero)</span>
          </div>
          
          <div class="modal-acciones">
            <button type="button" class="btn-secundario" onclick="ArbolAcademico.cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primario">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('arbol-nombre').focus(), 100);
  },

  cerrarModal() {
    const modal = document.getElementById('modal-arbol');
    if (modal) modal.remove();
  },

  async guardar(evento) {
    evento.preventDefault();
    const tipo = document.getElementById('arbol-tipo').value;
    const id = document.getElementById('arbol-id').value;
    const padreId = document.getElementById('arbol-padre-id').value;
    const nombre = document.getElementById('arbol-nombre').value.trim();
    const orden = parseInt(document.getElementById('arbol-orden').value);

    if (!nombre) {
      app.mostrarToast('El nombre es obligatorio', 'error');
      return;
    }

    const datos = { [`nombre_${tipo}`]: nombre, orden: orden, estado: 'active' };
    if (padreId) {
      const campoPadre = this.campoPadre(tipo);
      datos[campoPadre] = padreId;
    }

    try {
      const boton = evento.target.querySelector('button[type="submit"]');
      boton.disabled = true;
      boton.textContent = 'Guardando...';

      if (id) {
        await api._llamar(`/arbol/${tipo}/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
        app.mostrarToast(`${this.nombres[tipo]} actualizado`, 'exito');
      } else {
        await api._llamar(`/arbol/${tipo}`, { method: 'POST', body: JSON.stringify(datos) });
        app.mostrarToast(`${this.nombres[tipo]} creado`, 'exito');
      }

      this.cerrarModal();
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
      const boton = evento.target.querySelector('button[type="submit"]');
      boton.disabled = false;
      boton.textContent = 'Guardar';
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
        <div class="drawer-header">
          <h3>⚠️ Confirmar Eliminación</h3>
          <button class="btn-cerrar" onclick="ArbolAcademico.cerrarDrawer()">✕</button>
        </div>
        <div class="drawer-contenido">
          <div class="impacto-resumen">
            <p>Vas a eliminar: <strong>${this.escaparHtml(nombre)}</strong></p>
            <p class="impacto-total">Esto afectará a <strong>${impacto.total} elementos</strong> dependientes:</p>
          </div>
          <div class="arbol-impacto">${this.renderizarImpacto(impacto.detalles)}</div>
          <div class="confirmacion-eliminacion">
            <p>Para confirmar, escribe <strong>ELIMINAR</strong> y selecciona un motivo:</p>
            <input type="text" id="confirmar-texto" placeholder="Escribe ELIMINAR aquí" autocomplete="off">
            <select id="motivo-eliminacion">
              <option value="">Selecciona motivo...</option>
              <option value="error_creacion">Error de creación</option>
              <option value="contenido_obsoleto">Contenido obsoleto</option>
              <option value="reestructuracion">Reestructuración académica</option>
              <option value="duplicado">Contenido duplicado</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div class="drawer-acciones">
          <button class="btn-secundario" onclick="ArbolAcademico.cerrarDrawer()">Cancelar</button>
          <button class="btn-peligro" onclick="ArbolAcademico.confirmarEliminar()" id="btn-confirmar-eliminar">Eliminar Permanentemente</button>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);
  },

  cerrarDrawer() {
    const drawer = document.getElementById('drawer-impacto');
    if (drawer) drawer.remove();
    this.nodoEliminando = null;
    this.tipoEliminando = null;
  },

  calcularImpacto(nodo, tipo) {
    let total = 0;
    const detalles = [];
    const recorrer = (n, t, profundidad = 0) => {
      const hijos = n.hijos || [];
      const sigTipo = this.siguienteTipo(t);
      if (!sigTipo) return;
      hijos.forEach(hijo => {
        total++;
        const nombreHijo = hijo[`nombre_${sigTipo}`] || hijo.nombre || 'Sin nombre';
        detalles.push({ tipo: sigTipo, nombre: nombreHijo, profundidad, icono: this.iconos[sigTipo], color: this.colores[sigTipo] });
        recorrer(hijo, sigTipo, profundidad + 1);
      });
    };
    recorrer(nodo, tipo);
    return { total, detalles };
  },

  renderizarImpacto(detalles) {
    if (detalles.length === 0) return '<p class="impacto-vacio">No hay elementos dependientes directos.</p>';
    let html = '<ul class="lista-impacto">';
    detalles.forEach(item => {
      const indent = item.profundidad * 20;
      html += `<li class="item-impacto" style="padding-left: ${indent}px"><span class="item-icono" style="color: ${item.color}">${item.icono}</span><span class="item-nombre">${this.escaparHtml(item.nombre)}</span><span class="item-tipo">${this.nombres[item.tipo]}</span></li>`;
    });
    html += '</ul>';
    return html;
  },

  async confirmarEliminar() {
    const texto = document.getElementById('confirmar-texto').value.trim();
    const motivo = document.getElementById('motivo-eliminacion').value;
    if (texto !== 'ELIMINAR') { app.mostrarToast('Debes escribir ELIMINAR exactamente', 'error'); return; }
    if (!motivo) { app.mostrarToast('Selecciona un motivo', 'error'); return; }

    const nodo = this.nodoEliminando;
    const tipo = this.tipoEliminando;
    const id = nodo[`${tipo}_id`];

    try {
      document.getElementById('btn-confirmar-eliminar').disabled = true;
      document.getElementById('btn-confirmar-eliminar').textContent = 'Eliminando...';
      await api._llamar(`/arbol/${tipo}/${id}`, { method: 'DELETE', body: JSON.stringify({ motivo_eliminacion: motivo }) });
      app.mostrarToast(`${this.nombres[tipo]} archivado correctamente`, 'exito');
      this.cerrarDrawer();
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
      document.getElementById('btn-confirmar-eliminar').disabled = false;
      document.getElementById('btn-confirmar-eliminar').textContent = 'Eliminar Permanentemente';
    }
  },

  async clonar(id, tipo) {
    const nodo = this.buscarNodo(this.datos, id, tipo);
    if (!nodo) return;
    const nombre = nodo[`nombre_${tipo}`] || nodo.nombre || 'Sin nombre';
    if (!confirm(`¿Clonar "${nombre}" como borrador?`)) return;
    try {
      await api._llamar(`/arbol/${tipo}/${id}/clonar`, { method: 'POST' });
      app.mostrarToast(`${this.nombres[tipo]} clonado como borrador`, 'exito');
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
    }
  },

  buscarNodo(arbol, id, tipo) {
    for (const nodo of arbol) {
      if (nodo[`${tipo}_id`] === id) return nodo;
      if (nodo.hijos) {
        const encontrado = this.buscarNodo(nodo.hijos, id, tipo);
        if (encontrado) return encontrado;
      }
    }
    return null;
  },

  campoPadre(tipo) {
    const mapa = { curso: 'grupo_id', tema: 'curso_id', subtema: 'tema_id' };
    return mapa[tipo];
  },

  ejemploNombre(tipo) {
    const ejemplos = { grupo: 'Grupo A - 2026', curso: 'Matemáticas Avanzadas', tema: 'Álgebra Lineal', subtema: 'Matrices y Determinantes' };
    return ejemplos[tipo];
  },

  escaparHtml(texto) {
    if (!texto) return '';
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

window.ArbolAcademico = ArbolAcademico;
