/**
 * ÁRBOL ACADÉMICO INTERACTIVO — ACADEMIA ADDISON v3.1
 * Conectado al backend real
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
            <button class="btn-icono" onclick="app.mostrarDashboard()" title="Volver al dashboard" style="font-size:1.2rem;">←</button>
            <span class="app-titulo">Academia Addison</span>
          </div>
          <div class="header-right">
            <span class="usuario-nombre">${app.usuario?.nombre || 'Usuario'}</span>
            <button class="btn-icono" onclick="app.cerrarSesion()">🚪</button>
          </div>
        </header>
        <div class="app-body">
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
    
    this.cargar();
  },

  async cargar() {
    const contenedor = document.getElementById('arbol-contenedor');
    try {
      const respuesta = await api.obtenerArbol();
      this.datos = respuesta || [];
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
      <div class="${clases.join(' ')}" style="--nivel: ${nivel}; --color: ${this.colores[tipo]}">
        <div class="arbol-linea-vertical"></div>
        <div class="arbol-linea-horizontal"></div>
        
        <div class="arbol-contenido">
          <div class="arbol-cabecera" onclick="ArbolAcademico.toggleExpandir(${id}, '${tipo}')">
            <span class="arbol-icono">${this.iconos[tipo]}</span>
            <div class="arbol-info">
              <span class="arbol-nombre">${nombre}</span>
              <span class="arbol-meta">Orden ${orden} ${estado !== 'active' ? '• Inactivo' : ''}</span>
            </div>
            <div class="arbol-acciones">
              ${puedeAgregar ? `<button class="btn-icono" onclick="event.stopPropagation(); ArbolAcademico.mostrarModalCrear('${siguienteTipo}', ${id})" title="Agregar ${this.nombres[siguienteTipo]}">+</button>` : ''}
              <button class="btn-icono" onclick="event.stopPropagation(); ArbolAcademico.mostrarModalEditar('${tipo}', ${id})" title="Editar">✏️</button>
              <button class="btn-icono btn-peligro" onclick="event.stopPropagation(); ArbolAcademico.confirmarEliminar('${tipo}', ${id}, '${nombre.replace(/'/g, "\\'")}')" title="Eliminar">🗑️</button>
            </div>
          </div>
          
          ${tieneHijos ? `
            <div class="arbol-hijos" id="hijos-${tipo}-${id}">
              ${hijos.map((hijo, idx) => this.renderizarNodo(hijo, siguienteTipo, nivel + 1, idx === hijos.length - 1)).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    return html;
  },

  siguienteTipo(tipo) {
    const mapa = { grupo: 'curso', curso: 'tema', tema: 'subtema', subtema: null };
    return mapa[tipo];
  },

  toggleExpandir(id, tipo) {
    const contenedor = document.getElementById(`hijos-${tipo}-${id}`);
    if (contenedor) contenedor.classList.toggle('colapsado');
  },

  mostrarModalCrear(tipo, padreId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-crear';
    modal.innerHTML = `
      <div class="modal-tarjeta" style="max-width: 500px;">
        <h3>Crear ${this.nombres[tipo]}</h3>
        <form id="form-crear" onsubmit="ArbolAcademico.guardar(event)">
          <input type="hidden" id="tipo-crear" value="${tipo}">
          <input type="hidden" id="padre-id" value="${padreId || ''}">
          
          <div class="campo">
            <label>Nombre</label>
            <input type="text" id="nombre-crear" required placeholder="Ej: ${this.nombres[tipo]} de ejemplo">
          </div>
          
          <div class="campo">
            <label>Descripción</label>
            <textarea id="descripcion-crear" rows="3" placeholder="Descripción opcional"></textarea>
          </div>
          
          <div class="campo">
            <label>Orden</label>
            <input type="number" id="orden-crear" value="1" min="1">
          </div>
          
          <div class="modal-acciones">
            <button type="button" class="btn-secundario" onclick="document.getElementById('modal-crear').remove()">Cancelar</button>
            <button type="submit" class="btn-primario">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async guardar(evento) {
    evento.preventDefault();
    const tipo = document.getElementById('tipo-crear').value;
    const padreId = document.getElementById('padre-id').value;
    const nombre = document.getElementById('nombre-crear').value;
    const descripcion = document.getElementById('descripcion-crear').value;
    const orden = parseInt(document.getElementById('orden-crear').value);

    try {
      let datos = { nombre, descripcion, orden };
      
      // FIX: Usar endpoint correcto según tipo
      if (tipo === 'grupo') {
        // Grupo se crea en /jerarquia/grupos (no en /arbol/grupos)
        await api.crearGrupo(datos);
      } else if (tipo === 'curso') {
        datos.grupo_id = padreId;
        await api.crearCurso(datos);
      } else {
        // tema y subtema usan actualizarArbol con PUT
        const padreTipo = tipo === 'tema' ? 'curso' : 'tema';
        await api.actualizarArbol(padreTipo, padreId, { [`nombre_${tipo}`]: nombre, descripcion, orden });
      }

      document.getElementById('modal-crear').remove();
      this.mostrarToast('✅ ' + this.nombres[tipo] + ' creado correctamente');
      await this.cargar();
    } catch (error) {
      this.mostrarToast('❌ Error: ' + error.message, 'error');
    }
  },

  mostrarModalEditar(tipo, id) {
    const nodo = this.encontrarNodo(this.datos, tipo, id);
    if (!nodo) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-editar';
    modal.innerHTML = `
      <div class="modal-tarjeta" style="max-width: 500px;">
        <h3>Editar ${this.nombres[tipo]}</h3>
        <form id="form-editar" onsubmit="ArbolAcademico.actualizar(event)">
          <input type="hidden" id="tipo-editar" value="${tipo}">
          <input type="hidden" id="id-editar" value="${id}">
          
          <div class="campo">
            <label>Nombre</label>
            <input type="text" id="nombre-editar" value="${nodo['nombre_' + tipo] || nodo.nombre || ''}" required>
          </div>
          
          <div class="campo">
            <label>Descripción</label>
            <textarea id="descripcion-editar" rows="3">${nodo.descripcion || ''}</textarea>
          </div>
          
          <div class="campo">
            <label>Orden</label>
            <input type="number" id="orden-editar" value="${nodo.orden || 1}" min="1">
          </div>
          
          <div class="modal-acciones">
            <button type="button" class="btn-secundario" onclick="document.getElementById('modal-editar').remove()">Cancelar</button>
            <button type="submit" class="btn-primario">Guardar cambios</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async actualizar(evento) {
    evento.preventDefault();
    const tipo = document.getElementById('tipo-editar').value;
    const id = document.getElementById('id-editar').value;
    const nombre = document.getElementById('nombre-editar').value;
    const descripcion = document.getElementById('descripcion-editar').value;
    const orden = parseInt(document.getElementById('orden-editar').value);

    try {
      await api.actualizarArbol(tipo, id, { nombre, descripcion, orden });
      document.getElementById('modal-editar').remove();
      this.mostrarToast('✅ Cambios guardados');
      await this.cargar();
    } catch (error) {
      this.mostrarToast('❌ Error: ' + error.message, 'error');
    }
  },

  confirmarEliminar(tipo, id, nombre) {
    this.tipoEliminando = tipo;
    this.nodoEliminando = id;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-eliminar';
    modal.innerHTML = `
      <div class="modal-tarjeta" style="max-width: 400px; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
        <h3>¿Eliminar ${this.nombres[tipo]}?</h3>
        <p style="color: var(--texto-secundario); margin: 1rem 0;">
          "${nombre}" se moverá a la papelera.<br>
          <strong>Esta acción se puede deshacer.</strong>
        </p>
        <div class="modal-acciones" style="justify-content: center;">
          <button class="btn-secundario" onclick="document.getElementById('modal-eliminar').remove()">Cancelar</button>
          <button class="btn-peligro" onclick="ArbolAcademico.eliminar()">Sí, eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async eliminar() {
    try {
      await api.eliminarArbol(this.tipoEliminando, this.nodoEliminando, 'Eliminado desde árbol académico');
      document.getElementById('modal-eliminar').remove();
      this.mostrarToast('🗑️ Movido a la papelera');
      await this.cargar();
    } catch (error) {
      this.mostrarToast('❌ Error: ' + error.message, 'error');
    }
  },

  encontrarNodo(datos, tipo, id) {
    for (const nodo of datos) {
      if (nodo[`${tipo}_id`] === id) return nodo;
      if (nodo.hijos) {
        const encontrado = this.encontrarNodo(nodo.hijos, tipo, id);
        if (encontrado) return encontrado;
      }
    }
    return null;
  },

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
};
