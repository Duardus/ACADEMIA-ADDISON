const jerarquiaServicio = {
  async crearUsuarioHijo(datos) {
    return await api._llamar('/jerarquia/crear', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  },

  async obtenerSubordinados() {
    return await api._llamar('/jerarquia/mis-subordinados');
  },

  async obtenerCapacidadesDelegables() {
    return await api._llamar('/jerarquia/mis-capacidades');
  },

  async modificarCapacidadesSubordinado(membresiaId, datos) {
    return await api._llamar(`/jerarquia/subordinado/${membresiaId}/capacidades`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    });
  },

  async desactivarSubordinado(membresiaId) {
    return await api._llamar(`/jerarquia/subordinado/${membresiaId}`, {
      method: 'DELETE'
    });
  },

  async obtenerEtiquetasFrecuentes() {
    return await api._llamar('/jerarquia/etiquetas');
  },

  async obtenerSuperiores(membresiaId) {
    return await api._llamar(`/jerarquia/superiores/${membresiaId}`);
  },

  async crearGrupoColaborativo(datos) {
    return await api._llamar('/jerarquia/grupos', {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  }
};
