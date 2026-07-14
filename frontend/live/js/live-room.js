/**
 * ACADEMIA ADDISON - LIVE ROOM v3.0
 * Motor LiveKit con estándares internacionales
 * 
 * === SECCIONES CRÍTICAS - NO MODIFICAR ===
 * 1. Conexión LiveKit (líneas 25-70)
 * 2. Autenticación Firebase (líneas 20-24)
 * 3. Token handling (líneas 45-55)
 * 
 * === SECCIONES PERSONALIZABLES ===
 * - UI/UX (colores, layouts)
 * - Funciones adicionales (grabación, etc.)
 */

import { Room, RoomEvent, Track, VideoPresets, ConnectionQuality } from 'https://cdn.jsdelivr.net/npm/livekit-client@2.5.7/+esm';

// === CONFIGURACIÓN CORE - NO MODIFICAR ===
const LIVEKIT_URL = "wss://academia-addison.duckdns.org";
const TOKEN_URL = '/api/token';
const TEACHER_EMAILS = ['eduardofloreshu@gmail.com','profesor@addison.edu.pe'];

// Firebase
const firebaseConfig = { apiKey:"AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ", authDomain:"academia-adison.firebaseapp.com", projectId:"academia-adison", storageBucket:"academia-adison.firebasestorage.app", messagingSenderId:"92334581820", appId:"1:92334581820:web:5e456f7c475119db95fb39" };
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Estado global
let room = null;
let isTeacher = false;
let currentRoom = '';
let whiteboardData = [];
let isDrawing = false;

// Elementos DOM
const $ = id => document.getElementById(id);
const elements = {
  liveStatus: $('liveStatus'),
  liveCourseName: $('liveCourseName'),
  participantCount: $('participantCount'),
  participantList: $('participantList'),
  chatMessages: $('chatMessages'),
  chatInput: $('chatInput'),
  mainVideo: $('mainVideo'),
  videoStage: $('videoStage'),
  whiteboardStage: $('whiteboardStage'),
  reactionsLayer: $('reactionsLayer')
};

// === INICIALIZACIÓN ===
auth.onAuthStateChanged(async user => {
  if (!user) { location.href = '../index.html'; return; }
  
  isTeacher = TEACHER_EMAILS.includes(user.email.toLowerCase());
  currentRoom = new URLSearchParams(location.search).get('course') || 'clases-vivo';
  
  elements.liveCourseName.textContent = currentRoom;
  elements.liveStatus.innerHTML = '<span class="live-dot"></span>Conectando...';
  
  setupUI();
  await connectToRoom(user);
});

// === CONEXIÓN LIVEKIT - CORE ===
async function connectToRoom(user) {
  try {
    // 1. Obtener token
    const res = await fetch(`${TOKEN_URL}?room=${encodeURIComponent(currentRoom)}&identity=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.displayName || user.email)}`);
    const { token } = await res.json();
    if (!token) throw new Error('Token inválido');

    // 2. Crear room con configuración óptima internacional
    room = new Room({
      adaptiveStream: true,      // Ajusta calidad según ancho de banda
      dynacast: true,            // Publica solo cuando necesario
      videoCaptureDefaults: {
        resolution: VideoPresets.h720, // 720p estándar internacional
      },
      publishDefaults: {
        simulcast: true,         // Múltiples calidades
        videoSimulcastLayers: [VideoPresets.h180, VideoPresets.h360, VideoPresets.h720],
        dtx: true,               // Discontinuous transmission para audio
        red: true,               // Redundancia para audio
      },
      // Reconnection automática
      reconnectPolicy: {
        nextRetryDelayInMs: (context) => Math.min(1000 * 2 ** context.retryCount, 30000),
      }
    });

    // 3. Event listeners críticos
    setupRoomListeners();
    
    // 4. Conectar
    await room.connect(LIVEKIT_URL, token);
    
    // 5. Configurar medios según rol
    await setupMedia();
    
    // 6. UI lista
    updateConnectionStatus(true);
    enableControls();
    
    // 7. Sincronizar con Firestore (presencia)
    syncPresence(user);
    
  } catch (err) {
    console.error('Error conexión:', err);
    elements.liveStatus.innerHTML = '❌ Error de conexión';
    alert('No se pudo conectar. Verifica tu internet y recarga.');
  }
}

function setupRoomListeners() {
  // Participante se une
  room.on(RoomEvent.ParticipantConnected, (p) => {
    addParticipantToList(p);
    updateParticipantCount();
    showNotification(`${p.identity} se unió`);
  });

  // Participante sale
  room.on(RoomEvent.ParticipantDisconnected, (p) => {
    removeParticipantFromList(p);
    updateParticipantCount();
  });

  // Track suscrito (video/audio)
  room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
    if (track.kind === Track.Kind.Video) {
      attachVideo(track, participant);
    }
    if (track.kind === Track.Kind.Audio) {
      track.attach(); // Audio se reproduce automáticamente
    }
    updateParticipantMedia(participant, pub);
  });

  // Active speaker - estándar internacional
  room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
    document.querySelectorAll('.participant-item').forEach(el => el.classList.remove('speaking'));
    if (speakers.length > 0) {
      const speaker = speakers[0];
      document.querySelector(`[data-identity="${speaker.identity}"]`)?.classList.add('speaking');
      $('speakerName').textContent = speaker.name || speaker.identity;
      $('activeSpeaker').classList.remove('hidden');
    }
  });

  // Calidad de conexión
  room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
    updateConnectionQuality(participant, quality);
  });

  // Datos (chat, reacciones, pizarra)
  room.on(RoomEvent.DataReceived, (payload, participant) => {
    handleDataMessage(payload, participant);
  });

  // Reconexión
  room.on(RoomEvent.Reconnecting, () => {
    elements.liveStatus.innerHTML = '<span class="live-dot"></span>Reconectando...';
  });
  room.on(RoomEvent.Reconnected, () => {
    updateConnectionStatus(true);
  });
}

async function setupMedia() {
  if (isTeacher) {
    // Profesor: cámara y mic encendidos por defecto (estándar educativo)
    await room.localParticipant.setMicrophoneEnabled(true);
    await room.localParticipant.setCameraEnabled(true);
    $('btnMic').classList.add('active');
    $('btnCam').classList.add('active');
    $('btnEndLive').classList.remove('hidden');
    
    // Publicar video local en stage principal
    const camTrack = [...room.localParticipant.videoTrackPublications.values()][0]?.videoTrack;
    if (camTrack) {
      camTrack.attach(elements.mainVideo);
      $('stageLabel').textContent = 'Profesor - Tú';
    }
  } else {
    // Estudiante: inicia silenciado (mejor práctica)
    await room.localParticipant.setMicrophoneEnabled(false);
    await room.localParticipant.setCameraEnabled(false);
  }
  
  addParticipantToList(room.localParticipant);
  updateParticipantCount();
}

// === UI CONTROLS ===
function setupUI() {
  // Mic
  $('btnMic').onclick = async () => {
    const enabled = !room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    $('btnMic').classList.toggle('active', enabled);
    sendData({ type: 'media', mic: enabled });
  };
  
  // Cam
  $('btnCam').onclick = async () => {
    const enabled = !room.localParticipant.isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    $('btnCam').classList.toggle('active', enabled);
    if (enabled && isTeacher) {
      const track = [...room.localParticipant.videoTrackPublications.values()][0]?.videoTrack;
      track?.attach(elements.mainVideo);
    }
  };
  
  // Screen share
  $('btnScreen').onclick = async () => {
    const enabled = !room.localParticipant.isScreenShareEnabled;
    await room.localParticipant.setScreenShareEnabled(enabled);
    $('btnScreen').classList.toggle('active', enabled);
  };
  
  // Whiteboard
  $('btnBoard').onclick = () => {
    const isWhiteboard = elements.whiteboardStage.classList.toggle('hidden');
    elements.videoStage.classList.toggle('hidden', !isWhiteboard);
    $('btnBoard').classList.toggle('active', !isWhiteboard);
  };
  
  // Hand raise
  $('btnHand').onclick = () => {
    const raised = $('btnHand').classList.toggle('active');
    sendData({ type: 'hand', raised });
  };
  
  // Chat
  $('sendChat').onclick = sendChatMessage;
  $('chatInput').onkeypress = (e) => e.key === 'Enter' && sendChatMessage();
  
  // Reacciones
  $('btnReactions').onclick = () => showReaction('👍');
  
  // Salir
  $('btnExit').onclick = async () => {
    await room?.disconnect();
    location.href = '../index.html';
  };
  
  // Panel toggle móvil
  $('btnParticipants').onclick = () => $('sidePanel').classList.toggle('open');
  $('btnChat').onclick = () => $('sidePanel').classList.toggle('open');
  
  initWhiteboard();
}

function enableControls() {
  document.querySelectorAll('.ctrl-btn').forEach(btn => btn.disabled = false);
}

function updateConnectionStatus(connected) {
  elements.liveStatus.innerHTML = connected 
    ? '<span class="live-dot"></span>En vivo' 
    : '<span class="live-dot"></span>Desconectado';
}

function updateParticipantCount() {
  const count = room ? room.remoteParticipants.size + 1 : 0;
  elements.participantCount.textContent = count;
}

// === FUNCIONES AUXILIARES ===
function addParticipantToList(p) {
  const div = document.createElement('div');
  div.className = 'participant-item';
  div.dataset.identity = p.identity;
  div.innerHTML = `
    <div class="avatar">${p.identity[0].toUpperCase()}</div>
    <div class="name">${p.name || p.identity}</div>
    <div class="badges">
      <span class="badge mic">${p.isMicrophoneEnabled ? '🎤' : '🔇'}</span>
      <span class="badge cam">${p.isCameraEnabled ? '📹' : ''}</span>
    </div>
  `;
  div.onclick = () => focusParticipant(p);
  elements.participantList.appendChild(div);
}

function attachVideo(track, participant) {
  // Si es profesor, mostrar en stage principal
  if (participant.identity.includes('profesor') || isTeacher) {
    track.attach(elements.mainVideo);
    $('stageLabel').textContent = participant.name || participant.identity;
  }
}

function sendData(data) {
  if (!room) return;
  const payload = new TextEncoder().encode(JSON.stringify(data));
  room.localParticipant.publishData(payload, { reliable: true });
}

function handleDataMessage(payload, participant) {
  try {
    const data = JSON.parse(new TextDecoder().decode(payload));
    if (data.type === 'chat') addChatMessage(data.text, participant, false);
    if (data.type === 'reaction') showReaction(data.emoji, participant);
    if (data.type === 'hand') updateHandRaise(participant, data.raised);
  } catch {}
}

function sendChatMessage() {
  const text = elements.chatInput.value.trim();
  if (!text || !room) return;
  sendData({ type: 'chat', text });
  addChatMessage(text, room.localParticipant, true);
  elements.chatInput.value = '';
}

function addChatMessage(text, participant, isMe) {
  const div = document.createElement('div');
  div.className = `chat-msg ${isMe ? 'me' : ''}`;
  div.innerHTML = `<div class="author">${participant.name || participant.identity}</div><div>${text}</div>`;
  elements.chatMessages.appendChild(div);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showReaction(emoji) {
  const div = document.createElement('div');
  div.className = 'reaction';
  div.textContent = emoji;
  div.style.left = Math.random() * 80 + 10 + '%';
  elements.reactionsLayer.appendChild(div);
  setTimeout(() => div.remove(), 3000);
  sendData({ type: 'reaction', emoji });
}

function initWhiteboard() {
  const canvas = $('whiteboard');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  
  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  resize();
  window.addEventListener('resize', resize);
  
  // Eventos dibujo
  canvas.addEventListener('pointerdown', e => { drawing = true; });
  canvas.addEventListener('pointerup', () => drawing = false);
  canvas.addEventListener('pointermove', e => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = document.querySelector('.color-dot.active')?.dataset.color || '#FF3B5C';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Colores
  document.querySelectorAll('.color-dot').forEach(btn => {
    btn.onclick = () => {
      document.querySelector('.color-dot.active')?.classList.remove('active');
      btn.classList.add('active');
    };
  });
}

function syncPresence(user) {
  // Guarda presencia en Firestore para analytics
  const ref = db.collection('live_presence').doc(currentRoom);
  setInterval(() => {
    ref.set({
      participants: room?.remoteParticipants.size + 1 || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }, 30000);
}

function showNotification(text) {
  // Notificación sutil
  console.log('🔔', text);
}

function updateParticipantMedia() {}
function removeParticipantFromList() {}
function updateConnectionQuality() {}
function updateHandRaise() {}
function focusParticipant() {}
