class JerarquiaServicio {
  constructor() {
    this.baseURL = 'https://academia-addison.duckdns.org/api/v1';
  }

  async _llamar(ruta, opciones = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
      const token = localStorage.getItem('token_sesion');
      const respuesta = await fetch(`${this.baseURL}${ruta}`, {
        ...opciones,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...opciones.headers
        },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (respuesta.status === 404) return null;
      if (respuesta.status === 401) {
        localStorage.removeItem('token_sesion');
        window.location.href = '/';
        return null;
      }
      
      return await respuesta.json();
    } catch (error) {
      clearTimeout(timeout);
      console.error('[JerarquiaServicio] Error:', error);
      throw error;
    }
  }

  async obtenerArbolCompleto() {
    return await this._llamar('/jerarquia/arbol-completo');
  }

  async obtenerMisHijos() {
    return await this._llamar('/jerarquia/mis-hijos');
  }

  async obtenerCapacidadesDelegables() {
    return await this._llamar('/jerarquia/capacidades-delegables');
  }

  async crearUsuarioHijo(datos) {
    return await this._llamar('/jerarquia/crear', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }

  async modificarCapacidadesHijo(membresiaId, datos) {
    return await this._llamar(`/jerarquia/${membresiaId}/capacidades`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
  }

  async eliminarHijo(membresiaId) {
    return await this._llamar(`/jerarquia/${membresiaId}`, {
      method: 'DELETE'
    });
  }
}

window.jerarquiaServicio = new JerarquiaServicio();
