// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Eventos Passkeys v12
// Fix: evitar doble mensaje éxito/error, mejorar UX para "choose passkey"
// ═══════════════════════════════════════════════════════════════════════════

import { apiPasskeyRegistroOpciones, apiPasskeyRegistroVerificar, apiPasskeyLoginOpciones, apiPasskeyLoginVerificar } from './passkey.api.js';
import { guardarSesion, obtenerSesion, limpiarSesion } from '../../01-nucleo/sesion.js';
import { mostrarNotificacion } from '../../01-nucleo/notificaciones.js';

let registroEnProceso = false;
let loginEnProceso = false;

// Verificar soporte de WebAuthn
function webAuthnSoportado() {
  return window.PublicKeyCredential !== undefined;
}

// Verificar si hay platform authenticator disponible
async function platformAuthenticatorDisponible() {
  if (!webAuthnSoportado()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) {
    return false;
  }
}

// Mostrar mensaje informativo sobre passkeys
function mostrarInfoPasskeys() {
  const esDisponible = platformAuthenticatorDisponible();
  if (!esDisponible) {
    mostrarNotificacion('info', '💡 Si no ves opción de PIN o huella, elige tu dispositivo (teléfono, tablet) para continuar.');
  }
}

// ─── REGISTRO ─────────────────────────────────────────────────────────────

export async function iniciarRegistroPasskey(correo, nombre) {
  if (registroEnProceso) {
    mostrarNotificacion('warning', '⏳ Registro en proceso, espera...');
    return;
  }
  registroEnProceso = true;

  try {
    if (!webAuthnSoportado()) {
      mostrarNotificacion('error', '❌ Tu navegador no soporta passkeys. Usa Chrome, Edge, Safari o Firefox.');
      return;
    }

    // 1. Obtener opciones del servidor
    const respuestaOpciones = await apiPasskeyRegistroOpciones(correo, nombre);
    if (!respuestaOpciones.exito) {
      mostrarNotificacion('error', respuestaOpciones.error?.mensaje || 'Error al obtener opciones de registro');
      return;
    }

    // 2. Crear credencial con WebAuthn
    const credential = await navigator.credentials.create({
      publicKey: respuestaOpciones.options
    });

    if (!credential) {
      mostrarNotificacion('error', '❌ No se pudo crear el passkey. Intenta de nuevo.');
      return;
    }

    // 3. Enviar verificación al servidor
    const respuestaVerificar = await apiPasskeyRegistroVerificar(correo, credential);
    
    if (respuestaVerificar.exito) {
      // ÉXITO — guardar sesión y redirigir
      guardarSesion({
        token: respuestaVerificar.token_sesion,
        refreshToken: respuestaVerificar.refresh_token,
        usuario: respuestaVerificar.usuario
      });
      mostrarNotificacion('exito', '✅ ¡Cuenta creada exitosamente! Bienvenido.');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);
    } else {
      // ERROR del servidor
      mostrarNotificacion('error', respuestaVerificar.error?.mensaje || 'Error al verificar el passkey');
    }

  } catch (error) {
    console.error('[PASSKEY REGISTRO] Error:', error);
    
    if (error.name === 'NotAllowedError') {
      mostrarNotificacion('warning', '⚠️ Registro cancelado. Si no ves opción de PIN/huella, elige tu dispositivo en la lista.');
    } else if (error.name === 'AbortError') {
      mostrarNotificacion('info', 'ℹ️ Registro cancelado por el usuario.');
    } else if (error.name === 'SecurityError') {
      mostrarNotificacion('error', '❌ Error de seguridad: el dominio no coincide. Contacta soporte.');
    } else {
      mostrarNotificacion('error', '❌ Error: ' + (error.message || 'Error desconocido en registro'));
    }
  } finally {
    registroEnProceso = false;
  }
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────

export async function iniciarLoginPasskey(correo) {
  if (loginEnProceso) {
    mostrarNotificacion('warning', '⏳ Login en proceso, espera...');
    return;
  }
  loginEnProceso = true;

  try {
    if (!webAuthnSoportado()) {
      mostrarNotificacion('error', '❌ Tu navegador no soporta passkeys.');
      return;
    }

    // 1. Obtener opciones de login
    const respuestaOpciones = await apiPasskeyLoginOpciones(correo);
    if (!respuestaOpciones.exito) {
      mostrarNotificacion('error', respuestaOpciones.error?.mensaje || 'Error al obtener opciones de login');
      return;
    }

    // 2. Mostrar info si no hay platform authenticator
    mostrarInfoPasskeys();

    // 3. Solicitar autenticación
    const assertion = await navigator.credentials.get({
      publicKey: respuestaOpciones.options
    });

    if (!assertion) {
      mostrarNotificacion('error', '❌ No se pudo autenticar. Intenta de nuevo.');
      return;
    }

    // 4. Verificar con servidor
    const respuestaVerificar = await apiPasskeyLoginVerificar(correo, assertion);
    
    if (respuestaVerificar.exito) {
      guardarSesion({
        token: respuestaVerificar.token_sesion,
        refreshToken: respuestaVerificar.refresh_token,
        usuario: respuestaVerificar.usuario
      });
      mostrarNotificacion('exito', '✅ ¡Bienvenido de vuelta!');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1000);
    } else {
      mostrarNotificacion('error', respuestaVerificar.error?.mensaje || 'Error al verificar autenticación');
    }

  } catch (error) {
    console.error('[PASSKEY LOGIN] Error:', error);
    
    if (error.name === 'NotAllowedError') {
      mostrarNotificacion('warning', '⚠️ Autenticación cancelada. Elige tu dispositivo en la lista y sigue las instrucciones.');
    } else if (error.name === 'AbortError') {
      mostrarNotificacion('info', 'ℹ️ Login cancelado por el usuario.');
    } else if (error.name === 'SecurityError') {
      mostrarNotificacion('error', '❌ Error de seguridad: dominio no coincide.');
    } else {
      mostrarNotificacion('error', '❌ Error: ' + (error.message || 'Error desconocido en login'));
    }
  } finally {
    loginEnProceso = false;
  }
}

// ─── MANEJADORES DE BOTONES ────────────────────────────────────────────────

export function manejarRegistro(evento) {
  evento.preventDefault();
  const correo = document.getElementById('correo-registro')?.value?.trim();
  const nombre = document.getElementById('nombre-registro')?.value?.trim();

  if (!correo || !nombre) {
    mostrarNotificacion('warning', '⚠️ Completa todos los campos');
    return;
  }
  if (!correo.includes('@')) {
    mostrarNotificacion('warning', '⚠️ Ingresa un correo válido');
    return;
  }

  iniciarRegistroPasskey(correo, nombre);
}

export function manejarLogin(evento) {
  evento.preventDefault();
  const correo = document.getElementById('correo-login')?.value?.trim();

  if (!correo) {
    mostrarNotificacion('warning', '⚠️ Ingresa tu correo');
    return;
  }
  if (!correo.includes('@')) {
    mostrarNotificacion('warning', '⚠️ Ingresa un correo válido');
    return;
  }

  iniciarLoginPasskey(correo);
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────────────────

export function inicializarPasskey() {
  const btnRegistro = document.getElementById('btn-registro-passkey');
  const btnLogin = document.getElementById('btn-login-passkey');

  if (btnRegistro) {
    btnRegistro.addEventListener('click', manejarRegistro);
  }
  if (btnLogin) {
    btnLogin.addEventListener('click', manejarLogin);
  }

  // Verificar si ya hay sesión
  const sesion = obtenerSesion();
  if (sesion && sesion.token) {
    const path = window.location.pathname;
    if (path.includes('login') || path.includes('registro') || path === '/' || path === '/index.html') {
      window.location.href = '/dashboard.html';
    }
  }
}
