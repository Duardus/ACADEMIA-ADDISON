class JerarquiaServicio {
    constructor() {
        this.api = window.api;
    }
    async crearUsuarioHijo(datos) {
        return await this.api._llamar('/jerarquia/crear', { method: 'POST', body: JSON.stringify(datos) });
    }
    async obtenerMisHijos() {
        return await this.api._llamar('/jerarquia/mis-hijos');
    }
    async obtenerMisCapacidades() {
        return await this.api._llamar('/jerarquia/mis-capacidades');
    }
    async obtenerCapacidadesDelegables() {
        return await this.api._llamar('/jerarquia/capacidades-delegables');
    }
    async modificarCapacidadesHijo(membresiaId, datos) {
        return await this.api._llamar(`/jerarquia/${membresiaId}/capacidades`, { method: 'PUT', body: JSON.stringify(datos) });
    }
    async eliminarHijo(membresiaId) {
        return await this.api._llamar(`/jerarquia/${membresiaId}`, { method: 'DELETE' });
    }
    async arbolCompleto() {
        return await this.api._llamar('/jerarquia/arbol-completo');
    }
}
window.jerarquiaServicio = new JerarquiaServicio();
