// Criptografía nativa para Cloudflare Pages (Firma JWT real para LiveKit)
export async function SignJWT(payload, secretInput) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  // Convertir el secret a un formato que entienda el motor criptográfico
  const enc = new TextEncoder();
  const keyData = enc.encode(secretInput || "");
  const key = await crypto.subtle.importKey(
    "raw", keyData,
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );

  const encodedHeader = b64(JSON.stringify(header));
  const encodedPayload = b64(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (payload.exp || 3600),
    nbf: Math.floor(Date.now() / 1000) - 60
  }));

  const dataToSign = enc.encode(`${encodedHeader}.${encodedPayload}`);
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
  
  const encodedSignature = b64Arr(new Uint8Array(signature));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function b64(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64Arr(arr) {
  let bin = "";
  for (let i = 0; i < arr.byteLength; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}