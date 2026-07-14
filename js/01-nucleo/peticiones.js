/* ============================================
   📡 PETICIONES API - ACADEMIA ADDISON
   ============================================ */

async function peticion(url, opciones) {
  opciones = opciones || {};
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, API_CONFIG.TIMEOUT);

  // Intentar con URL principal
  var urlPrincipal = url;
  if (url.indexOf('http') !== 0) {
    urlPrincipal = API_CONFIG.BASE_URL + url;
  }

  try {
    var respuesta = await fetch(urlPrincipal, {
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
    
    // Si falló por DNS o conexión, intentar con fallback (IP directa)
    if ((error.message && error.message.includes('Failed to fetch')) || 
        (error.name === 'TypeError')) {
      
      var urlFallback = urlPrincipal.replace('academia-addison.duckdns.org', '163.176.235.27');
      
      // Solo intentar fallback si la URL cambió
      if (urlFallback !== urlPrincipal) {
        console.log('[PETICIONES] Fallback a IP directa:', urlFallback);
        try {
          var respuestaFallback = await fetch(urlFallback, {
            headers: Object.assign({}, API_CONFIG.getHeaders(), opciones.headers || {}),
            method: opciones.method || 'GET',
            body: opciones.body
          });
          
          if (respuestaFallback.status === 401) {
            limpiarSesion();
            throw new Error('SESION_EXPIRADA');
          }

          var jsonFallback = await respuestaFallback.json();

          if (jsonFallback.exito === false && jsonFallback.error) {
            var errFallback = new Error(jsonFallback.error.mensaje || jsonFallback.error || 'Error desconocido');
            errFallback.codigo = jsonFallback.error.codigo || 'ERROR_DESCONOCIDO';
            errFallback.status = respuestaFallback.status;
            throw errFallback;
          }

          if (!respuestaFallback.ok) {
            var errFallback2 = new Error(jsonFallback.error && jsonFallback.error.mensaje ? jsonFallback.error.mensaje : (jsonFallback.mensaje || 'HTTP ' + respuestaFallback.status));
            errFallback2.status = respuestaFallback.status;
            throw errFallback2;
          }

          return jsonFallback.datos !== undefined ? jsonFallback.datos : jsonFallback;
          
        } catch (fallbackError) {
          console.error('[PETICIONES] Fallback también falló:', fallbackError.message);
          throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
        }
      }
    }
    
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
