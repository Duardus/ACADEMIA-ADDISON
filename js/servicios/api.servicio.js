/* ============================================
   📡 SERVICIO API - ACADEMIA ADDISON v3.0
   Unica capa que conoce el formato del backend.
   Desempaqueta { exito, datos } automaticamente.
   ============================================ */

class ServicioAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // Desempaqueta respuesta del backend: { exito, mensaje, datos } -> datos
  _extraerDatos(json) {
    if (!json || typeof json !== 'object') return json;

    // Si viene envuelto en { exito, datos }, extraemos datos
    if (json.exito === true && json.datos !== undefined) {
      return json.datos;
    }

    // Si es error del backend, lo propagamos como excepcion
    if (json.exito === false && json.error) {
      const error = new Error(json.error);
      error.codigo = json.codigo || 'ERROR_DESCONOCIDO';
      error.status = json.status || 400;
      throw error;
    }

    // Si ya viene plano (legacy o healthcheck), lo devolvemos tal cual
    return json;
  }

  async _llamar(ruta, opciones = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    try {
      const respuesta = await fetch(`${this.baseURL}${ruta}`, {
        ...opciones,
        headers: { ...API_CONFIG.getHeaders(), ...opciones.headers },
        signal: controller.signal
      });
      clearTimeout(timeout);

      // 401 = sesion invalida/revocada
      if (respuesta.status === 401) {
        localStorage.removeItem('token_sesion');
        localStorage.removeItem('institucion_activa');
        localStorage.removeItem('usuario_activo');
        window.location.href = '/';
        return null;
      }

      // 404 = recurso no encontrado
      if (respuesta.status === 404) {
        console.log('[API] 404 - Recurso no encontrado');
        return null;
      }

      const json = await respuesta.json();

      // Errores HTTP no capturados por el backend
      if (!respuesta.ok) {
        const error = new Error(json.error || `HTTP ${respuesta.status}`);
        error.codigo = json.codigo || `HTTP_${respuesta.status}`;
        throw error;
      }

      return this._extraerDatos(json);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[API] Timeout');
        throw new Error('La conexion con el servidor tardo demasiado. Intenta de nuevo.');
      }
      // Si ya es un error nuestro, lo relanzamos
      throw error;
    }
  }

  // ============ AUTENTICACION ============
  async login(tokenFirebase) {
    return await this._llamar('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ token_firebase: tokenFirebase })
    });
  }

  async seleccionarContexto(tokenPreliminar, membresiaId) {
    return await this._llamar('/auth/seleccionar-contexto', {
      method: 'POST',
      body: JSON.stringify({ token_preliminar: tokenPreliminar, membresia_id: membresiaId })
    });
  }

  async switchContext(membresiaId) {
    return await this._llamar('/auth/switch-context', {
      method: 'POST',
      body: JSON.stringify({ membresia_id: membresiaId })
    });
  }

  // ============ ARBOL ACADEMICO ============
  async obtenerArbol() {
    return await this._llamar('/arbol');
  }

  async crearGrupo(datos) {
    return await this._llamar('/arbol/grupos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async crearCurso(datos) {
    return await this._llamar('/arbol/cursos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async actualizarArbol(tipo, id, datos) {
    return await this._llamar(`/arbol/${tipo}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
  }

  async eliminarArbol(tipo, id, motivo) {
    return await this._llamar(`/arbol/${tipo}/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ motivo_eliminacion: motivo })
    });
  }

  async clonarArbol(tipo, id) {
    return await this._llamar(`/arbol/${tipo}/${id}/clonar`, {
      method: 'POST'
    });
  }

  // ============ USUARIOS ============
  async listarUsuarios() {
    return await this._llamar('/usuarios');
  }

  async crearUsuario(datos) {
    return await this._llamar('/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  // ============ JERARQUIA ============
  async crearUsuarioHijo(datos) {
    return await this._llamar('/jerarquia/crear', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async listarMisSubordinados() {
    return await this._llamar('/jerarquia/mis-subordinados');
  }

  async desactivarSubordinado(membresiaId) {
    return await this._llamar(`/jerarquia/subordinado/${membresiaId}`, {
      method: 'DELETE'
    });
  }

  // ============ TEORIAS ============
  async listarTeorias(subtemaId) {
    const query = subtemaId ? `?subtema_id=${subtemaId}` : '';
    return await this._llamar(`/teorias${query}`);
  }

  async crearTeoria(datos) {
    return await this._llamar('/teorias', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  // ============ EXAMENES ============
  async listarExamenes(subtemaId) {
    const query = subtemaId ? `?subtema_id=${subtemaId}` : '';
    return await this._llamar(`/examenes${query}`);
  }

  async crearExamen(datos) {
    return await this._llamar('/examenes', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async publicarExamen(examenId) {
    return await this._llamar(`/examenes/${examenId}/publicar`, { method: 'POST' });
  }

  // ============ INTENTOS ============
  async iniciarIntento(examenId) {
    return await this._llamar('/intentos/iniciar', {
      method: 'POST',
      body: JSON.stringify({ examen_id: examenId })
    });
  }

  async guardarRespuesta(intentoId, preguntaId, respuesta) {
    return await this._llamar('/intentos/respuesta', {
      method: 'POST',
      body: JSON.stringify({
        intento_id: intentoId,
        pregunta_id: preguntaId,
        respuesta_seleccionada: respuesta
      })
    });
  }

  async finalizarIntento(intentoId) {
    return await this._llamar('/intentos/finalizar', {
      method: 'POST',
      body: JSON.stringify({ intento_id: intentoId })
    });
  }

  // ============ PROGRESO ============
  async obtenerProgreso() {
    return await this._llamar('/progreso');
  }

  async marcarTeoriaCompletada(teoriaId, cursoId) {
    return await this._llamar('/progreso/teoria', {
      method: 'POST',
      body: JSON.stringify({ teoria_id: teoriaId, curso_id: cursoId })
    });
  }

  // ============ LIVEKIT ============
  async obtenerTokenLiveKit(nombreSala, rolSala) {
    return await this._llamar('/livekit/token', {
      method: 'POST',
      body: JSON.stringify({ nombre_sala: nombreSala, rol_sala: rolSala })
    });
  }

  // ============ GRABACIONES ============
  async listarGrabaciones() {
    return await this._llamar('/grabaciones');
  }

  async iniciarGrabacion(salaId, nombreSala) {
    return await this._llamar('/grabaciones/iniciar', {
      method: 'POST',
      body: JSON.stringify({ sala_id: salaId, nombre_sala: nombreSala })
    });
  }

  async detenerGrabacion(grabacionId) {
    return await this._llamar('/grabaciones/detener', {
      method: 'POST',
      body: JSON.stringify({ grabacion_id: grabacionId })
    });
  }

  async descargarGrabacion(grabacionId) {
    return await this._llamar(`/grabaciones/${grabacionId}/descargar`);
  }

  // ============ INSTITUCIONES ============
  async listarInstituciones() {
    return await this._llamar('/instituciones');
  }

  async crearInstitucion(datos) {
    return await this._llamar('/instituciones', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  // ============ SESION ============
  async verificarSesion() {
    return await this._llamar('/sesion/verificar');
  }
}

// Instancia global
const api = new ServicioAPI();
