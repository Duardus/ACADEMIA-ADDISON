/* ============================================
   SERVICIO: Sincronización Firebase
   Responsabilidad única: Crear/eliminar usuarios en Firebase Auth
   ============================================ */

const { obtenerAuth } = require('../configuracion/firebase');

class FirebaseSyncServicio {
  
  async crearUsuario(uid, email, displayName, password = 'Temporal123!') {
    try {
      const auth = obtenerAuth();
      await auth.createUser({
        uid,
        email,
        password,
        displayName: displayName || email.split('@')[0]
      });
      console.log('✅ Firebase: usuario creado', uid);
      return { exito: true, uid };
    } catch (error) {
      console.warn('⚠️ Firebase: error creando usuario:', error.message);
      return { exito: false, error: error.message };
    }
  }

  async eliminarUsuario(uid) {
    try {
      const auth = obtenerAuth();
      await auth.deleteUser(uid);
      console.log('✅ Firebase: usuario eliminado', uid);
      return { exito: true, uid };
    } catch (error) {
      console.warn('⚠️ Firebase: error eliminando usuario:', error.message);
      return { exito: false, error: error.message };
    }
  }

  async verificarUsuario(uid) {
    try {
      const auth = obtenerAuth();
      await auth.getUser(uid);
      return { existe: true, uid };
    } catch (error) {
      return { existe: false, uid, error: error.message };
    }
  }
}

module.exports = new FirebaseSyncServicio();
