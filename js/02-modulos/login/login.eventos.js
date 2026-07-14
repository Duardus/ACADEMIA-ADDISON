/* ============================================
   📁 ARCHIVO: login.eventos.js
   📂 MÓDULO: login
   🔗 DEPENDENCIAS:
     - login.ui.js (renderizado)
     - login.api.js (HTTP)
     - sesion.js (localStorage)
   📝 CONTRATO:
     - Orquesta el flujo: click → popup Firebase → API → guardar sesión → callback éxito
     - Recibe callback onLoginExitoso(datos) para que app.js decida qué hacer
   🚫 NO TOCAR: DOM directo (usa login.ui.js), fetch directo (usa login.api.js)
   ============================================ */

async function iniciarLogin({ onLoginExitoso, onError }) {
  renderizarPantallaLogin({
    onLoginGoogle: () => manejarClickLogin({ onLoginExitoso, onError })
  });
}

async function manejarClickLogin({ onLoginExitoso, onError }) {
  try {
    const resultado = await auth.signInWithRedirect(googleProvider);

    if (!resultado.user) {
      throw new Error('No se obtuvo usuario de Firebase');
    }

    const tokenFirebase = await resultado.user.getIdToken(true);
    const datos = await apiLogin(tokenFirebase);

    if (datos.tipo === 'login_directo') {
      guardarToken(datos.token_sesion);
      guardarInstitucion(datos.institucion);
      guardarUsuario(datos.usuario);
      onLoginExitoso(datos);
    }
    else if (datos.tipo === 'selector_requerido') {
      renderizarSelectorInstituciones({
        membresias: datos.membresias,
        onSelect: (membresiaId) => manejarSeleccionInstitucion({
          tokenPreliminar: datos.token_preliminar,
          membresiaId,
          onLoginExitoso,
          onError
        })
      });
    }
    else if (datos.codigo) {
      await auth.signOut();
      onError(datos.mensaje || datos.error || 'Error de autenticación');
    }

  } catch (error) {
    console.error('[LOGIN] Error:', error);
    if (error.code === 'auth/popup-blocked') {
      onError('El navegador bloqueó el popup. Permite ventanas emergentes.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // Silencioso, usuario canceló
    } else {
      onError(error.message || 'Error al iniciar sesión');
    }
  }
}

async function manejarSeleccionInstitucion({ tokenPreliminar, membresiaId, onLoginExitoso, onError }) {
  try {
    const resultado = await apiSeleccionarContexto(tokenPreliminar, membresiaId);
    if (resultado.token_sesion) {
      guardarToken(resultado.token_sesion);
      guardarInstitucion(resultado.institucion);
      guardarUsuario(resultado.usuario);
      onLoginExitoso(resultado);
    }
  } catch (error) {
    onError(error.message || 'Error seleccionando institución');
  }
}
