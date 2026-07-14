// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Eventos Passkeys v16
// Fix: usar mostrarToast (de app.js) o alert fallback. Fix DNS con IP directa.
// ═══════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // Fallback si mostrarToast no existe globalmente
  function notificar(tipo, mensaje) {
    if (typeof mostrarToast === 'function') {
      mostrarToast(mensaje, tipo);
    } else if (typeof alert === 'function') {
      alert('[' + tipo.toUpperCase() + '] ' + mensaje);
    } else {
      console.log('[' + tipo + ']', mensaje);
    }
  }

  window.registroEnProceso = false;
  window.loginEnProceso = false;

  // ─── REGISTRO ─────────────────────────────────────────────────────────

  window.iniciarRegistroPasskey = async function(correo, nombre) {
    if (window.registroEnProceso) {
      notificar('warning', '⏳ Registro en proceso, espera...');
      return;
    }
    window.registroEnProceso = true;

    try {
      if (!window.PublicKeyCredential) {
        notificar('error', '❌ Tu navegador no soporta passkeys. Usa Chrome, Edge, Safari o Firefox.');
        return;
      }

      const respuestaOpciones = await apiPasskeyRegistroOpciones(correo, nombre);
      if (!respuestaOpciones || !respuestaOpciones.exito) {
        notificar('error', (respuestaOpciones && respuestaOpciones.mensaje) || 'Error al obtener opciones de registro');
        return;
      }

      const options = JSON.parse(JSON.stringify(respuestaOpciones.options));
      if (typeof options.challenge === 'string') {
        options.challenge = PASSKEY_CONFIG.base64URLToBuffer(options.challenge);
      }
      if (options.user && typeof options.user.id === 'string') {
        options.user.id = PASSKEY_CONFIG.base64URLToBuffer(options.user.id);
      }

      const credential = await navigator.credentials.create({ publicKey: options });
      
      if (!credential) {
        notificar('error', '❌ No se pudo crear el passkey. Intenta de nuevo.');
        return;
      }

      const respuestaCliente = {
        id: PASSKEY_CONFIG.bufferToBase64URL(credential.rawId),
        rawId: PASSKEY_CONFIG.bufferToBase64URL(credential.rawId),
        response: {
          clientDataJSON: PASSKEY_CONFIG.bufferToBase64URL(credential.response.clientDataJSON),
          attestationObject: PASSKEY_CONFIG.bufferToBase64URL(credential.response.attestationObject)
        },
        type: credential.type
      };
      if (verificacion && verificacion.exito) {
        if (typeof guardarSesion === 'function') guardarSesion(verificacion.token_sesion, verificacion.usuario);
        
        notificar('exito', '✅ ¡Passkey creado exitosamente! Bienvenido.');
        setTimeout(function() {
          window.location.href = '/';
        }, 1500);
      } else {
        if (typeof guardarSesion === 'function') guardarSesion(verificacion.token_sesion, verificacion.usuario);
        
        notificar('exito', '✅ ¡Passkey creado exitosamente! Bienvenido.');
        setTimeout(function() {
          // window.location.href = '/'; // DEBUG: redireccion desactivada
        }, 1500);
      } else {
        notificar('error', (verificacion && verificacion.mensaje) || 'Error al verificar el passkey');
      }

    } catch (error) {
      console.error('[PASSKEY REGISTRO] Error:', error);
      if (error.name === 'NotAllowedError') {
        notificar('warning', '⚠️ Registro cancelado. Elige tu dispositivo en la lista.');
      } else if (error.name === 'AbortError') {
        notificar('info', 'ℹ️ Registro cancelado.');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        notificar('error', '❌ No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        notificar('error', '❌ Error: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      window.registroEnProceso = false;
    }
  };

  // ─── LOGIN ──────────────────────────────────────────────────────────────

  window.iniciarLoginPasskey = async function(correo) {
    if (window.loginEnProceso) {
      notificar('warning', '⏳ Login en proceso, espera...');
      return;
    }
    window.loginEnProceso = true;

    try {
      if (!window.PublicKeyCredential) {
        notificar('error', '❌ Tu navegador no soporta passkeys.');
        return;
      }

      const respuestaOpciones = await apiPasskeyLoginOpciones(correo);
      
      if (respuestaOpciones && respuestaOpciones.requiere_registro) {
        notificar('info', '💡 No tienes passkeys. Creando uno...');
        await new Promise(r => setTimeout(r, 1500));
        const nombre = respuestaOpciones.nombre || correo.split('@')[0];
        await window.iniciarRegistroPasskey(correo, nombre);
        return;
      }
      
      if (!respuestaOpciones || !respuestaOpciones.exito) {
        notificar('error', (respuestaOpciones && respuestaOpciones.mensaje) || 'Error al obtener opciones de login');
        return;
      }

      const options = JSON.parse(JSON.stringify(respuestaOpciones.options));
      if (typeof options.challenge === 'string') {
        options.challenge = PASSKEY_CONFIG.base64URLToBuffer(options.challenge);
      }
      if (options.allowCredentials) {
        options.allowCredentials = options.allowCredentials.map(function(cred) {
          return {
            id: PASSKEY_CONFIG.base64URLToBuffer(cred.id),
            type: cred.type
          };
        });
      }

      const assertion = await navigator.credentials.get({ publicKey: options });
      
      if (!assertion) {
        notificar('error', '❌ No se pudo autenticar. Intenta de nuevo.');
        return;
      }

      const respuestaCliente = {
        id: PASSKEY_CONFIG.bufferToBase64URL(assertion.rawId),
        rawId: PASSKEY_CONFIG.bufferToBase64URL(assertion.rawId),
        response: {
          authenticatorData: PASSKEY_CONFIG.bufferToBase64URL(assertion.response.authenticatorData),
          clientDataJSON: PASSKEY_CONFIG.bufferToBase64URL(assertion.response.clientDataJSON),
          signature: PASSKEY_CONFIG.bufferToBase64URL(assertion.response.signature),
          userHandle: assertion.response.userHandle ? PASSKEY_CONFIG.bufferToBase64URL(assertion.response.userHandle) : null
        },
        type: assertion.type
      };

      const verificacion = await apiPasskeyLoginVerificar(correo, respuestaCliente);
      
      if (verificacion && verificacion.exito) {
        } else {
        }
        if (verificacion && verificacion.exito) {
        if (typeof guardarSesion === 'function') guardarSesion(verificacion.token_sesion, verificacion.usuario);
        
        notificar('exito', '✅ ¡Bienvenido de vuelta!');
        setTimeout(function() {
          // window.location.href = '/'; // DEBUG: redireccion desactivada
        }, 1000);
      } else {
        notificar('error', (verificacion && verificacion.mensaje) || 'Error al verificar autenticación');
      }

    } catch (error) {
      console.error('[PASSKEY LOGIN] Error:', error);
      if (error.name === 'NotAllowedError') {
        notificar('warning', '⚠️ Autenticación cancelada. Elige tu dispositivo en la lista.');
      } else if (error.name === 'AbortError') {
        notificar('info', 'ℹ️ Login cancelado.');
      } else if (error.message && error.message.includes('Failed to fetch')) {
        notificar('error', '❌ No se pudo conectar con el servidor. Verifica tu conexión a internet.');
      } else {
        notificar('error', '❌ Error: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      window.loginEnProceso = false;
    }
  };

  // ─── MANEJADORES DE BOTONES (onclick inline) ───────────────────────────

  window.manejarRegistroPasskey = function(evento) {
    if (evento) evento.preventDefault();
    var correo = document.getElementById('correo-registro');
    var nombre = document.getElementById('nombre-registro');
    
    correo = correo ? correo.value.trim() : '';
    nombre = nombre ? nombre.value.trim() : '';

    if (!correo || !nombre) {
      notificar('warning', '⚠️ Completa todos los campos');
      return;
    }
    if (correo.indexOf('@') === -1) {
      notificar('warning', '⚠️ Ingresa un correo válido');
      return;
    }

    window.iniciarRegistroPasskey(correo, nombre);
  };

  window.manejarLoginPasskey = function(evento) {
    if (evento) evento.preventDefault();
    var correo = document.getElementById('correo-login');
    correo = correo ? correo.value.trim() : '';

    if (!correo) {
      notificar('warning', '⚠️ Ingresa tu correo');
      return;
    }
    if (correo.indexOf('@') === -1) {
      notificar('warning', '⚠️ Ingresa un correo válido');
      return;
    }

    window.iniciarLoginPasskey(correo);
  };

})();
