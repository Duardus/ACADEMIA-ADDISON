// live/js/live-room.js - TODO EN UNO (LiveKit + Controles + Pizarra)
import { Room, RoomEvent } from 'https://cdn.jsdelivr.net/npm/livekit-client@2.5.7/+esm';

const LIVEKIT_URL = "wss://academia-addison.duckdns.org";
const TOKEN_URL = '/api/token'; // ← coincide con functions/api/token.js

const firebaseConfig = { apiKey:"AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ", authDomain:"academia-adison.firebaseapp.com", projectId:"academia-adison", storageBucket:"academia-adison.firebasestorage.app", messagingSenderId:"92334581820", appId:"1:92334581820:web:5e456f7c475119db95fb39" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const TEACHER_EMAILS = ['eduardofloreshu@gmail.com','profesor@addison.edu.pe'];
const params = new URLSearchParams(location.search);
const courseId = params.get('course') || 'clases-vivo';

const liveCourseName = document.getElementById('liveCourseName');
const liveStatus = document.getElementById('liveStatus');
const videoGrid = document.getElementById('videoGrid');
const localVideo = document.getElementById('localVideo');

let room = null;
let isTeacher = false;

auth.onAuthStateChanged(async user=>{
  if(!user){ location.href='../index.html'; return; }
  isTeacher = TEACHER_EMAILS.includes(user.email.toLowerCase());
  liveCourseName.textContent = `Curso: ${courseId}`;
  liveStatus.textContent = 'Conectando...';
  initWhiteboard(); setupControls(); await connectLiveKit(user);
});

async function connectLiveKit(user){
  try{
    const res = await fetch(`${TOKEN_URL}?room=${encodeURIComponent(courseId)}&identity=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName||user.email)}`);
    const data = await res.json(); // ← ASEGURA JSON
    const token = data.token;

    if(!token) throw new Error('Token vacío');

    room = new Room({ adaptiveStream:true, dynacast:true });

    room.on(RoomEvent.TrackSubscribed, (track, pub, participant)=>{
      const el = track.attach(); el.autoplay=true; el.playsInline=true;
      const tile = document.createElement('div'); tile.className='video-tile'; tile.id=`tile-${pub.trackSid}`;
      const wrapper = document.createElement('div'); wrapper.style.width="100%"; wrapper.style.height="100%";
      wrapper.appendChild(el);
      tile.appendChild(wrapper);
      const label = document.createElement('div'); label.className='tile-label'; label.textContent = participant.identity;
      tile.appendChild(label);
      videoGrid.appendChild(tile);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track, pub)=>{ document.getElementById(`tile-${pub.trackSid}`)?.remove(); });

    await room.connect(LIVEKIT_URL, token);
    liveStatus.textContent = isTeacher? 'En vivo (Profesor)' : 'En vivo';
  }catch(err){
    console.error(err);
    liveStatus.textContent = 'Error al conectar';
  }
}

function setupControls(){
  document.getElementById('btnExit').onclick = async ()=>{ await room?.disconnect(); location.href='../index.html'; };
  document.getElementById('btnEndLive')?.addEventListener('click', async ()=>{ if(confirm('¿Finalizar?')){ await room?.disconnect(); location.href='../index.html'; } });

  const btnMic = document.getElementById('btnMic');
  const btnCam = document.getElementById('btnCam');
  const btnScreen = document.getElementById('btnScreen');
  const btnBoard = document.getElementById('btnBoard');

  btnMic.onclick = async ()=>{ const en=!room.localParticipant.isMicrophoneEnabled; await room.localParticipant.setMicrophoneEnabled(en); btnMic.classList.toggle('active', en); };
  btnCam.onclick = async ()=>{ const en=!room.localParticipant.isCameraEnabled; await room.localParticipant.setCameraEnabled(en); if(en){ const pub=[...room.localParticipant.videoTrackPublications.values()][0]; pub?.track?.attach(localVideo); } btnCam.classList.toggle('active', en); };
  btnScreen.onclick = async ()=>{ await room.localParticipant.setScreenShareEnabled(!room.localParticipant.isScreenShareEnabled); btnScreen.classList.toggle('active'); };
  btnBoard.onclick = ()=>{ document.querySelector('.whiteboard-area').classList.toggle('hidden'); btnBoard.classList.toggle('active'); };
}

function initWhiteboard(){
  const canvas = document.getElementById('whiteboard');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let drawing=false, tool='pen', color='#FFEB3B', last=null;

  function resize(){
    const r = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio||1;
    canvas.width = r.width*dpr; canvas.height = r.height*dpr;
    ctx.scale(dpr,dpr); ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,0,r.width,r.height);
  }
  resize(); window.addEventListener('resize', resize);

  document.querySelectorAll('.wb-colors button').forEach(b=>{
    b.onclick = ()=>{ document.querySelector('.wb-colors button.active')?.classList.remove('active'); b.classList.add('active'); color=b.dataset.color; };
  });
  document.querySelectorAll('.wb-tools button').forEach(b=>{
    b.onclick = ()=>{
      if(b.dataset.tool==='clear'){ const r=canvas.getBoundingClientRect(); ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,0,r.width,r.height); return; }
      document.querySelector('.wb-tools button.active')?.classList.remove('active'); b.classList.add('active'); tool=b.dataset.tool;
    };
  });

  canvas.addEventListener('pointerdown', e=>{
    drawing=true; canvas.setPointerCapture(e.pointerId);
    const r=canvas.getBoundingClientRect();
    last={x:e.clientX-r.left, y:e.clientY-r.top, p:e.pressure||0.5};
  });
  canvas.addEventListener('pointermove', e=>{
    if(!drawing) return;
    const r=canvas.getBoundingClientRect();
    const x=e.clientX-r.left, y=e.clientY-r.top, p=e.pressure||0.5;
    ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(x,y);
    if(tool==='eraser'){ ctx.globalCompositeOperation='destination-out'; ctx.lineWidth=30; }
    else { ctx.globalCompositeOperation='source-over'; ctx.strokeStyle=color; ctx.lineWidth=3 + p*5; }
    ctx.stroke();
    last={x,y,p};
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>canvas.addEventListener(ev, ()=>drawing=false));
}