// pega todo esto, reemplaza lo que haya
export async function onRequest(context) {
  const { request, env } = context;
  const cors = {'Access-Control-Allow-Origin':'*'};
  if(request.method==='OPTIONS') return new Response(null,{headers:cors});
  
  const url = new URL(request.url);
  const room = url.searchParams.get('room');
  const identity = url.searchParams.get('identity');
  const name = url.searchParams.get('name')||identity;
  
  const token = await new SignJWT({
    iss: env.LIVEKIT_API_KEY,
    sub: identity,
    name,
    video:{room,roomJoin:true,canPublish:true,canSubscribe:true}
  }).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('1h')
    .sign(new TextEncoder().encode(env.LIVEKIT_API_SECRET));
  
  return new Response(JSON.stringify({token, url: env.LIVEKIT_URL}), {headers:{...cors,'Content-Type':'application/json'}});
}