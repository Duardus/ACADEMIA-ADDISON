/* ============================================
   🔐 CONFIGURACIÓN PASSKEYS - Academia Addison
   ============================================ */

var PASSKEY_CONFIG = {
  // WebAuthn RP ID (debe coincidir con el dominio del frontend)
  RP_ID: 'academia-addison.pages.dev',
  RP_NAME: 'Academia Addison',
  ORIGIN: 'https://academia-addison.pages.dev',
  
  // API endpoints
  API_BASE: API_CONFIG.BASE_URL,
  
  // Convertir base64url string a ArrayBuffer (para enviar al navegador)
  base64URLToBuffer: function(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },
  
  // Convertir ArrayBuffer a base64url string (para enviar al backend)
  // ESTA ES LA FUNCIÓN CRÍTICA - debe manejar ArrayBuffer correctamente
  bufferToBase64URL: function(buffer) {
    // Asegurar que es ArrayBuffer
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // Convertir a base64url (sin padding =)
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
};
