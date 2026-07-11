/* ============================================
   ARCHIVO: usuarios.api.js
   MODULO: usuarios
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
  return await post('/jerarquia/cambiar-estado/' + membresiaId, { estado });
}

async function apiDesactivarSubordinado(membresiaId) {
  const token = obtenerToken?.() || '';
  const resp = await fetch(API_CONFIG.BASE_URL + '/jerarquia/subordinado/' + membresiaId, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
  const json = await resp.json();
  if (!resp.ok || json.exito === false) {
    throw new Error(json.error || 'HTTP ' + resp.status);
  }
  return json.datos !== undefined ? json.datos : json;
}

async function apiEliminarSubordinadoCompleto(membresiaId) {
  const token = obtenerToken?.() || '';
  const resp = await fetch(API_CONFIG.BASE_URL + '/jerarquia/subordinado/' + membresiaId + '/eliminar', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {})
    }
  });
  const json = await resp.json();
  if (!resp.ok || json.exito === false) {
    throw new Error(json.error || 'HTTP ' + resp.status);
  }
  return json.datos !== undefined ? json.datos : json;
}

async function apiModificarCapacidades(membresiaId, capacidades) {
  return await put('/jerarquia/subordinado/' + membresiaId + '/capacidades', { capacidades_ids: capacidades });
}

async function apiObtenerEtiquetas() {
  return await get('/jerarquia/etiquetas');
}

async function apiObtenerInstituciones() {
  return await get('/instituciones');
}

async function apiObtenerSalones(institucionId) {
  if (!institucionId) return { salones: [] };
  return await get('/salones?institucion_id=' + institucionId);
}

async function apiEditarSubordinado(membresiaId, datos) {
  return await put('/jerarquia/subordinado/' + membresiaId, datos);
}
