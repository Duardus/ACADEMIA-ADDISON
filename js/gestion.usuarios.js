/**
 * GESTIÓN DE USUARIOS — ACADEMIA ADDISON v3.0
 * Superadmin/Director: crear, listar, gestionar usuarios
 */

const GestionUsuarios = {
  usuarios: [],

  iniciar() {
    const appDiv = document.getElementById('app');
    if (!appDiv) return;
    
    appDiv.innerHTML = `
      <div class="layout-app">
        <header class="app-header">
          <div class="header-left">
            <button class="btn-icono" onclick="window.location.reload()" title="Volver al dashboard" style="font-size:1.2rem;">←</button>
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
              <h2 class="arbol-titulo">👥 Gestión de Usuarios</h2>
              <button class="btn-primario" onclick="GestionUsuarios.mostrarModalCrear()">
                <span>+</span> Crear Usuario
              </button>
            </div>
            <div id="usuarios-contenedor">
              <div class="cargando-arbol">
                <div class="spinner"></div>
                <p>Cargando usuarios...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    `;
    
    this.cargar();
  },

  async cargar() {
    const contenedor = document.getElementById('usuarios-contenedor');
    try {
      const respuesta = await api.listarUsuarios();
      this.usuarios = respuesta?.usuarios || [];
      this.renderizar();
    } catch (error) {
      if (contenedor) contenedor.innerHTML = `
        <div class="estado-vacio">
          <p>❌ Error: ${error.message}</p>
          <button class="btn-secundario" onclick="GestionUsuarios.cargar()">Reintentar</button>
        </div>`;
    }
  },

  renderizar() {
    const contenedor = document.getElementById('usuarios-contenedor');
    if (!contenedor) return;

    if (this.usuarios.length === 0) {
      contenedor.innerHTML = `
        <div class="estado-vacio">
          <p>📭 No hay usuarios en esta institución</p>
          <p class="texto-secundario">Crea al primer director o profesor</p>
        </div>`;
      return;
    }

    let html = '<div class="tabla-usuarios">';
    html += `
      <div class="tabla-header">
        <span>Nombre</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Estado</span>
        <span>Acciones</span>
      </div>
    `;
    
    this.usuarios.forEach(u => {
      const badgeRol = this.badgeRol(u.tipo_rol);
      html += `
        <div class="tabla-fila">
          <span class="usuario-nombre">${this.escaparHtml(u.nombre_completo)}</span>
          <span class="usuario-email">${this.escaparHtml(u.correo_electronico)}</span>
          <span class="usuario-rol">${badgeRol}</span>
          <span class="usuario-estado">${u.estado_usuario}</span>
          <span class="usuario-acciones">
            <button class="btn-icono" onclick="GestionUsuarios.cambiarRol('${u.usuario_id}')" title="Cambiar rol">🔄</button>
          </span>
        </div>
      `;
    });
    html += '</div>';
    contenedor.innerHTML = html;
  },

  badgeRol(rol) {
    const colores = {
      superadmin: '<span class="badge-rol badge-superadmin">👑 Superadmin</span>',
      director: '<span class="badge-rol badge-director">🎓 Director</span>',
      professor: '<span class="badge-rol badge-profesor">📚 Profesor</span>',
      auxiliary: '<span class="badge-rol badge-auxiliar">🛠️ Auxiliar</span>',
      student: '<span class="badge-rol badge-estudiante">🎒 Estudiante</span>'
    };
    return colores[rol] || `<span class="badge-rol">${rol}</span>`;
  },

  mostrarModalCrear() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay activo';
    modal.id = 'modal-crear';
    modal.innerHTML = `
      <div class="modal-panel modal-panel-arbol">
        <div class="modal-header">
          <h3>➕ Crear Usuario</h3>
          <button class="btn-cerrar" onclick="GestionUsuarios.cerrarModal()">✕</button>
        </div>
        <form id="form-crear" onsubmit="GestionUsuarios.crear(event)">
          <div class="campo-formulario">
            <label>Correo electrónico</label>
            <input type="email" id="crear-email" placeholder="ejemplo@gmail.com" required>
          </div>
          <div class="campo-formulario">
            <label>Nombre completo</label>
            <input type="text" id="crear-nombre" placeholder="Juan Pérez" required>
          </div>
          <div class="campo-formulario">
            <label>Rol</label>
            <select id="crear-rol" required>
              <option value="">Seleccionar...</option>
              <option value="director">🎓 Director</option>
              <option value="professor">📚 Profesor</option>
              <option value="auxiliary">🛠️ Auxiliar</option>
              <option value="student">🎒 Estudiante</option>
            </select>
          </div>
          <div class="modal-acciones">
            <button type="button" class="btn-secundario" onclick="GestionUsuarios.cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primario">Crear</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => document.getElementById('crear-email').focus(), 100);
  },

  cerrarModal() {
    const m = document.getElementById('modal-crear');
    if (m) m.remove();
  },

  async crear(evento) {
    evento.preventDefault();
    const email = document.getElementById('crear-email').value.trim();
    const nombre = document.getElementById('crear-nombre').value.trim();
    const rol = document.getElementById('crear-rol').value;

    if (!email || !nombre || !rol) {
      app.mostrarToast('Todos los campos son obligatorios', 'error');
      return;
    }

    try {
      const btn = evento.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creando...';

      const resultado = await api.crearUsuario({
        correo_electronico: email,
        nombre_completo: nombre,
        tipo_rol: rol
      });

      if (resultado && resultado.error) {
        app.mostrarToast(resultado.error, 'error');
        btn.disabled = false;
        btn.textContent = 'Crear';
        return;
      }

      app.mostrarToast(`✅ ${nombre} creado como ${rol}`, 'exito');
      this.cerrarModal();
      this.cargar();
    } catch (error) {
      app.mostrarToast(`Error: ${error.message}`, 'error');
      const btn = evento.target.querySelector('button[type="submit"]');
      if (btn) { btn.disabled = false; btn.textContent = 'Crear'; }
    }
  },

  cambiarRol(usuarioId) {
    app.mostrarToast('Cambio de rol: en construcción', 'info');
  },

  escaparHtml(t) {
    if (!t) return '';
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};

window.GestionUsuarios = GestionUsuarios;
