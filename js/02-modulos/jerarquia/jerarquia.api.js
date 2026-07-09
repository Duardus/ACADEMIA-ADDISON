/* ============================================
   ARCHIVO: jerarquia.api.js
   MODULO: jerarquia
   DEPENDENCIAS: peticiones.js (01-nucleo)
   CONTRATO:
     - Solo HTTP, NUNCA toca DOM
     - Devuelve datos planos o lanza error
   ============================================ */

async function apiObtenerSubordinados() {
  return await get('/api/v1/jerarquia/mis-subordinados');
}

async function apiObtenerCapacidades() {
  return await get('/api/v1/jerarquia/mis-capacidades');
}

async function apiCrearSubordinado(datos) {
  return await post('/api/v1/jerarquia/crear', datos);
}

async function apiCambiarEstadoSubordinado(membresiaId, estado) {
  return await post(`/api/v1/jerarquia/cambiar-estado/${membresiaId}`, { estado });
}

async function apiDesactivarSubordinado(membresiaId) {
  return await peticion(`/api/v1/jerarquia/subordinado/${membresiaId}`, 'DELETE');
}

async function apiModificarCapacidades(membresiaId, capacidades) {
  return await put(`/api/v1/jerarquia/subordinado/${membresiaId}/capacidades`, { capacidades });
}

async function apiObtenerEtiquetas() {
  return await get('/api/v1/jerarquia/etiquetas');
}
