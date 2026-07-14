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
  
  // Helpers para codificar/decodear base64url (WebAuthn usa base64url)
  base64URLToBuffer: function(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  },
  
  bufferToBase64URL: function(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
};
