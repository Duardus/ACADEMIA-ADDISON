/* ============================================
   📁 ARCHIVO: login.ui.js
   📂 MÓDULO: login
   🔗 DEPENDENCIAS: NINGUNA (solo recibe callbacks)
   📝 CONTRATO:
     - Recibe objeto con callbacks: { onLoginGoogle, onSelectInstitucion }
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
