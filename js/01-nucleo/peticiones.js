/* ============================================
   📁 ARCHIVO: peticiones.js
   📂 CAPA: 01-nucleo
   🔗 DEPENDENCIAS: api.config.js (00-config)
   📝 CONTRATO:
     - Única capa que hace fetch al backend
     - Desempaqueta { exito, datos } automáticamente
     - Maneja 401 (logout), 404, timeout, red
     - Devuelve Promise que resuelve con datos o rechaza con Error
   🚫 NO TOCAR: UI, localStorage directo, Firebase
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

  try {
    const respuesta = await fetch(`${API_CONFIG.BASE_URL}${ruta}`, {
      ...opciones,
      headers,
      signal: controller.signal
    });
    clearTimeout(timer);

    // 401 = sesión inválida → logout silencioso
    if (respuesta.status === 401) {
      limpiarSesion?.();
      window.location.href = '/';
      throw new Error('SESION_EXPIRADA');
    }

    const json = await respuesta.json();

    // Error del backend con formato { exito: false, error }
    if (json.exito === false && json.error) {
      const err = new Error(json.error);
      err.codigo = json.codigo || 'ERROR_DESCONOCIDO';
      err.status = respuesta.status;
      throw err;
    }

    // Error HTTP sin formato de backend
    if (!respuesta.ok) {
      const err = new Error(json.error || `HTTP ${respuesta.status}`);
      err.status = respuesta.status;
      throw err;
    }

    // Éxito: devolver datos directamente
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
function del(ruta, body)    { return peticion(ruta, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }); }
