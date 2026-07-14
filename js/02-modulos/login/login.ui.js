/* ============================================
   📁 ARCHIVO: login.ui.js
   📂 MÓDULO: login
   🔗 DEPENDENCIAS: NINGUNA (solo recibe callbacks)
   📝 CONTRATO:
     - Renderiza en #app, NUNCA hace fetch
   🚫 NO TOCAR: API calls, Firebase, localStorage
   ============================================ */

function renderizarPantallaLogin({ onLoginGoogle }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="pantalla-bienvenida">
      <div class="bienvenida-izquierda">
        <h1>Academia Addison</h1>
        <p>Plataforma educativa profesional para academias preuniversitarias.</p>
      </div>
      <div class="bienvenida-derecha">
        <div class="login-tarjeta">
          <h2>Bienvenido</h2>
          <p class="sub">Inicia sesión con tu cuenta Google</p>
          <button class="btn" id="btnLoginGoogle">
            <span style="margin-right:8px;">🔑</span> Entrar con Google
          </button>
          <p style="text-align:center;margin-top:16px;font-size:12px;color:var(--texto-secundario);">
            ¿No tienes cuenta? Contacta a tu academia
          </p>
        </div>
      </div>
    </div>
  `;
  document.getElementById('btnLoginGoogle').addEventListener('click', onLoginGoogle);
}

function renderizarPantallaPasskey({ onLogin, onError }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="pantalla-bienvenida">
      <div class="bienvenida-izquierda">
        <h1>Academia Addison</h1>
        <p>Plataforma educativa profesional para academias preuniversitarias.</p>
      </div>
      <div class="bienvenida-derecha">
        <div class="login-tarjeta">
          <h2>Acceso Seguro</h2>
          <p class="sub">Usa tu passkey para entrar</p>
          
          <!-- LOGIN -->
          <div id="seccion-login" style="margin-bottom:20px;">
            <input type="email" id="correo-login" placeholder="Tu correo electrónico" 
              style="width:100%;padding:10px;margin-bottom:10px;border-radius:6px;border:1px solid var(--borde);background:var(--superficie-2);color:var(--texto-principal);">
            <button class="btn" id="btn-login-passkey" style="width:100%;">
              <span style="margin-right:8px;">🔐</span> Acceder con Passkey
            </button>
          </div>
          
          <div style="text-align:center;margin:16px 0;font-size:12px;color:var(--texto-secundario);">
            ─── o ───
          </div>
          
          <!-- REGISTRO -->
          <div id="seccion-registro">
            <p style="font-size:12px;color:var(--texto-secundario);margin-bottom:10px;">¿Primera vez? Crea tu cuenta</p>
            <input type="email" id="correo-registro" placeholder="Correo electrónico" 
              style="width:100%;padding:10px;margin-bottom:8px;border-radius:6px;border:1px solid var(--borde);background:var(--superficie-2);color:var(--texto-principal);">
            <input type="text" id="nombre-registro" placeholder="Tu nombre completo" 
              style="width:100%;padding:10px;margin-bottom:10px;border-radius:6px;border:1px solid var(--borde);background:var(--superficie-2);color:var(--texto-principal);">
            <button class="btn btn-secundario" id="btn-registro-passkey" style="width:100%;">
              <span style="margin-right:8px;">✨</span> Crear cuenta con Passkey
            </button>
          </div>
          
          <p style="text-align:center;margin-top:16px;font-size:11px;color:var(--texto-secundario);">
            💡 Si no ves opción de PIN o huella, elige tu dispositivo en la lista
          </p>
        </div>
      </div>
    </div>
  `;
  
  // Los event listeners se agregan en passkey.eventos.js (DOMContentLoaded)
  // Pero por si acaso, verificar que los botones existen
  const btnLogin = document.getElementById('btn-login-passkey');
  const btnRegistro = document.getElementById('btn-registro-passkey');
  
  if (!btnLogin || !btnRegistro) {
    console.error('[LOGIN.UI] Botones no encontrados después de renderizar');
  }
}

function renderizarSelectorInstituciones({ membresias, onSelect }) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="modal">
      <div class="modal-tarjeta" style="max-width:500px;">
        <h3>Selecciona tu Institución</h3>
        <p style="color:var(--texto-secundario);margin-bottom:16px;">
          Tienes acceso a ${membresias.length} academias
        </p>
        <div id="listaInstituciones" style="display:flex;flex-direction:column;gap:10px;"></div>
      </div>
    </div>
  `;

  const lista = document.getElementById('listaInstituciones');
  membresias.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secundario';
    btn.style.cssText = 'text-align:left;justify-content:flex-start;';
    btn.innerHTML = `
      <div style="font-size:16px;font-weight:700;">${m.nombre_institucion}</div>
      <div style="font-size:12px;text-transform:uppercase;opacity:.7;">${m.nombre_rol || m.tipo_rol}</div>
    `;
    btn.addEventListener('click', () => onSelect(m.membresia_id));
    lista.appendChild(btn);
  });
}
