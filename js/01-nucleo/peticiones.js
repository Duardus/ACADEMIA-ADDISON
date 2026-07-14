/* ============================================
   📡 PETICIONES API - ACADEMIA ADDISON
   ============================================ */

async function peticion(url, opciones = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    const respuesta = await fetch(url, {
      ...opciones,
      signal: controller.signal,
      headers: {
        ...API_CONFIG.getHeaders(),
        ...(opciones.headers || {})
      }
    });

    clearTimeout(timer);

    if (respuesta.status === 401) {
      limpiarSesion();
      throw new Error('SESION_EXPIRADA');
    }

    const json = await respuesta.json();

    if (json.exito === false && json.error) {
      const mensajeError = json.error.mensaje || json.error || 'Error desconocido del servidor';
      const err = new Error(mensajeError);
      err.codigo = json.error.codigo || json.codigo || 'ERROR_DESCONOCIDO';
      err.status = respuesta.status;
      throw err;
    }

    if (!respuesta.ok) {
      const mensajeError = json.error?.mensaje || json.mensaje || `HTTP ${respuesta.status}`;
      const err = new Error(mensajeError);
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
async function get(url) {
  return peticion(url, { method: 'GET' });
}

async function post(url, body) {
  return peticion(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function put(url, body) {
  return peticion(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function patch(url, body) {
  return peticion(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function del(url) {
  return peticion(url, { method: 'DELETE' });
}
