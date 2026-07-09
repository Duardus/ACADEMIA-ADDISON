/* ============================================
   ARCHIVO: instituciones.api.js
   MODULO: instituciones
   DEPENDENCIAS: peticiones.js (01-nucleo)
   CONTRATO:
     - Solo HTTP, NUNCA toca DOM
     - Devuelve datos planos o lanza error
   ============================================ */

async function apiListarInstituciones(pagina = 1, limite = 50) {
  return await get(`/institucion?pagina=${pagina}&limite=${limite}`);
}

async function apiObtenerInstitucion(institucionId) {
  return await get(`/institucion/${institucionId}`);
}

async function apiCrearInstitucion(datos) {
  return await post('/institucion', datos);
}

async function apiEditarInstitucion(institucionId, datos) {
  return await put(`/institucion/${institucionId}`, datos);
}

async function apiEliminarInstitucion(institucionId) {
  return await del(`/institucion/${institucionId}`);
}
