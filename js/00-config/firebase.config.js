/* ============================================
   🔥 CONFIGURACIÓN FIREBASE - Academia Addison Live
   ============================================ */

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ",
  authDomain: "academia-adison.firebaseapp.com",
  projectId: "academia-adison",
  storageBucket: "academia-adison.firebasestorage.app",
  messagingSenderId: "92334581820",
  appId: "1:92334581820:web:36269f9072ea98e795fb39",
  measurementId: "G-PSCHY884CH"
};

// Inicializar Firebase
firebase.initializeApp(FIREBASE_CONFIG);
var auth = firebase.auth();
var db = firebase.firestore();
var googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
