/* ============================================
   📁 ARCHIVO: 99-app.js
   📂 CAPA: Orquestador
   🔗 DEPENDENCIAS: TODAS las capas anteriores
   📝 CONTRATO:
     - ÚNICO archivo que conoce todos los módulos
     - Delega TODO a los módulos específicos
     - NUNCA hace fetch, NUNCA renderiza HTML directo
   🚫 NO TOCAR: Lógica de negocio, UI, API calls
   ============================================ */

class App {
  constructor() {
    this.firebaseListo = false;
  }

  async iniciar() {
    if (typeof firebase === 'undefined' || !auth || !googleProvider) {
      this.mostrarErrorFatal('Firebase no cargado');
      return;
    }
    this.firebaseListo = true;

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.procesarUsuarioFirebase(user);
      } else if (haySesionActiva()) {
        await this.procesarSesionExistente();
      } else {
        this.mostrarLogin();
      }
    });
  }

  async procesarUsuarioFirebase(userFirebase) {
    try {
      const token = await userFirebase.getIdToken(true);
      const datos = await apiLogin(token);
      this.manejarRespuestaLogin(datos);
    } catch (error) {
      this.mostrarToast(error.message, 'error');
      await auth.signOut().catch(() => {});
      this.mostrarLogin();
    }
  }

  async procesarSesionExistente() {
    try {
      const datos = await apiVerificarSesion();
      this.manejarRespuestaLogin({ tipo: 'login_directo', ...datos });
    } catch {
      limpiarSesion();
      this.mostrarLogin();
    }
  }

  manejarRespuestaLogin(datos) {
    if (datos.tipo === 'login_directo') {
      guardarToken(datos.token_sesion);
      guardarInstitucion(datos.institucion);
      guardarUsuario(datos.usuario);
      this.mostrarDashboard();
    } else if (datos.tipo === 'selector_requerido') {
      iniciarLogin({
        onLoginExitoso: (d) => this.manejarRespuestaLogin(d),
        onError: (msg) => this.mostrarToast(msg, 'error')
      });
    } else {
      this.mostrarToast(datos.mensaje || 'Error de autenticación', 'error');
      limpiarSesion();
      this.mostrarLogin();
    }
  }

  mostrarLogin() {
    iniciarLogin({
      onLoginExitoso: (datos) => this.manejarRespuestaLogin(datos),
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
    const pendientes = {
      examenes:'Exámenes', teorias:'Teorías', notas:'Notas',
      finanzas:'Finanzas', calendario:'Calendario',
      instituciones:'Instituciones', 'finanzas-globales':'Finanzas globales',
      auditoria:'Auditoría'
    };
    if (pendientes[vista]) {
      this.mostrarToast(`🚧 ${pendientes[vista]} - En construcción`, 'advertencia');
    }
  }
  async cerrarSesion() {
    detenerHeartbeat();
    limpiarSesion();
    try { await auth.signOut(); } catch(e) {}
    window.location.reload();
  }

  iniciarClaseEnVivo() {
    this.mostrarToast('🚧 Clases en vivo - En construcción', 'advertencia');
  }

  mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo} fade-in`;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('saliendo'); setTimeout(() => toast.remove(), 300); }, 4000);
  }

  mostrarErrorFatal(mensaje) {
    document.getElementById('app').innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">⚠️</div>
        <h2 style="color:var(--error);">Error Crítico</h2>
        <p style="color:var(--texto-secundario);">${mensaje}</p>
        <button class="btn" style="margin-top:20px;" onclick="location.reload()">Recargar</button>
      </div>`;
  }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new App();
  app.iniciar();
});
