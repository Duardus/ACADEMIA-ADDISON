// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Eventos Passkeys v15
// Fix: funciones globales puras, onclick inline en HTML, sin DOMContentLoaded
// ═══════════════════════════════════════════════════════════════════════════

(function() {
  'use strict';

  window.registroEnProceso = false;
  window.loginEnProceso = false;

  // ─── REGISTRO ─────────────────────────────────────────────────────────

  window.iniciarRegistroPasskey = async function(correo, nombre) {
    if (window.registroEnProceso) {
      mostrarNotificacion('warning', '⏳ Registro en proceso, espera...');
      return;
    }
    window.registroEnProceso = true;

    try {
      if (!window.PublicKeyCredential) {
        mostrarNotificacion('error', '❌ Tu navegador no soporta passkeys. Usa Chrome, Edge, Safari o Firefox.');
        return;
      }

      const respuestaOpciones = await apiPasskeyRegistroOpciones(correo, nombre);
      if (!respuestaOpciones || !respuestaOpciones.exito) {
        mostrarNotificacion('error', (respuestaOpciones && respuestaOpciones.mensaje) || 'Error al obtener opciones de registro');
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
        mostrarNotificacion('error', '❌ No se pudo crear el passkey. Intenta de nuevo.');
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

      const verificacion = await apiPasskeyRegistroVerificar(correo, respuestaCliente);
      
      if (verificacion && verificacion.exito) {
        if (typeof guardarToken === 'function') guardarToken(verificacion.token_sesion);
        if (typeof guardarUsuario === 'function') guardarUsuario(verificacion.usuario);
        if (typeof guardarCorreoRecordado === 'function') guardarCorreoRecordado(correo);
        
        mostrarNotificacion('exito', '✅ ¡Passkey creado exitosamente! Bienvenido.');
        setTimeout(function() {
          window.location.href = '/dashboard.html';
        }, 1500);
      } else {
        mostrarNotificacion('error', (verificacion && verificacion.mensaje) || 'Error al verificar el passkey');
      }

    } catch (error) {
      console.error('[PASSKEY REGISTRO] Error:', error);
      if (error.name === 'NotAllowedError') {
        mostrarNotificacion('warning', '⚠️ Registro cancelado. Elige tu dispositivo en la lista.');
      } else if (error.name === 'AbortError') {
        mostrarNotificacion('info', 'ℹ️ Registro cancelado.');
      } else {
        mostrarNotificacion('error', '❌ Error: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      window.registroEnProceso = false;
    }
  };

  // ─── LOGIN ──────────────────────────────────────────────────────────────

  window.iniciarLoginPasskey = async function(correo) {
    if (window.loginEnProceso) {
      mostrarNotificacion('warning', '⏳ Login en proceso, espera...');
      return;
    }
    window.loginEnProceso = true;

    try {
      if (!window.PublicKeyCredential) {
        mostrarNotificacion('error', '❌ Tu navegador no soporta passkeys.');
        return;
      }

      const respuestaOpciones = await apiPasskeyLoginOpciones(correo);
      
      if (respuestaOpciones && respuestaOpciones.requiere_registro) {
        mostrarNotificacion('info', '💡 No tienes passkeys. Creando uno...');
        await new Promise(r => setTimeout(r, 1500));
        const nombre = respuestaOpciones.nombre || correo.split('@')[0];
        await window.iniciarRegistroPasskey(correo, nombre);
        return;
      }
      
      if (!respuestaOpciones || !respuestaOpciones.exito) {
        mostrarNotificacion('error', (respuestaOpciones && respuestaOpciones.mensaje) || 'Error al obtener opciones de login');
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
        mostrarNotificacion('error', '❌ No se pudo autenticar. Intenta de nuevo.');
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
        if (typeof guardarToken === 'function') guardarToken(verificacion.token_sesion);
        if (typeof guardarUsuario === 'function') guardarUsuario(verificacion.usuario);
        if (typeof guardarCorreoRecordado === 'function') guardarCorreoRecordado(correo);
        
        mostrarNotificacion('exito', '✅ ¡Bienvenido de vuelta!');
        setTimeout(function() {
          window.location.href = '/dashboard.html';
        }, 1000);
      } else {
        mostrarNotificacion('error', (verificacion && verificacion.mensaje) || 'Error al verificar autenticación');
      }

    } catch (error) {
      console.error('[PASSKEY LOGIN] Error:', error);
      if (error.name === 'NotAllowedError') {
        mostrarNotificacion('warning', '⚠️ Autenticación cancelada. Elige tu dispositivo en la lista.');
      } else if (error.name === 'AbortError') {
        mostrarNotificacion('info', 'ℹ️ Login cancelado.');
      } else {
        mostrarNotificacion('error', '❌ Error: ' + (error.message || 'Error desconocido'));
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
      mostrarNotificacion('warning', '⚠️ Completa todos los campos');
      return;
    }
    if (correo.indexOf('@') === -1) {
      mostrarNotificacion('warning', '⚠️ Ingresa un correo válido');
      return;
    }

    window.iniciarRegistroPasskey(correo, nombre);
  };

  window.manejarLoginPasskey = function(evento) {
    if (evento) evento.preventDefault();
    var correo = document.getElementById('correo-login');
    correo = correo ? correo.value.trim() : '';

    if (!correo) {
      mostrarNotificacion('warning', '⚠️ Ingresa tu correo');
      return;
    }
    if (correo.indexOf('@') === -1) {
      mostrarNotificacion('warning', '⚠️ Ingresa un correo válido');
      return;
    }

    window.iniciarLoginPasskey(correo);
  };

})();
