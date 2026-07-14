/* ============================================
   🔐 EVENTOS PASSKEYS - Academia Addison
   ============================================ */

let correoRecordado = '';
let loginEnProgreso = false;
let registroEnProgreso = false;

function obtenerCorreoRecordado() {
  try {
    return localStorage.getItem('passkey_email_recordado') || '';
  } catch {
    return '';
  }
}

function guardarCorreoRecordado(correo) {
  try {
    localStorage.setItem('passkey_email_recordado', correo);
  } catch(e) {}
}

function limpiarCorreoRecordado() {
  try {
    localStorage.removeItem('passkey_email_recordado');
  } catch(e) {}
}

// ═════════════════════════════════════════════════════════════════
// REGISTRO
// ═════════════════════════════════════════════════════════════════
async function iniciarRegistroPasskey({ correo, nombre, onExito, onError }) {
  try {
    const respuesta = await apiPasskeyRegistroOpciones(correo, nombre);
    if (!respuesta.exito) {
      throw new Error(respuesta.mensaje || 'Error al iniciar registro');
    }

    const options = respuesta.options;
    options.challenge = PASSKEY_CONFIG.base64URLToBuffer(options.challenge);
    options.user.id = PASSKEY_CONFIG.base64URLToBuffer(options.user.id);

    const credential = await navigator.credentials.create({ publicKey: options });
    
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
    
    if (!verificacion.exito) {
      throw new Error(verificacion.mensaje || 'Verificación fallida');
    }

    guardarToken(verificacion.token_sesion);
    guardarUsuario(verificacion.usuario);
    guardarCorreoRecordado(correo);
    
    onExito(verificacion);
  } catch (error) {
    console.error('[PASSKEY REGISTRO] Error:', error);
    onError(error.message || 'Error al registrar passkey');
  }
}

// ═════════════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════════════
async function iniciarLoginPasskey({ correo, onExito, onError }) {
  try {
    const respuesta = await apiPasskeyLoginOpciones(correo);
    if (!respuesta.exito) {
      throw new Error(respuesta.mensaje || 'Error al iniciar login');
    }

    const options = respuesta.options;
    options.challenge = PASSKEY_CONFIG.base64URLToBuffer(options.challenge);
    
    if (options.allowCredentials) {
      options.allowCredentials = options.allowCredentials.map(cred => ({
        ...cred,
        id: PASSKEY_CONFIG.base64URLToBuffer(cred.id)
      }));
    }

    const assertion = await navigator.credentials.get({ publicKey: options });
    
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
    
    if (!verificacion.exito) {
      throw new Error(verificacion.mensaje || 'Autenticación fallida');
    }

    guardarToken(verificacion.token_sesion);
    guardarUsuario(verificacion.usuario);
    guardarCorreoRecordado(correo);
    
    onExito(verificacion);
  } catch (error) {
    console.error('[PASSKEY LOGIN] Error:', error);
    
    if (error.name === 'NotAllowedError') {
      onError('Autenticación cancelada o no permitida');
    } else if (error.name === 'SecurityError') {
      onError('Error de seguridad. Asegúrate de usar HTTPS');
    } else {
      onError(error.message || 'Error al iniciar sesión');
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// RECUPERACIÓN
// ═════════════════════════════════════════════════════════════════
async function iniciarRecuperacionPasskey({ correo, onExito, onError }) {
  try {
    const respuesta = await apiPasskeyRecuperacion(correo);
    onExito(respuesta.mensaje || 'Si el correo existe, recibirás un link de recuperación');
  } catch (error) {
    onError(error.message || 'Error al solicitar recuperación');
  }
}

// ═════════════════════════════════════════════════════════════════
// UI RENDER
// ═════════════════════════════════════════════════════════════════
function renderizarPantallaPasskey({ onLogin, onRegistro, onRecuperacion }) {
  const correoGuardado = obtenerCorreoRecordado();
  
  const html = `
    <div class="login-container">
      <div class="login-card">
        <h1>🎓 Academia Addison</h1>
        <p class="login-subtitle">Acceso seguro sin contraseñas</p>
        
        ${correoGuardado ? `
          <div class="correo-recordado">
            <span>👤 ${correoGuardado}</span>
            <button onclick="usarOtroCorreo()" class="btn-link">Cambiar</button>
          </div>
          <button onclick="manejarLogin('${correoGuardado}')" class="btn-principal">
            🔐 Entrar con acceso seguro
          </button>
        ` : `
          <div class="input-group">
            <input type="email" id="input-correo" placeholder="Tu correo electrónico" autocomplete="email">
          </div>
          <button onclick="manejarLogin()" class="btn-principal">
            🔐 Entrar con acceso seguro
          </button>
        `}
        
        <div class="login-separador">o</div>
        
        <button onclick="mostrarRegistro()" class="btn-secundario">
          🆕 Crear cuenta nueva
        </button>
        
        <div class="login-ayuda">
          <a onclick="mostrarRecuperacion()">¿Olvidaste tu acceso?</a>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = html;
}

function mostrarRegistro() {
  const html = `
    <div class="login-container">
      <div class="login-card">
        <h1>🎓 Crear cuenta</h1>
        
        <div class="input-group">
          <input type="email" id="reg-correo" placeholder="Correo electrónico" autocomplete="email">
        </div>
        <div class="input-group">
          <input type="text" id="reg-nombre" placeholder="Nombre completo" autocomplete="name">
        </div>
        
        <div class="info-box">
          <p>📱 <strong>Importante:</strong> Usa tu celular para crear tu acceso seguro.</p>
          <p>Tu huella digital o PIN será tu "contraseña".</p>
        </div>
        
        <button onclick="manejarRegistro()" class="btn-principal">
          ✅ Crear acceso seguro
        </button>
        
        <button onclick="volverAlLogin()" class="btn-link">← Volver</button>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = html;
}

function mostrarRecuperacion() {
  const html = `
    <div class="login-container">
      <div class="login-card">
        <h1>🔄 Recuperar acceso</h1>
        
        <div class="input-group">
          <input type="email" id="rec-correo" placeholder="Tu correo electrónico">
        </div>
        
        <div class="info-box warning">
          <p>🔑 <strong>Si guardaste tu código de recuperación:</strong></p>
          <p>Usa las 12 palabras que te mostramos al registrarte.</p>
        </div>
        
        <button onclick="manejarRecuperacion()" class="btn-principal">
          📧 Enviar link de recuperación
        </button>
        
        <button onclick="volverAlLogin()" class="btn-link">← Volver</button>
      </div>
    </div>
  `;
  
  document.getElementById('app').innerHTML = html;
}

function usarOtroCorreo() {
  limpiarCorreoRecordado();
  renderizarPantallaPasskey({
    onLogin: (d) => app.manejarRespuestaLogin(d),
    onError: (msg) => app.mostrarToast(msg, 'error')
  });
}

function volverAlLogin() {
  renderizarPantallaPasskey({
    onLogin: (d) => app.manejarRespuestaLogin(d),
    onError: (msg) => app.mostrarToast(msg, 'error')
  });
}

async function manejarLogin(correoPrellenado) {
  if (loginEnProgreso) return;
  loginEnProgreso = true;
  
  try {
    const correo = correoPrellenado || document.getElementById('input-correo')?.value?.trim();
    
    if (!correo) {
      app.mostrarToast('Ingresa tu correo electrónico', 'error');
      return;
    }
    
    await iniciarLoginPasskey({
      correo,
      onExito: (datos) => app.manejarRespuestaLogin(datos),
      onError: (msg) => app.mostrarToast(msg, 'error')
    });
  } finally {
    loginEnProgreso = false;
  }
}

async function manejarRegistro() {
  if (registroEnProgreso) return;
  registroEnProgreso = true;
  
  try {
    const correo = document.getElementById('reg-correo')?.value?.trim();
    const nombre = document.getElementById('reg-nombre')?.value?.trim();
    
    if (!correo || !nombre) {
      app.mostrarToast('Correo y nombre son obligatorios', 'error');
      return;
    }
    
    await iniciarRegistroPasskey({
      correo,
      nombre,
      onExito: (datos) => {
        app.mostrarToast('✅ Cuenta creada exitosamente', 'exito');
        app.manejarRespuestaLogin(datos);
      },
      onError: (msg) => app.mostrarToast(msg, 'error')
    });
  } finally {
    registroEnProgreso = false;
  }
}

async function manejarRecuperacion() {
  const correo = document.getElementById('rec-correo')?.value?.trim();
  
  if (!correo) {
    app.mostrarToast('Ingresa tu correo', 'error');
    return;
  }
  
  await iniciarRecuperacionPasskey({
    correo,
    onExito: (msg) => {
      app.mostrarToast(msg, 'info');
      volverAlLogin();
    },
    onError: (msg) => app.mostrarToast(msg, 'error')
  });
}
