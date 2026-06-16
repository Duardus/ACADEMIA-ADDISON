// ============================================
// PLATFORM PATCH - Conecta frontend con Backend v3.0
// ============================================
// Este archivo NO modifica platform.js original.
// Solo se carga DESPUES y agrega la conexion con la API.

(function() {
  'use strict';
  
  // Esperar a que platform.js cargue
  const patchInterval = setInterval(() => {
    if (typeof auth !== 'undefined' && typeof state !== 'undefined' && typeof api !== 'undefined') {
      clearInterval(patchInterval);
      aplicarParche();
    }
  }, 100);
  
  async function aplicarParche() {
    console.log('[PATCH] Conectando con Backend Addison v3.0...');
    
    // Escuchar login de Firebase y sincronizar con backend
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Limpiar datos del backend al cerrar sesion
        localStorage.removeItem('token_addison');
        localStorage.removeItem('institucion_addison');
        localStorage.removeItem('usuario_addison');
        return;
      }
      
      try {
        const tokenFirebase = await user.getIdToken(true);
        const resultado = await api.login(tokenFirebase);
        
        if (resultado.tipo === 'login_directo') {
          // Una sola institucion
          localStorage.setItem('token_addison', resultado.token);
          localStorage.setItem('institucion_addison', JSON.stringify(resultado.institucion));
          localStorage.setItem('usuario_addison', JSON.stringify(resultado.usuario));
          
          // Enriquecer estado con rol del backend
          state.rolBackend = resultado.institucion.tipo_rol;
          state.nombreInstitucion = resultado.institucion.nombre_institucion;
          
          console.log('[PATCH] Login directo:', resultado.institucion.nombre_institucion, '| Rol:', resultado.institucion.tipo_rol);
          
          // Mostrar badge de rol en el header
          mostrarBadgeRol(resultado.institucion.tipo_rol, resultado.institucion.nombre_institucion);
        }
        else if (resultado.tipo === 'selector_requerido') {
          // Multiple instituciones - mostrar selector
          localStorage.setItem('token_preliminar', resultado.token_preliminar);
          mostrarSelectorInstituciones(resultado.membresias);
        }
        else if (resultado.error) {
          console.error('[PATCH] Backend error:', resultado.error);
        }
      } catch (error) {
        console.error('[PATCH] Error conectando backend:', error);
        // Fallo silencioso - la plataforma local sigue funcionando
      }
    });
  }
  
  function mostrarBadgeRol(rol, institucion) {
    const header = document.getElementById('userNameTop');
    if (!header) return;
    
    const colores = {
      superadmin: '#d32f2f',
      director: '#1976d2',
      professor: '#388e3c',
      auxiliary: '#f57c00',
      student: '#7b1fa2'
    };
    
    const nombres = {
      superadmin: 'Superadmin',
      director: 'Director',
      professor: 'Profesor',
      auxiliary: 'Auxiliar',
      student: 'Alumno'
    };
    
    const badge = document.createElement('span');
    badge.style.cssText = `display:inline-block;margin-left:8px;padding:2px 8px;border-radius:4px;background:${colores[rol]||'#666'};color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;`;
    badge.textContent = nombres[rol] || rol;
    
    const inst = document.createElement('span');
    inst.style.cssText = 'display:block;font-size:12px;color:#888;margin-top:2px;';
    inst.textContent = institucion;
    
    // Solo agregar una vez
    if (!header.querySelector('.rol-badge')) {
      badge.className = 'rol-badge';
      header.parentNode.appendChild(inst);
      header.appendChild(badge);
    }
  }
  
  function mostrarSelectorInstituciones(membresias) {
    const modal = document.createElement('div');
    modal.id = 'modalSelectorInstitucion';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
    
    const card = document.createElement('div');
    card.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px;border-radius:20px;max-width:450px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);';
    
    card.innerHTML = '<h2 style="margin-bottom:8px;color:#fff;font-size:24px;">Selecciona tu Institucion</h2><p style="color:#888;margin-bottom:24px;">Tienes acceso a multiples academias</p>';
    
    const activas = membresias.filter(m => m.estado_membresia === 'active');
    
    if (activas.length === 0) {
      card.innerHTML += '<p style="color:#d32f2f;">No tienes instituciones activas.</p>';
    }
    
    activas.forEach(m => {
      const btn = document.createElement('button');
      btn.style.cssText = 'display:block;width:100%;padding:18px;margin:10px 0;border:2px solid rgba(255,255,255,0.2);border-radius:12px;background:rgba(255,255,255,0.05);color:#fff;font-size:16px;cursor:pointer;transition:all 0.3s;text-align:left;';
      btn.innerHTML = `<strong style="font-size:18px;display:block;margin-bottom:4px;">${m.nombre_institucion}</strong><span style="font-size:13px;color:#aaa;text-transform:uppercase;">${m.tipo_rol}</span>`;
      btn.onmouseenter = () => { btn.style.background = 'rgba(25,118,210,0.3)'; btn.style.borderColor = '#1976d2'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.05)'; btn.style.borderColor = 'rgba(255,255,255,0.2)'; };
      btn.onclick = async () => {
        btn.style.opacity = '0.5';
        btn.textContent = 'Entrando...';
        const resultado = await api.seleccionarContexto(
          localStorage.getItem('token_preliminar'),
          m.membresia_id
        );
        if (resultado.token) {
          localStorage.setItem('token_addison', resultado.token);
          localStorage.setItem('institucion_addison', JSON.stringify(resultado.institucion));
          window.location.reload();
        }
      };
      card.appendChild(btn);
    });
    
    modal.appendChild(card);
    document.body.appendChild(modal);
  }
  
  // Helper global para LiveKit con backend
  window.obtenerTokenLiveKitBackend = async (nombreSala, rolSala) => {
    return await api.obtenerTokenLiveKit(nombreSala, rolSala);
  };
  
  // Helper para grabaciones
  window.iniciarGrabacionBackend = async (salaId, nombreSala) => {
    return await api.iniciarGrabacion(salaId, nombreSala);
  };
  
  window.detenerGrabacionBackend = async (grabacionId) => {
    return await api.detenerGrabacion(grabacionId);
  };
  
  window.listarGrabacionesBackend = async () => {
    return await api.listarGrabaciones();
  };
  
  console.log('[PATCH] Cargado. Esperando autenticacion Firebase...');
})();
