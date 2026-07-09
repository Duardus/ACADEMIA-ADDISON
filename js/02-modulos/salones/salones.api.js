async function apiListarSalones(institucionId) {
  return await get(`/salones?institucion_id=${institucionId}`);
}
async function apiObtenerSalon(salonId) {
  return await get(`/salones/${salonId}`);
}
async function apiCrearSalon(datos) {
  return await post('/salones', datos);
}
async function apiEditarSalon(salonId, datos) {
  return await put(`/salones/${salonId}`, datos);
}
async function apiEliminarSalon(salonId) {
  return await del(`/salones/${salonId}`);
}
async function apiListarUsuariosDisponibles(institucionId) {
  return await get(`/salones/usuarios/disponibles?institucion_id=${institucionId}`);
}
async function apiListarCursosDisponibles(institucionId) {
  return await get(`/salones/cursos/disponibles?institucion_id=${institucionId}`);
}
async function apiAsignarUsuario(salonId, datos) {
  return await post(`/salones/${salonId}/usuarios`, datos);
}
async function apiQuitarUsuario(salonId, membresiaId) {
  return await del(`/salones/${salonId}/usuarios/${membresiaId}`);
}
async function apiAsignarCurso(salonId, datos) {
  return await post(`/salones/${salonId}/cursos`, datos);
}
async function apiQuitarCurso(salonId, cursoId) {
  return await del(`/salones/${salonId}/cursos/${cursoId}`);
}
