/* ============================================
   📁 ARCHIVO: peticiones.js
   📂 CAPA: 01-nucleo
   ============================================ */

const TIMEOUT_MS = API_CONFIG?.TIMEOUT || 15000;

async function peticion(ruta, opciones = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const token = obtenerToken?.() || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
    ...(opciones.headers || {})
  };

  // Construir opciones de fetch, eliminando body si es undefined
  const fetchOptions = {
    ...opciones,
    headers,
    signal: controller.signal
  };
  
  // Si body es undefined, eliminarlo para que fetch no lo envíe
  if (fetchOptions.body === undefined) {
    delete fetchOptions.body;
  }

  try {
    const respuesta = await fetch(`${API_CONFIG.BASE_URL}${ruta}`, fetchOptions);
    clearTimeout(timer);

    if (respuesta.status === 401) {
      limpiarSesion?.();
      window.location.href = '/';
      throw new Error('SESION_EXPIRADA');
    }

    const json = await respuesta.json();

    if (json.exito === false && json.error) {
      const err = new Error(json.error);
      err.codigo = json.codigo || 'ERROR_DESCONOCIDO';
      err.status = respuesta.status;
      throw err;
    }

    if (!respuesta.ok) {
      const err = new Error(json.error || `HTTP ${respuesta.status}`);
      err.status = respuesta.status;
      throw err;
    }

    return json.datos !== undefined ? json.datos : json;

  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error('TIMEOUT: El servidor no respondió a tiempo');
    }
    throw error;
  }
}

// Helpers de método
function get(ruta)    { return peticion(ruta); }
function post(ruta, body)   { return peticion(ruta, { method: 'POST', body: JSON.stringify(body) }); }
function put(ruta, body)    { return peticion(ruta, { method: 'PUT', body: JSON.stringify(body) }); }
function del(ruta, body)    { 
  const opts = { method: 'DELETE' };
  if (body !== undefined) opts.body = JSON.stringify(body);
  return peticion(ruta, opts);
}
