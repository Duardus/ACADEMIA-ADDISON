/* ============================================
   📡 PETICIONES API - ACADEMIA ADDISON
   ============================================ */

async function peticion(url, opciones) {
  opciones = opciones || {};
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, API_CONFIG.TIMEOUT);

  // URL relativa: /api/v1/... → Cloudflare Pages proxy al backend
  var urlCompleta = url;
  if (url.indexOf('http') !== 0 && url.indexOf('/api/') !== 0) {
    urlCompleta = API_CONFIG.BASE_URL + url;
  }

  try {
    var respuesta = await fetch(urlCompleta, {
      signal: controller.signal,
      headers: Object.assign({}, API_CONFIG.getHeaders(), opciones.headers || {}),
      method: opciones.method || 'GET',
      body: opciones.body
    });
    
    clearTimeout(timer);
    
    if (respuesta.status === 401) {
      limpiarSesion();
      throw new Error('SESION_EXPIRADA');
    }

    var json = await respuesta.json();

    if (json.exito === false && json.error) {
      var err = new Error(json.error.mensaje || json.error || 'Error desconocido del servidor');
      err.codigo = json.error.codigo || json.codigo || 'ERROR_DESCONOCIDO';
      err.status = respuesta.status;
      throw err;
    }

    if (!respuesta.ok) {
      var err2 = new Error(json.error && json.error.mensaje ? json.error.mensaje : (json.mensaje || 'HTTP ' + respuesta.status));
      err2.status = respuesta.status;
      throw err2;
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

function get(url) {
  return peticion(url, { method: 'GET' });
}

function post(url, body) {
  return peticion(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function put(url, body) {
  return peticion(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function patch(url, body) {
  return peticion(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function del(url) {
  return peticion(url, { method: 'DELETE' });
}
