/* ============================================
   📱 APP.JS - Orquestador Passkeys Puro
   ============================================ */

class App {
  constructor() {
    this.passkeyListo = false;
  }

  async iniciar() {
    if (!window.PublicKeyCredential) {
      this.mostrarErrorFatal('Tu navegador no soporta acceso seguro (WebAuthn). Usa Chrome, Edge o Safari actualizado.');
      return;
    }

    this.passkeyListo = true;

    if (haySesionActiva()) {
      await this.procesarSesionExistente();
    } else {
      this.mostrarLogin();
    }
  }

  async procesarSesionExistente() {
    try {
      const datos = await apiVerificarSesion();
      this.manejarRespuestaLogin({ ...datos, tipo: 'login_directo' });
    } catch {
      limpiarSesion();
      this.mostrarLogin();
    }
  }

  manejarRespuestaLogin(datos) {
    if (datos.exito || datos.tipo === 'login_directo') {
      guardarToken(datos.token_sesion || datos.token);
      if (datos.usuario) guardarUsuario(datos.usuario);
      this.mostrarDashboard();
    } else {
      this.mostrarToast(datos.mensaje || 'Error de autenticación', 'error');
      limpiarSesion();
      this.mostrarLogin();
    }
  }

  mostrarLogin() {
    renderizarPantallaPasskey({
      onLogin: (datos) => this.manejarRespuestaLogin(datos),
      onError: (msg) => this.mostrarToast(msg, 'error')
    });
  }

  async mostrarDashboard() {
    await iniciarDashboard({
      onLogout: () => this.cerrarSesion(),
      onNavegar: (vista) => this.navegar(vista),
      onError: (msg) => this.mostrarToast(msg, 'error')
    });
  }

  seleccionarCurso(cursoId) {
    seleccionarCurso(cursoId);
  }

  navegar(vista) {
    if (vista === 'arbol') {
      detenerHeartbeat();
      iniciarArbol({
        onVolver: () => this.mostrarDashboard(),
        onError: (msg) => this.mostrarToast(msg, 'error'),
        onToast: (msg, tipo) => this.mostrarToast(msg, tipo)
      });
      return;
    }
    if (vista === 'usuarios') {
      detenerHeartbeat();
      iniciarUsuarios({
        onVolver: () => this.mostrarDashboard(),
        onError: (msg) => this.mostrarToast(msg, 'error'),
        onToast: (msg, tipo) => this.mostrarToast(msg, tipo)
      });
      return;
    }
    if (vista === 'instituciones') {
      detenerHeartbeat();
      iniciarInstituciones({
        onVolver: () => this.mostrarDashboard(),
        onError: (msg) => this.mostrarToast(msg, 'error'),
        onToast: (msg, tipo) => this.mostrarToast(msg, tipo)
      });
      return;
    }
    if (vista === 'salones') {
      detenerHeartbeat();
      iniciarSalones({
        onVolver: () => this.mostrarDashboard(),
        onError: (msg) => this.mostrarToast(msg, 'error'),
        onToast: (msg, tipo) => this.mostrarToast(msg, tipo)
      });
      return;
    }
    const pendientes = {
      examenes:'Exámenes', teorias:'Teorías', notas:'Notas',
      finanzas:'Finanzas', calendario:'Calendario',
      'finanzas-globales':'Finanzas globales',
      auditoria:'Auditoría'
    };
    if (pendientes[vista]) {
      this.mostrarToast('🚧 ' + pendientes[vista] + ' - En construcción', 'advertencia');
    }
  }

  async cerrarSesion() {
    detenerHeartbeat();
    limpiarSesion();
    window.location.reload();
  }

  iniciarClaseEnVivo() {
    this.mostrarToast('🚧 Clases en vivo - En construcción', 'advertencia');
  }

  mostrarToast(mensaje, tipo) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + tipo + ' fade-in';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('saliendo'); setTimeout(function() { toast.remove(); }, 300); }, 4000);
  }

  mostrarErrorFatal(mensaje) {
    document.getElementById('app').innerHTML = `
      <div class="error-fatal">
        <h1>⚠️ Error Crítico</h1>
        <p>${mensaje}</p>
      </div>
    `;
  }
}

// Exponer mostrarToast globalmente para que passkey.eventos.js lo use
window.mostrarToast = function(mensaje, tipo) {
  if (app && typeof app.mostrarToast === 'function') {
    app.mostrarToast(mensaje, tipo);
  } else {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;z-index:9999;max-width:300px;word-break:break-word;';
    if (tipo === 'error') toast.style.background = '#e74c3c';
    else if (tipo === 'warning') toast.style.background = '#f39c12';
    else if (tipo === 'exito') toast.style.background = '#27ae60';
    else toast.style.background = '#3498db';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }
};

let app;
document.addEventListener('DOMContentLoaded', function() {
  app = new App();
  app.iniciar();
});
