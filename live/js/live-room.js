// LIVE ROOM - Academia Addison con LiveKit real
import { Room, RoomEvent, Track } from 'https://cdn.jsdelivr.net/npm/livekit-client/dist/livekit-client.esm.js';

const firebaseConfig = {
  apiKey: "AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ",
  authDomain: "academia-adison.firebaseapp.com",
  projectId: "academia-adison",
  storageBucket: "academia-adison.firebasestorage.app",
  messagingSenderId: "92334581820",
  appId: "1:92334581820:web:5e456f7c475119db95fb39"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const TEACHER_EMAILS = ['eduardofloreshu@gmail.com','profesor@addison.edu.pe'];
const TOKEN_URL = 'https://academia.addisoncusco.workers.dev/token';

const params = new URLSearchParams(location.search);
const courseId = params.get('course') || 'clases-vivo';

const liveCourseName = document.getElementById('liveCourseName');
const liveStatus = document.getElementById('liveStatus');
const btnExit = document.getElementById('btnExit');
const btnEndLive = document.getElementById('btnEndLive');
const videoGrid = document.getElementById('videoGrid');
const localVideo = document.getElementById('localVideo');

let isTeacher = false;
let room = null;
let localParticipant = null;

auth.onAuthStateChanged(async user=>{
  if(!user){ location.href='../index.html'; return; }
  const email = user.email.toLowerCase();
  isTeacher = TEACHER_EMAILS.includes(email);
  liveCourseName.textContent = `Curso: ${courseId}`;
  liveStatus.textContent = isTeacher? 'Conectando como profesor...' : 'Conectando como alumno...';

  if(isTeacher){
    btnEndLive.style.display = 'block';
    btnEndLive.onclick = async ()=>{
      if(confirm('¿Finalizar clase para todos?')){
        await db.collection('live_sessions').doc(courseId).update({ active:false, endedAt: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
        if(room) await room.disconnect();
        location.href = '../index.html';
      }
    };
  }

  initWhiteboard();
  initControls();
  await connectLiveKit(user);
});

btnExit.onclick = async ()=>{
  if(room) await room.disconnect();
  location.href = '../index.html';
};

async function connectLiveKit(user){
  try{
    const identity = user.email || user.uid;
    const name = user.displayName || identity.split('@')[0];
    const res = await fetch(`${TOKEN_URL}?room=${encodeURIComponent(courseId)}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(name)}`);
    const { token, url } = await res.json();

    room = new Room({ adaptiveStream: true, dynacast: true });

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant)=>{
      if(track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio){
        const el = track.attach();
        el.autoplay = true;
        el.playsInline = true;
        const tile = document.createElement('div');
        tile.className = 'video-tile';
        tile.appendChild(el);
        const label = document.createElement('div');
        label.className = 'tile-label';
        label.textContent = participant.identity;
        tile.appendChild(label);
        videoGrid.appendChild(tile);
      }
    });

    room.on(RoomEvent.TrackUnsubscribed, (track)=>{
      track.detach().forEach(el=> el.parentElement?.remove());
    });

    room.on(RoomEvent.Disconnected, ()=>{
      liveStatus.textContent = 'Desconectado';
    });

    await room.connect(url, token);
    localParticipant = room.localParticipant;
    liveStatus.textContent = isTeacher? 'En vivo como profesor' : 'En vivo';

    await localParticipant.setCameraEnabled(true);
    await localParticipant.setMicrophoneEnabled(true);

    const camPub = [...localParticipant.videoTrackPublications.values()][0];
    if(camPub && camPub.track){
      camPub.track.attach(localVideo);
    }
  }catch(err){
    console.error(err);
    liveStatus.textContent = 'Error al conectar';
    alert('No se pudo conectar a la clase en vivo. Verifica que el túnel Cloudflare esté activo.');
  }
}

function initControls(){
  const btnMic = document.getElementById('btnMic');
  const btnCam = document.getElementById('btnCam');
  const btnScreen = document.getElementById('btnScreen');
  const btnBoard = document.getElementById('btnBoard');

  btnMic.onclick = async ()=>{
    if(!localParticipant) return;
    const enabled =!localParticipant.isMicrophoneEnabled;
    await localParticipant.setMicrophoneEnabled(enabled);
    btnMic.classList.toggle('active', enabled);
  };
  btnCam.onclick = async ()=>{
    if(!localParticipant) return;
    const enabled =!localParticipant.isCameraEnabled;
    await localParticipant.setCameraEnabled(enabled);
    btnCam.classList.toggle('active', enabled);
  };
  btnScreen.onclick = async ()=>{
    if(!localParticipant) return;
    const isSharing = localParticipant.isScreenShareEnabled;
    await localParticipant.setScreenShareEnabled(!isSharing);
    btnScreen.classList.toggle('active',!isSharing);
  };
  btnBoard.onclick = ()=>{
    document.querySelector('.whiteboard-area').classList.toggle('hidden');
    btnBoard.classList.toggle('active');
  };
}

function initWhiteboard(){
  const canvas = document.getElementById('whiteboard');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let drawing=false, tool='pen', color='#FFEB3B', lastX=0, lastY=0;
  canvas.addEventListener('pointerdown', e=>{
    drawing=true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e=>{
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = tool==='eraser'? '#0a0a0a' : color;
    ctx.lineWidth = tool==='eraser'? 30 : 3;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke();
    [lastX,lastY]=[x,y];
  });
  window.addEventListener('pointerup', ()=> drawing=false);

  document.querySelectorAll('.wb-colors button').forEach(b=>{
    b.onclick=()=>{
      document.querySelector('.wb-colors button.active')?.classList.remove('active');
      b.classList.add('active');
      color=b.dataset.color;
    };
  });
  document.querySelectorAll('.wb-tools button').forEach(b=>{
    b.onclick=()=>{
      document.querySelector('.wb-tools button.active')?.classList.remove('active');
      b.classList.add('active');
      tool=b.dataset.tool;
      if(tool==='clear'){
        ctx.fillStyle='#0a0a0a';
        ctx.fillRect(0,0,canvas.width,canvas.height);
      }
    };
  });
}