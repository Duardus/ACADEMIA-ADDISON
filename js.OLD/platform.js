// ============================================
// ACADEMIA ADDISON - PLATFORM.JS v3.0
// Conectado a Backend API Addison v3.0
// ============================================

const ALLOW_GROUP_CHANGE = true;

const firebaseConfig = {
  apiKey: "AIzaSyBbp3kZtxiluZTI7xC_UDcUUyYF9Jb0yBQ",
  authDomain: "academia-adison.firebaseapp.com",
  projectId: "academia-adison",
  storageBucket: "academia-adison.firebasestorage.app",
  messagingSenderId: "92334581820",
  appId: "1:92334581820:web:5e456f7c475119db95fb39",
  measurementId: "G-YR4YL6B5WY"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let DATA = null;
let apiBackend = null;

// ============================================
// CARGA DE DATOS DESDE BACKEND
// ============================================

async function loadData() {
  const token = localStorage.getItem('token_addison');
  if (token) {
    try {
      const respuesta = await fetch(`${API_CONFIG.BASE_URL}/arbol`, {
        headers: API_CONFIG.getHeaders()
      });
      if (respuesta.ok) {
        const datos = await respuesta.json();
        if (datos.arbol) {
          DATA = convertirArbolBackend(datos.arbol);
          console.log('[PLATFORM] Arbol cargado desde backend:', DATA.courses.length, 'cursos');
          return;
        }
      }
    } catch (e) {
      console.log('[PLATFORM] Backend no disponible, usando local');
    }
  }
  
  // Fallback JSON local
  const res = await fetch('data/courses.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar courses.json: ' + res.status);
  DATA = await res.json();
  console.log('[PLATFORM] courses.json cargado local', DATA.courses.length, 'cursos');
}

function convertirArbolBackend(arbolBackend) {
  const groups = {};
  const courses = [];
  
  arbolBackend.forEach((grupo, gIndex) => {
    const groupKey = 'G' + grupo.grupo_id;
    groups[groupKey] = { name: grupo.nombre_grupo };
    
    grupo.cursos.forEach((curso, cIndex) => {
      const courseId = 'c' + gIndex + '_' + cIndex;
      const topics = [];
      
      curso.temas.forEach((tema, tIndex) => {
        const subtemas = tema.subtemas.map((sub, sIndex) => ({
          id: 's' + tIndex + '_' + sIndex,
          name: sub.nombre_subtema,
          theoryUrl: '',
          examUrl: ''
        }));
        
        topics.push({
          id: 't' + tIndex,
          name: tema.nombre_tema,
          subtopics: subtemas
        });
      });
      
      courses.push({
        id: courseId,
        name: curso.nombre_curso,
        desc: '',
        groups: [groupKey],
        topics: topics
      });
    });
  });
  
  return { groups, courses };
}

// ============================================
// VARIABLES Y ESTADO
// ============================================

const LS_USERS = 'addison_users';
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(LS_USERS) || '{}') } catch { return {} } };
const saveUsers = u => localStorage.setItem(LS_USERS, JSON.stringify(u));

let state = { user: null, activeCourseId: null, isTeacher: false, liveSessions: {}, rolBackend: null, nombreInstitucion: '' };

const progKey = (c, t, s, type) => `${c}|${t}|${s || ''}|${type}`;
const getProgress = (c, t, s, type) => state.user?.progress?.[progKey(c, t, s, type)];
const setProgress = (c, t, s, type, val) => {
  if (!state.user) return;
  state.user.progress = state.user.progress || {};
  state.user.progress[progKey(c, t, s, type)] = val;
  persistUser();
  renderTopics();
  renderCourses();
};

function persistUser() {
  const users = loadUsers();
  users[state.user.email] = state.user;
  saveUsers(users);
}

// ============================================
// ELEMENTOS DOM
// ============================================

const welcomeEl = document.getElementById('welcome');
const appEl = document.getElementById('app');
const inpGroup = document.getElementById('inpGroup');
const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const appBody = document.getElementById('appBody');
const sidebarEl = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');
const courseListEl = document.getElementById('courseList');
const sidebarGroupEl = document.getElementById('sidebarGroup');
const sidebarOverallEl = document.getElementById('sidebarOverall');
const topicsGridEl = document.getElementById('topicsGrid');
const userNameTop = document.getElementById('userNameTop');
const modalAccount = document.getElementById('modalAccount');
const btnAccount = document.getElementById('btnAccount');
const accName = document.getElementById('accName');
const accEmail = document.getElementById('accEmail');
const accGroup = document.getElementById('accGroup');
const accGroupHint = document.getElementById('accGroupHint');
const btnSaveAccount = document.getElementById('btnSaveAccount');
const btnLogout = document.getElementById('btnLogout');
const btnCloseAccount = document.getElementById('btnCloseAccount');
const modalIframe = document.getElementById('modalIframe');
const iframeTitle = document.getElementById('iframeTitle');
const iframeContent = document.getElementById('iframeContent');
const btnCloseIframe = document.getElementById('btnCloseIframe');
const liveBarEl = document.getElementById('liveBar');
const liveCardContainer = document.getElementById('liveCardContainer');

console.log('[PLATFORM] liveBarEl:', !!liveBarEl, 'liveCardContainer:', !!liveCardContainer);

function populateGroupSelect(selectEl, selectedKey) {
  selectEl.innerHTML = '';
  Object.keys(DATA.groups).forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = groupLabel(key);
    if (key === selectedKey) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// ============================================
// LOGIN CON GOOGLE + BACKEND
// ============================================

btnGoogleLogin?.addEventListener('click', async () => {
  try { await auth.signInWithPopup(googleProvider); } catch (e) { alert('Error al iniciar sesion: ' + e.message); }
});

auth.onAuthStateChanged(async user => {
  if (user) {
    if (!DATA) await loadData();
    const email = user.email.toLowerCase();
    
    // === CONEXION CON BACKEND ===
    try {
      const tokenFirebase = await user.getIdToken(true);
      const resultado = await api.login(tokenFirebase);
      
      if (resultado.tipo === 'login_directo') {
        localStorage.setItem('token_addison', resultado.token);
        localStorage.setItem('institucion_addison', JSON.stringify(resultado.institucion));
        localStorage.setItem('usuario_addison', JSON.stringify(resultado.usuario));
        
        state.rolBackend = resultado.institucion.tipo_rol;
        state.nombreInstitucion = resultado.institucion.nombre_institucion;
        state.isTeacher = ['superadmin', 'director', 'professor'].includes(resultado.institucion.tipo_rol);
        
        const users = loadUsers();
        let profile = users[email];
        if (!profile) {
          const selectedGroup = inpGroup.value || Object.keys(DATA.groups)[0];
          profile = { name: user.displayName || email.split('@')[0], email, group: selectedGroup, progress: {} };
          users[email] = profile; saveUsers(users);
        }
        state.user = profile;
        
        console.log('[PLATFORM] Backend login:', resultado.institucion.nombre_institucion, 'Rol:', resultado.institucion.tipo_rol);
        enterApp();
        mostrarBadgeRol(resultado.institucion.tipo_rol, resultado.institucion.nombre_institucion);
      }
      else if (resultado.tipo === 'selector_requerido') {
        localStorage.setItem('token_preliminar', resultado.token_preliminar);
        mostrarSelectorInstituciones(resultado.membresias);
      }
      else {
        console.error('[PLATFORM] Backend error:', resultado.error);
        loginLegacy(user);
      }
    } catch (error) {
      console.error('[PLATFORM] Error backend, usando legacy:', error);
      loginLegacy(user);
    }
  } else {
    state.user = null;
    appEl.classList.add('hidden');
    welcomeEl.classList.remove('hidden');
  }
});

function loginLegacy(user) {
  const email = user.email.toLowerCase();
  const users = loadUsers();
  let profile = users[email];
  if (!profile) {
    const selectedGroup = inpGroup.value || Object.keys(DATA.groups)[0];
    profile = { name: user.displayName || email.split('@')[0], email, group: selectedGroup, progress: {} };
    users[email] = profile; saveUsers(users);
  }
  state.user = profile;
  enterApp();
}

// ============================================
// SELECTOR DE INSTITUCIONES
// ============================================

function mostrarSelectorInstituciones(membresias) {
  const modal = document.createElement('div');
  modal.id = 'modalSelectorInstitucion';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:99999;display:flex;align-items:center;justify-content:center;';
  
  const card = document.createElement('div');
  card.style.cssText = 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:40px;border-radius:20px;max-width:450px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.1);';
  
  card.innerHTML = '<h2 style="margin-bottom:8px;color:#fff;font-size:24px;">Selecciona tu Institucion</h2><p style="color:#888;margin-bottom:24px;">Tienes acceso a multiples academias</p>';
  
  const activas = membresias.filter(m => m.estado_membresia === 'active');
  
  activas.forEach(m => {
    const btn = document.createElement('button');
    btn.style.cssText = 'display:block;width:100%;padding:18px;margin:10px 0;border:2px solid rgba(255,255,255,0.2);border-radius:12px;background:rgba(255,255,255,0.05);color:#fff;font-size:16px;cursor:pointer;transition:all 0.3s;text-align:left;';
    btn.innerHTML = `<strong style="font-size:18px;display:block;margin-bottom:4px;">${m.nombre_institucion}</strong><span style="font-size:13px;color:#aaa;text-transform:uppercase;">${m.tipo_rol}</span>`;
    btn.onmouseenter = () => { btn.style.background = 'rgba(25,118,210,0.3)'; btn.style.borderColor = '#1976d2'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.05)'; btn.style.borderColor = 'rgba(255,255,255,0.2)'; };
    btn.onclick = async () => {
      btn.style.opacity = '0.5';
      btn.innerHTML = '<span style="color:#aaa;">Entrando...</span>';
      const resultado = await api.seleccionarContexto(localStorage.getItem('token_preliminar'), m.membresia_id);
      if (resultado.token) {
        localStorage.setItem('token_addison', resultado.token);
        localStorage.setItem('institucion_addison', JSON.stringify(resultado.institucion));
        window.location.reload();
      }
    };
    card.appendChild(btn);
  });
  
  modal.appendChild(card);
  document.body.appendChild(modal);
}

// ============================================
// BADGE DE ROL
// ============================================

function mostrarBadgeRol(rol, institucion) {
  const header = document.getElementById('userNameTop');
  if (!header) return;
  
  const colores = { superadmin: '#d32f2f', director: '#1976d2', professor: '#388e3c', auxiliary: '#f57c00', student: '#7b1fa2' };
  const nombres = { superadmin: 'Superadmin', director: 'Director', professor: 'Profesor', auxiliary: 'Auxiliar', student: 'Alumno' };
  
  header.querySelectorAll('.rol-badge, .inst-badge').forEach(el => el.remove());
  
  const badge = document.createElement('span');
  badge.className = 'rol-badge';
  badge.style.cssText = `display:inline-block;margin-left:8px;padding:2px 8px;border-radius:4px;background:${colores[rol] || '#666'};color:#fff;font-size:11px;font-weight:bold;text-transform:uppercase;`;
  badge.textContent = nombres[rol] || rol;
  
  const inst = document.createElement('span');
  inst.className = 'inst-badge';
  inst.style.cssText = 'display:block;font-size:12px;color:#888;margin-top:2px;';
  inst.textContent = institucion;
  
  header.parentNode.appendChild(inst);
  header.appendChild(badge);
}

// ============================================
// ENTRAR A LA APP
// ============================================

function enterApp() {
  welcomeEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  userNameTop.textContent = state.user.name.split(' ')[0];
  renderCourses();
  const courses = getCoursesForGroup(state.user.group);
  const lastCourse = sessionStorage.getItem('addison_last_course');
  if (lastCourse && courses.some(c => c.id === lastCourse)) { state.activeCourseId = lastCourse; }
  else { const first = courses[0]; if (first) { state.activeCourseId = first.id; } }
  renderTopics();
  initLive();
}

// ============================================
// FUNCIONES ORIGINALES (sin cambios visuales)
// ============================================

function isMobile() { return window.innerWidth <= 960 }
function toggleSidebar() {
  if (isMobile()) {
    const open = !sidebarEl.classList.contains('open');
    sidebarEl.classList.toggle('open', open);
    sidebarBackdrop.classList.toggle('show', open);
  } else {
    appBody.classList.toggle('collapsed');
  }
}
btnToggleSidebar.onclick = toggleSidebar;
sidebarBackdrop.onclick = () => { sidebarEl.classList.remove('open'); sidebarBackdrop.classList.remove('show') };
function getCoursesForGroup(g) { return DATA.courses.filter(c => c.groups.includes(g)) }

function topicProgress(course, topic) {
  const hasSubs = topic.subtopics && topic.subtopics.length > 0;
  if (hasSubs) {
    let sum = 0, count = 0;
    topic.subtopics.forEach(s => {
      const ex = getProgress(course.id, topic.id, s.id, 'exam');
      if (typeof ex === 'number') { sum += ex; count++; }
      else if (ex) { sum += 100; count++; }
      else { sum += 0; count++; }
    });
    return count ? Math.round(sum / count) : 0;
  } else {
    const ex = getProgress(course.id, topic.id, '', 'exam');
    if (typeof ex === 'number') return ex;
    if (ex) return 100;
    return 0;
  }
}

function courseProgress(course) {
  if (!course.topics || course.topics.length === 0) return 0;
  let sum = 0; course.topics.forEach(t => sum += topicProgress(course, t)); return Math.round(sum / course.topics.length);
}

function renderCourses() {
  if (!courseListEl) return;
  courseListEl.innerHTML = '';
  const courses = getCoursesForGroup(state.user.group);
  sidebarGroupEl.textContent = groupLabel(state.user.group);
  const overall = courses.length ? Math.round(courses.reduce((a, c) => a + courseProgress(c), 0) / courses.length) : 0;
  sidebarOverallEl.innerHTML = `<svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-soft)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand)" stroke-width="3" stroke-dasharray="${overall},100"/></svg><div class="pct">${overall}%</div>`;
  courses.forEach(course => {
    const pct = courseProgress(course);
    const isActive = course.id === state.activeCourseId;
    const isLive = !!state.liveSessions?.[course.id]?.active;
    const item = document.createElement('div');
    item.className = 'course-item' + (isActive ? ' active' : '');
    item.innerHTML = `<div class="course-info"><strong>${course.name}</strong><small>${course.desc || ''}</small></div><div class="course-progress"><svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-soft)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand)" stroke-width="3" stroke-dasharray="${pct},100"/></svg><div class="pct">${pct}%</div></div>${isLive ? '<div class="course-live-badge" title="En vivo"></div>' : ''}`;
    item.onclick = () => { state.activeCourseId = course.id; renderCourses(); renderTopics(); };
    courseListEl.appendChild(item);
  });
}

function renderTopics() {
  if (!topicsGridEl) return;
  topicsGridEl.innerHTML = '';
  const course = DATA.courses.find(c => c.id === state.activeCourseId);
  if (!course) return;
  if (liveCardContainer) topicsGridEl.appendChild(liveCardContainer);
  course.topics.forEach(topic => {
    const pct = topicProgress(course, topic);
    const card = document.createElement('div');
    card.className = 'topic-card';
    const head = document.createElement('div');
    head.className = 'topic-head';
    head.innerHTML = `<strong>${topic.name}</strong><span class="badge">${pct}%</span>`;
    const prog = document.createElement('div');
    prog.className = 'progress'; prog.innerHTML = `<span style="width:${pct}%"></span>`;
    card.appendChild(head); card.appendChild(prog);
    if (topic.subtopics && topic.subtopics.length > 0) {
      topic.subtopics.forEach(sub => {
        const subEl = document.createElement('div');
        subEl.className = 'subtopic';
        const ex = getProgress(course.id, topic.id, sub.id, 'exam');
        const exTxt = typeof ex === 'number' ? `${ex}%` : ex ? 'Completado' : 'Pendiente';
        subEl.innerHTML = `<strong>${sub.name}</strong><div class="sub-meta">Examen: ${exTxt}</div><div class="sub-actions"><button>Teoria</button><button class="primary">Examen</button></div>`;
        const [btnT, btnE] = subEl.querySelectorAll('button');
        btnT.onclick = () => openContent('Teoria', sub.theoryUrl, course.id, topic.id, sub.id, 'theory');
        btnE.onclick = () => openContent('Examen', sub.examUrl, course.id, topic.id, sub.id, 'exam');
        card.appendChild(subEl);
      });
    } else {
      const meta = document.createElement('div');
      meta.className = 'sub-meta'; meta.textContent = 'Tema sin subtemas';
      const actions = document.createElement('div');
      actions.className = 'sub-actions';
      actions.innerHTML = `<button>Teoria</button><button class="primary">Examen</button>`;
      actions.children[0].onclick = () => openContent('Teoria', topic.theoryUrl, course.id, topic.id, '', 'theory');
      actions.children[1].onclick = () => openContent('Examen', topic.examUrl, course.id, topic.id, '', 'exam');
      card.appendChild(meta); card.appendChild(actions);
    }
    topicsGridEl.appendChild(card);
  });
}

function openContent(title, url, courseId, topicId, subId, type) {
  let targetUrl = ''; let examKey = ''; let theoryKey = '';
  if (type === 'exam') { targetUrl = 'examen/index.html'; if (url && url.trim() !== '') { try { const clean = url.split('?')[0].split('#')[0]; const file = clean.split('/').pop() || ''; examKey = file.replace(/\.html?$/i, ''); } catch (e) { } } }
  else if (type === 'theory') { targetUrl = 'teoria/index.html'; if (url && url.trim() !== '') { try { const clean = url.split('?')[0].split('#')[0]; const file = clean.split('/').pop() || ''; theoryKey = file.replace(/\.html?$/i, ''); } catch (e) { } } }
  else { targetUrl = url && url.trim() !== '' ? url : (type === 'theory' ? 'teoria_final.html' : ''); }
  if (targetUrl) {
    const fullUrl = targetUrl.startsWith('http') ? targetUrl : targetUrl;
    const urlSinCache = fullUrl + (fullUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    const sep = urlSinCache.includes('?') ? '&' : '?';
    let urlWithIds = urlSinCache + sep + 'courseId=' + encodeURIComponent(courseId) + '&topicId=' + encodeURIComponent(topicId) + '&subId=' + encodeURIComponent(subId || '');
    if (type === 'exam' && examKey) urlWithIds += '&examKey=' + encodeURIComponent(examKey);
    if (type === 'theory' && theoryKey) urlWithIds += '&theoryKey=' + encodeURIComponent(theoryKey);
    try { const studentName = state.user?.name || ''; if (studentName) { urlWithIds += '&name=' + encodeURIComponent(studentName); } } catch (e) { }
    try { sessionStorage.setItem('addison_last_course', courseId); } catch (e) { }
    window.location.href = urlWithIds; return;
  } else { const val = type === 'exam' ? Math.floor(Math.random() * 41) + 60 : true; setProgress(courseId, topicId, subId, type, val); }
}

btnCloseIframe.onclick = () => { modalIframe.classList.add('hidden'); if (iframeContent) { iframeContent.src = 'about:blank'; } };
window.addEventListener('message', e => { const d = e.data || {}; if (d.type === 'progress') { setProgress(d.courseId, d.topicId, d.subId, d.contentType, d.value ?? true); } });

btnAccount.onclick = () => { accName.value = state.user.name; accEmail.value = state.user.email; populateGroupSelect(accGroup, state.user.group); if (ALLOW_GROUP_CHANGE) { accGroup.disabled = false; accGroupHint.textContent = 'Puedes cambiar de grupo.'; } else { accGroup.disabled = true; accGroupHint.textContent = 'Cambio deshabilitado.'; } modalAccount.classList.remove('hidden'); };
btnCloseAccount.onclick = () => modalAccount.classList.add('hidden');
btnSaveAccount.onclick = () => { state.user.name = accName.value.trim() || state.user.name; if (ALLOW_GROUP_CHANGE && accGroup.value !== state.user.group) { state.user.group = accGroup.value; const first = getCoursesForGroup(state.user.group)[0]; state.activeCourseId = first ? first.id : null; } persistUser(); userNameTop.textContent = state.user.name.split(' ')[0]; modalAccount.classList.add('hidden'); renderCourses(); renderTopics(); };
btnLogout.onclick = () => { auth.signOut(); };

// ============================================
// SISTEMA DE CLASES EN VIVO (Firestore)
// ============================================

function initLive() {
  if (!state.user) return;
  console.log('[LIVE] Iniciando listener de live_sessions');
  db.collection('live_sessions').where('active', '==', true).onSnapshot(snapshot => {
    const activeSessions = {};
    snapshot.forEach(doc => { activeSessions[doc.id] = doc.data(); });
    state.liveSessions = activeSessions;
    console.log('[LIVE] Sesiones activas:', Object.keys(activeSessions));
    renderLiveBar(); renderLiveCard(); renderCourses();
  }, err => {
    console.error('[LIVE] Error listener:', err);
  });
}

function renderLiveBar() {
  if (!liveBarEl) return;
  if (!state.isTeacher) { liveBarEl.classList.add('hidden'); return; }
  const course = DATA.courses.find(c => c.id === state.activeCourseId);
  if (!course) { liveBarEl.classList.add('hidden'); return; }
  const session = state.liveSessions?.[course.id];
  liveBarEl.classList.remove('hidden');
  if (session && session.active) {
    liveBarEl.innerHTML = `
      <div class="live-bar-left">
        <div class="live-dot"></div>
        <div>
          <div class="live-bar-title">Clase en vivo activa</div>
          <div class="live-bar-sub">${course.name} • ${session.participants || 0} alumnos conectados</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="live-bar-btn" onclick="joinLiveClass('${course.id}')">Entrar a la sala</button>
        <button class="live-bar-btn" style="background:#fff;color:#d32f2f" onclick="endLiveClass('${course.id}')">Finalizar</button>
      </div>`;
  } else {
    liveBarEl.innerHTML = `
      <div class="live-bar-left">
        <div class="live-dot" style="background:rgba(255,255,255,.5);animation:none"></div>
        <div>
          <div class="live-bar-title">Iniciar clase en vivo</div>
          <div class="live-bar-sub">${course.name} • Los alumnos veran la invitacion al instante</div>
        </div>
      <button class="live-bar-btn" onclick="startLiveClass('${course.id}')">Iniciar ahora</button>`;
  }
}

function renderLiveCard() {
  if (!liveCardContainer) return;
  if (state.isTeacher) { liveCardContainer.innerHTML = ''; return; }
  const course = DATA.courses.find(c => c.id === state.activeCourseId);
  if (!course) { liveCardContainer.innerHTML = ''; return; }
  const session = state.liveSessions?.[course.id];
  if (session && session.active) {
    liveCardContainer.innerHTML = `<div class="live-card"><div class="live-card-head"><div class="live-dot"></div><div class="live-card-title">¡Clase en vivo ahora!</div></div><div class="live-card-msg">Tu profesor ${session.teacherName || ''} esta en linea. Unete ahora y no te pierdas la explicacion en vivo. 🚀</div><button class="live-card-btn" onclick="joinLiveClass('${course.id}')">Entrar a clase en vivo</button></div>`;
  } else { liveCardContainer.innerHTML = ''; }
}

async function startLiveClass(courseId) {
  try {
    await db.collection('live_sessions').doc(courseId).set({ active: true, courseId, teacherEmail: state.user.email, teacherName: state.user.name, startedAt: firebase.firestore.FieldValue.serverTimestamp(), participants: 0 }, { merge: true });
    window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`;
  } catch (e) { alert('Error al iniciar clase: ' + e.message); }
}

async function endLiveClass(courseId) {
  if (!confirm('¿Finalizar la clase en vivo? Los alumnos seran desconectados.')) return;
  try {
    await db.collection('live_sessions').doc(courseId).update({ active: false, endedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (e) { alert('Error al finalizar: ' + e.message); }
}

function joinLiveClass(courseId) { window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`; }
window.startLiveClass = startLiveClass; window.joinLiveClass = joinLiveClass; window.endLiveClass = endLiveClass;

async function init() { await loadData(); populateGroupSelect(inpGroup, 'A'); }
init();
