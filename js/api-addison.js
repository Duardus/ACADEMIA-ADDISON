// ============================================
// CLIENTE API ACADEMIA ADDISON v3.0
// ============================================

class ApiAddison {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // ============ AUTH ============
  
  async login(tokenFirebase) {
    const respuesta = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_firebase: tokenFirebase })
    });
    return await respuesta.json();
  }

  async seleccionarContexto(tokenPreliminar, membresiaId) {
    const respuesta = await fetch(`${this.baseURL}/auth/seleccionar-contexto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_preliminar: tokenPreliminar, membresia_id: membresiaId })
    });
    return await respuesta.json();
  }

  // ============ LLAMADAS AUTENTICADAS ============
  
  async llamar(ruta, opciones = {}) {
    const token = localStorage.getItem('token_addison');
    if (!token) {
      console.error('No hay token de sesion');
      return null;
    }

    const respuesta = await fetch(`${this.baseURL}${ruta}`, {
      ...opciones,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        ...opciones.headers
      }
    });

    if (respuesta.status === 404) {
      // Regla de Oro 1: El recurso no existe para este usuario
      return null;
    }

    if (respuesta.status === 401) {
      // Token expirado o invalido
      localStorage.removeItem('token_addison');
      window.location.href = '/';
      return null;
    }

    return await respuesta.json();
  }

  // ============ ENDPOINTS ============
  
  async obtenerArbol() {
    return await this.llamar('/arbol');
  }

  async crearGrupo(datos) {
    return await this.llamar('/arbol/grupos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async crearCurso(datos) {
    return await this.llamar('/arbol/cursos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async listarUsuarios() {
    return await this.llamar('/usuarios');
  }

  async crearUsuario(datos) {
    return await this.llamar('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async listarInstituciones() {
    return await this.llamar('/instituciones');
  }

  async crearInstitucion(datos) {
    return await this.llamar('/instituciones', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  // ============ LIVEKIT ============
  
  async obtenerTokenLiveKit(nombreSala, rolSala) {
    return await this.llamar('/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ nombre_sala: nombreSala, rol_sala: rolSala })
    });
  }

  // ============ GRABACIONES ============
  
  async iniciarGrabacion(salaId, nombreSala) {
    return await this.llamar('/grabaciones/iniciar', {
      method: 'POST',
      body: JSON.stringify({ sala_id: salaId, nombre_sala: nombreSala })
    });
  }

  async detenerGrabacion(grabacionId) {
    return await this.llamar('/grabaciones/detener', {
      method: 'POST',
      body: JSON.stringify({ grabacion_id: grabacionId })
    });
  }

  async listarGrabaciones() {
    return await this.llamar('/grabaciones');
  }

  // ============ UTILIDADES ============
  
  getInstitucion() {
    const inst = localStorage.getItem('institucion_addison');
    return inst ? JSON.parse(inst) : null;
  }

  getUsuario() {
    const usr = localStorage.getItem('usuario_addison');
    return usr ? JSON.parse(usr) : null;
  }

  getRol() {
    const inst = this.getInstitucion();
    return inst ? inst.tipo_rol : null;
  }

  esSuperadmin() { return this.getRol() === 'superadmin'; }
  esDirector() { return this.getRol() === 'director'; }
  esProfesor() { return this.getRol() === 'professor'; }
  esAuxiliar() { return this.getRol() === 'auxiliary'; }
  esAlumno() { return this.getRol() === 'student'; }

  cerrarSesion() {
    localStorage.removeItem('token_addison');
    localStorage.removeItem('token_preliminar');
    localStorage.removeItem('institucion_addison');
    localStorage.removeItem('usuario_addison');
    window.location.href = '/';
  }
}

// Instancia global
const api = new ApiAddison();
