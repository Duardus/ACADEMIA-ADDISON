/* ============================================
   ARCHIVO: usuarios.api.js
   MODULO: usuarios
   DEPENDENCIAS: peticiones.js (01-nucleo)
   CONTRATO:
     - Solo HTTP, NUNCA toca DOM
     - Devuelve datos planos o lanza error
   ============================================ */

async function apiObtenerSubordinados() {
  return await get('/jerarquia/mis-subordinados');
}

async function apiObtenerCapacidades() {
  return await get('/jerarquia/mis-capacidades');
}

async function apiCrearSubordinado(datos) {
  return await post('/jerarquia/crear', datos);
}

async function apiCambiarEstadoSubordinado(membresiaId, estado) {
  return await post(`/jerarquia/cambiar-estado/${membresiaId}`, { estado });
}

// CORREGIDO: Usar del() que ya existe en peticiones.js
async function apiDesactivarSubordinado(membresiaId) {
  return await del(`/jerarquia/subordinado/${membresiaId}`);
}

// CORREGIDO: Variable era membresia_id (minúscula) → membresiaId (camelCase)
async function apiEliminarSubordinadoCompleto(membresiaId) {
  return await del(`/jerarquia/subordinado/${membresiaId}/eliminar`);
}

async function apiModificarCapacidades(membresiaId, capacidades) {
  return await put(`/jerarquia/subordinado/${membresiaId}/capacidades`, { capacidades_ids: capacidades });
}

async function apiObtenerEtiquetas() {
  return await get('/jerarquia/etiquetas');
}

// INSTITUCIONES Y SALONES PARA SELECTS
async function apiObtenerInstituciones() {
  return await get('/instituciones');
}

async function apiObtenerSalones(institucionId) {
  if (!institucionId) return { salones: [] };
  return await get(`/salones?institucion_id=${institucionId}`);
}
