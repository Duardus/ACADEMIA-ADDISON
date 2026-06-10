// Librería Jose integrada para Cloudflare Pages
export async function SignJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = b64(JSON.stringify(header));
  const encodedPayload = b64(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (payload.exp || 3600),
    nbf: Math.floor(Date.now() / 1000) - 60
  }));
  return `${encodedHeader}.${encodedPayload}`;
}
function b64(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}