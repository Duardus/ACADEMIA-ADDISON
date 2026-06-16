const admin = require('firebase-admin');

let appFirebase = null;

function iniciarFirebase() {
  try {
    const rutaCredenciales = process.env.FIREBASE_CREDENCIALES_RUTA || './config/serviceAccountKey.json';
    appFirebase = admin.initializeApp({
      credential: admin.credential.cert(require(rutaCredenciales))
    });
    console.log('✅ Firebase Admin inicializado (solo Auth)');
    return appFirebase;
  } catch (error) {
    console.error('❌ Error Firebase:', error.message);
    throw error;
  }
}

function obtenerAuth() {
  if (!appFirebase) iniciarFirebase();
  return appFirebase.auth();
}

module.exports = { iniciarFirebase, obtenerAuth, admin };
