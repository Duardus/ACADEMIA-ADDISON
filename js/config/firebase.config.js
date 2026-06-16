/* ============================================
   🔥 CONFIGURACIÓN FIREBASE - Solo Auth
   ============================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ",
  authDomain: "academia-adison.firebaseapp.com",
  projectId: "academia-adison",
  storageBucket: "academia-adison.firebasestorage.app",
  messagingSenderId: "92334581820",
  appId: "1:92334581820:web:5e456f7c475119db95fb39",
  measurementId: "G-YR4YL6B5WY"
};

// Inicializar Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
