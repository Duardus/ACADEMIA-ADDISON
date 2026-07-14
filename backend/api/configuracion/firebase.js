const admin = require('firebase-admin');
const path = require('path');

let appFirebase = null;

function iniciarFirebase() {
  try {
    const rutaCredenciales = path.join(__dirname, '../../config/serviceAccountKey.json');
    appFirebase = admin.initializeApp({
      credential: admin.credential.cert(require(rutaCredenciales))
    });
    console.log('✅ Firebase Admin inicializado correctamente');
    return appFirebase;
  } catch (error) {
    console.error('❌ Error fatal en Firebase:', error.message);
    throw error;
  }
}

function obtenerAuth() {
  if (!appFirebase) iniciarFirebase();
  return appFirebase.auth();
}

module.exports = { iniciarFirebase, obtenerAuth, admin };
