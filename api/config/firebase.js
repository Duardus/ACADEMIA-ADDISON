// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Configuracion Firebase Admin (solo verificacion de tokens)
// ═══════════════════════════════════════════════════════════════════════════

const admin = require('firebase-admin');

let firebaseInicializado = false;

function inicializarFirebase() {
  if (firebaseInicializado) return admin;

  try {
    // Intentar usar GOOGLE_APPLICATION_CREDENTIALS primero
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
      });
      console.log('[FIREBASE] ✅ Inicializado via GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      // Fallback: inicializar con config minima (solo verificacion de tokens publicos)
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'academia-adison',
      });
      console.log('[FIREBASE] ✅ Inicializado en modo verificacion publica');
    }

    firebaseInicializado = true;
    return admin;
  } catch (error) {
    console.error('[FIREBASE] ❌ Error al inicializar:', error.message);
    throw error;
  }
}

async function verificarTokenFirebase(tokenId) {
  const app = inicializarFirebase();
  try {
    const decoded = await app.auth().verifyIdToken(tokenId);
    return {
      valido: true,
      uid: decoded.uid,
      email: decoded.email || null,
      nombre: decoded.name || null,
      foto: decoded.picture || null,
      firebase: decoded,
    };
  } catch (error) {
    return {
      valido: false,
      error: error.message,
    };
  }
}

module.exports = {
  inicializarFirebase,
  verificarTokenFirebase,
  admin,
};
