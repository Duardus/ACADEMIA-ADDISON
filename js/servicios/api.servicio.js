/* ============================================
   📡 SERVICIO API - TODAS las llamadas al backend
   ============================================ */

class ServicioAPI {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // ============ UTILIDADES ============
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
      
      if (respuesta.status === 404) {
        console.log('[API] 404 - Recurso no encontrado o sin permiso');
        return null;
      }
      if (respuesta.status === 401) {
        localStorage.removeItem('token_sesion');
        window.location.href = '/';
        return null;
      }
      
      return await respuesta.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('[API] Timeout');
        return { error: 'Timeout', codigo: 'TIMEOUT' };
      }
      console.error('[API] Error:', error);
      return { error: error.message, codigo: 'NETWORK_ERROR' };
    }
  }

  // ============ AUTENTICACIÓN ============
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

  async cambiarContexto(institucionId, rol) {
    return await this._llamar('/auth/switch-context', {
      method: 'POST',
      body: JSON.stringify({ target_institucion_id: institucionId, target_role_type: rol })
    });
  }

  // ============ ÁRBOL ACADÉMICO ============
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

  // ============ TEORÍAS ============
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

  // ============ EXÁMENES ============
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
}

// Instancia global
const api = new ServicioAPI();
