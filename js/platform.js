// ACADEMIA ADDISON - PLATFORM.JS CORREGIDO PARA PAGES + WORKERS
const ALLOW_GROUP_CHANGE = true;

// === DOCENTES ===
const TEACHER_EMAILS = [
  'eduardo.floreshu@gmail.com',
  'profesor@addison.edu.pe'
];

// === ALUMNOS AUTORIZADOS ===
const ALLOWED_EMAILS = [
  'nattv9000@gmail.com',
  'eduardo.floreshu@gmail.com',
  'addisoncusco@gmail.com',
];

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

let DATA;
async function loadData(){
  // CORRECCIÓN: ruta relativa sin / inicial para Cloudflare Pages
  const res = await fetch('data/courses.json', { cache: 'no-store' });
  if(!res.ok) throw new Error('No se pudo cargar courses.json: '+res.status);
  DATA = await res.json();
  console.log('[PLATFORM] courses.json cargado', DATA.courses.length, 'cursos');
}

function groupLabel(key){const g=DATA.groups[key];return g?`${key} - ${g.name}`:key;}
const LS_USERS='addison_users';
const loadUsers=()=>{try{return JSON.parse(localStorage.getItem(LS_USERS)||'{}')}catch{return{}}};
const saveUsers=u=>localStorage.setItem(LS_USERS,JSON.stringify(u));
let state={user:null,activeCourseId:null,isTeacher:false,liveSessions:{}};
const progKey=(c,t,s,type)=>`${c}|${t}|${s||''}|${type}`;
const getProgress=(c,t,s,type)=>state.user?.progress?.[progKey(c,t,s,type)];
const setProgress=(c,t,s,type,val)=>{if(!state.user)return;state.user.progress=state.user.progress||{};state.user.progress[progKey(c,t,s,type)]=val;persistUser();renderTopics();renderCourses();};
function persistUser(){const users=loadUsers();users[state.user.email]=state.user;saveUsers(users);}

const welcomeEl=document.getElementById('welcome');const appEl=document.getElementById('app');
const inpGroup=document.getElementById('inpGroup');const btnGoogleLogin=document.getElementById('btnGoogleLogin');
const btnToggleSidebar=document.getElementById('btnToggleSidebar');const appBody=document.getElementById('appBody');const sidebarEl=document.getElementById('sidebar');
const sidebarBackdrop=document.getElementById('sidebarBackdrop');const courseListEl=document.getElementById('courseList');const sidebarGroupEl=document.getElementById('sidebarGroup');const sidebarOverallEl=document.getElementById('sidebarOverall');
const topicsGridEl=document.getElementById('topicsGrid');const userNameTop=document.getElementById('userNameTop');
const modalAccount=document.getElementById('modalAccount');const btnAccount=document.getElementById('btnAccount');
const accName=document.getElementById('accName');const accEmail=document.getElementById('accEmail');const accGroup=document.getElementById('accGroup');
const accGroupHint=document.getElementById('accGroupHint');
const btnSaveAccount=document.getElementById('btnSaveAccount');const btnLogout=document.getElementById('btnLogout');const btnCloseAccount=document.getElementById('btnCloseAccount');
const modalIframe=document.getElementById('modalIframe');const iframeTitle=document.getElementById('iframeTitle');const iframeContent=document.getElementById('iframeContent');const btnCloseIframe=document.getElementById('btnCloseIframe');
const liveBarEl=document.getElementById('liveBar');
const liveCardContainer=document.getElementById('liveCardContainer');

// Debug de elementos live
console.log('[PLATFORM] liveBarEl:',!!liveBarEl, 'liveCardContainer:',!!liveCardContainer);

function populateGroupSelect(selectEl,selectedKey){selectEl.innerHTML='';Object.keys(DATA.groups).forEach(key=>{const opt=document.createElement('option');opt.value=key;opt.textContent=groupLabel(key);if(key===selectedKey)opt.selected=true;selectEl.appendChild(opt);});}

btnGoogleLogin?.addEventListener('click', async ()=>{
  try{ await auth.signInWithPopup(googleProvider); }catch(e){ alert('Error al iniciar sesión: '+e.message); }
});

auth.onAuthStateChanged(async user=>{
  if(user){
    if(!DATA) await loadData();
    const email=user.email.toLowerCase();
    const isTeacher = TEACHER_EMAILS.includes(email);
    const isAllowed = isTeacher || ALLOWED_EMAILS.includes(email);
    if(!isAllowed){
      alert('Tu cuenta no está autorizada para acceder a la plataforma. Contacta al administrador.');
      await auth.signOut(); return;
    }
    const users=loadUsers();
    let profile=users[email];
    let isNewUser = false;
    if(!profile){
      const selectedGroup=inpGroup.value || Object.keys(DATA.groups)[0];
      profile={name:user.displayName||email.split('@')[0], email, group:selectedGroup, progress:{}};
      users[email]=profile; saveUsers(users); isNewUser = true;
    }
    state.user=profile;
    state.isTeacher = isTeacher;
    console.log('[PLATFORM] Usuario:', email, 'isTeacher:', isTeacher);
    enterApp();
    if(isNewUser){ const nombre = state.user.name.split(' ')[0]; alert(`¡Bienvenido ${nombre}! Ya puedes empezar a estudiar en Academia Addison.`); }
  }else{ state.user=null; appEl.classList.add('hidden'); welcomeEl.classList.remove('hidden'); }
});

function enterApp(){
  welcomeEl.classList.add('hidden'); appEl.classList.remove('hidden');
  userNameTop.textContent=state.user.name.split(' ')[0];
  renderCourses();
  const courses=getCoursesForGroup(state.user.group);
  const lastCourse=sessionStorage.getItem('addison_last_course');
  if(lastCourse && courses.some(c=>c.id===lastCourse)){ state.activeCourseId=lastCourse; }
  else{ const first=courses[0]; if(first){state.activeCourseId=first.id;} }
  renderTopics(); initLive();
}

function isMobile(){return window.innerWidth<=960}
function toggleSidebar(){if(isMobile()){const open=!sidebarEl.classList.contains('open');sidebarEl.classList.toggle('open',open);sidebarBackdrop.classList.toggle('show',open);}else{appBody.classList.toggle('collapsed');}}
btnToggleSidebar.onclick=toggleSidebar;sidebarBackdrop.onclick=()=>{sidebarEl.classList.remove('open');sidebarBackdrop.classList.remove('show')};
function getCoursesForGroup(g){return DATA.courses.filter(c=>c.groups.includes(g))}

function topicProgress(course,topic){
  const hasSubs = topic.subtopics && topic.subtopics.length>0;
  if(hasSubs){
    let sum=0, count=0;
    topic.subtopics.forEach(s=>{
      const ex = getProgress(course.id, topic.id, s.id, 'exam');
      if(typeof ex === 'number'){ sum += ex; count++; }
      else if(ex){ sum += 100; count++; }
      else { sum += 0; count++; }
    });
    return count? Math.round(sum/count) : 0;
  }else{
    const ex = getProgress(course.id, topic.id, '', 'exam');
    if(typeof ex === 'number') return ex;
    if(ex) return 100;
    return 0;
  }
}

function courseProgress(course){
  if(!course.topics || course.topics.length===0) return 0;
  let sum=0; course.topics.forEach(t=> sum+=topicProgress(course,t)); return Math.round(sum/course.topics.length);
}

function renderCourses(){
  if(!courseListEl) return;
  courseListEl.innerHTML='';
  const courses=getCoursesForGroup(state.user.group);
  sidebarGroupEl.textContent = groupLabel(state.user.group);
  const overall = courses.length? Math.round(courses.reduce((a,c)=>a+courseProgress(c),0)/courses.length):0;
  sidebarOverallEl.innerHTML = `<svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-soft)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand)" stroke-width="3" stroke-dasharray="${overall},100"/></svg><div class="pct">${overall}%</div>`;
  courses.forEach(course=>{
    const pct=courseProgress(course);
    const isActive=course.id===state.activeCourseId;
    const isLive =!!state.liveSessions?.[course.id]?.active;
    const item=document.createElement('div');
    item.className='course-item'+(isActive?' active':'');
    item.innerHTML=`<div class="course-info"><strong>${course.name}</strong><small>${course.desc||''}</small></div><div class="course-progress"><svg viewBox="0 0 36 36"><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--bg-soft)" stroke-width="3"/><path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--brand)" stroke-width="3" stroke-dasharray="${pct},100"/></svg><div class="pct">${pct}%</div></div>${isLive?'<div class="course-live-badge" title="En vivo"></div>':''}`;
    item.onclick=()=>{state.activeCourseId=course.id;renderCourses();renderTopics();};
    courseListEl.appendChild(item);
  });
}

function renderTopics(){
  if(!topicsGridEl) return;
  topicsGridEl.innerHTML='';
  const course=DATA.courses.find(c=>c.id===state.activeCourseId);
  if(!course) return;
  if(liveCardContainer) topicsGridEl.appendChild(liveCardContainer);

  course.topics.forEach(topic=>{
    const pct=topicProgress(course,topic);
    const card=document.createElement('div');
    card.className='topic-card';
    const head=document.createElement('div');
    head.className='topic-head';
    head.innerHTML=`<strong>${topic.name}</strong><span class="badge">${pct}%</span>`;
    const prog=document.createElement('div');
    prog.className='progress'; prog.innerHTML=`<span style="width:${pct}%"></span>`;
    card.appendChild(head); card.appendChild(prog);
    if(topic.subtopics && topic.subtopics.length>0){
      topic.subtopics.forEach(sub=>{
        const subEl=document.createElement('div');
        subEl.className='subtopic';
        const ex=getProgress(course.id,topic.id,sub.id,'exam');
        const exTxt= typeof ex==='number'? `${ex}%` : ex? 'Completado':'Pendiente';
        subEl.innerHTML=`<strong>${sub.name}</strong><div class="sub-meta">Examen: ${exTxt}</div><div class="sub-actions"><button>Teoría</button><button class="primary">Examen</button></div>`;
        const [btnT,btnE]=subEl.querySelectorAll('button');
        btnT.onclick=()=>openContent('Teoría',sub.theoryUrl,course.id,topic.id,sub.id,'theory');
        btnE.onclick=()=>openContent('Examen',sub.examUrl,course.id,topic.id,sub.id,'exam');
        card.appendChild(subEl);
      });
    }else{
      const meta=document.createElement('div');
      meta.className='sub-meta'; meta.textContent='Tema sin subtemas';
      const actions=document.createElement('div');
      actions.className='sub-actions';
      actions.innerHTML=`<button>Teoría</button><button class="primary">Examen</button>`;
      actions.children[0].onclick=()=>openContent('Teoría',topic.theoryUrl,course.id,topic.id,'','theory');
      actions.children[1].onclick=()=>openContent('Examen',topic.examUrl,course.id,topic.id,'','exam');
      card.appendChild(meta); card.appendChild(actions);
    }
    topicsGridEl.appendChild(card);
  });
}

function openContent(title,url,courseId,topicId,subId,type){
  let targetUrl=''; let examKey=''; let theoryKey='';
  if(type==='exam'){ targetUrl='examen/index.html'; if(url && url.trim()!==''){try{const clean=url.split('?')[0].split('#')[0];const file=clean.split('/').pop()||'';examKey=file.replace(/\.html?$/i,'');}catch(e){}} }
  else if(type==='theory'){ targetUrl='teoria/index.html'; if(url && url.trim()!==''){try{const clean=url.split('?')[0].split('#')[0];const file=clean.split('/').pop()||'';theoryKey=file.replace(/\.html?$/i,'');}catch(e){}} }
  else{ targetUrl=url && url.trim()!==''?url:(type==='theory'?'teoria_final.html':''); }
  if(targetUrl){
    const fullUrl=targetUrl.startsWith('http')?targetUrl:targetUrl;
    const urlSinCache=fullUrl+(fullUrl.includes('?')?'&':'?')+'t='+Date.now();
    const sep=urlSinCache.includes('?')?'&':'?';
    let urlWithIds=urlSinCache+sep+'courseId='+encodeURIComponent(courseId)+'&topicId='+encodeURIComponent(topicId)+'&subId='+encodeURIComponent(subId||'');
    if(type==='exam' && examKey) urlWithIds+='&examKey='+encodeURIComponent(examKey);
    if(type==='theory' && theoryKey) urlWithIds+='&theoryKey='+encodeURIComponent(theoryKey);
    try{const studentName=state.user?.name||'';if(studentName){urlWithIds+='&name='+encodeURIComponent(studentName);}}catch(e){}
    try{sessionStorage.setItem('addison_last_course',courseId);}catch(e){}
    window.location.href=urlWithIds; return;
  }else{ const val=type==='exam'?Math.floor(Math.random()*41)+60:true; setProgress(courseId,topicId,subId,type,val); }
}

btnCloseIframe.onclick = ()=>{ modalIframe.classList.add('hidden'); if(iframeContent){ iframeContent.src='about:blank'; } };
window.addEventListener('message', e=>{ const d=e.data||{}; if(d.type==='progress'){ setProgress(d.courseId,d.topicId,d.subId,d.contentType,d.value??true); } });

btnAccount.onclick=()=>{ accName.value=state.user.name; accEmail.value=state.user.email; populateGroupSelect(accGroup,state.user.group); if(ALLOW_GROUP_CHANGE){ accGroup.disabled=false; accGroupHint.textContent='Puedes cambiar de grupo.'; }else{ accGroup.disabled=true; accGroupHint.textContent='Cambio deshabilitado.'; } modalAccount.classList.remove('hidden'); };
btnCloseAccount.onclick=()=>modalAccount.classList.add('hidden');
btnSaveAccount.onclick=()=>{ state.user.name=accName.value.trim()||state.user.name; if(ALLOW_GROUP_CHANGE && accGroup.value!==state.user.group){ state.user.group=accGroup.value; const first=getCoursesForGroup(state.user.group)[0]; state.activeCourseId=first?first.id:null; } persistUser(); userNameTop.textContent=state.user.name.split(' ')[0]; modalAccount.classList.add('hidden'); renderCourses(); renderTopics(); };
btnLogout.onclick=()=>{auth.signOut();};

// ==================== SISTEMA DE CLASES EN VIVO ====================
function initLive(){
  if(!state.user) return;
  console.log('[LIVE] Iniciando listener de live_sessions');
  db.collection('live_sessions').where('active','==',true).onSnapshot(snapshot=>{
    const activeSessions = {};
    snapshot.forEach(doc=>{ activeSessions[doc.id]=doc.data(); });
    state.liveSessions = activeSessions;
    console.log('[LIVE] Sesiones activas:', Object.keys(activeSessions));
    renderLiveBar(); renderLiveCard(); renderCourses();
  }, err=>{
    console.error('[LIVE] Error listener:', err);
  });
}
function renderLiveBar(){
  if(!liveBarEl) return;
  if(!state.isTeacher){ liveBarEl.classList.add('hidden'); return; }
  const course = DATA.courses.find(c=>c.id===state.activeCourseId);
  if(!course){ liveBarEl.classList.add('hidden'); return; }
  const session = state.liveSessions?.[course.id];
  liveBarEl.classList.remove('hidden');
  if(session && session.active){
    liveBarEl.innerHTML = `
      <div class="live-bar-left">
        <div class="live-dot"></div>
        <div>
          <div class="live-bar-title">Clase en vivo activa</div>
          <div class="live-bar-sub">${course.name} • ${session.participants||0} alumnos conectados</div>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="live-bar-btn" onclick="joinLiveClass('${course.id}')">Entrar a la sala</button>
        <button class="live-bar-btn" style="background:#fff;color:#d32f2f" onclick="endLiveClass('${course.id}')">Finalizar</button>
      </div>`;
  }else{
    liveBarEl.innerHTML = `
      <div class="live-bar-left">
        <div class="live-dot" style="background:rgba(255,255,255,.5);animation:none"></div>
        <div>
          <div class="live-bar-title">Iniciar clase en vivo</div>
          <div class="live-bar-sub">${course.name} • Los alumnos verán la invitación al instante</div>
        </div>
      <button class="live-bar-btn" onclick="startLiveClass('${course.id}')">Iniciar ahora</button>`;
  }
}
function renderLiveCard(){
  if(!liveCardContainer) return;
  if(state.isTeacher){ liveCardContainer.innerHTML=''; return; }
  const course = DATA.courses.find(c=>c.id===state.activeCourseId);
  if(!course){ liveCardContainer.innerHTML=''; return; }
  const session = state.liveSessions?.[course.id];
  if(session && session.active){
    liveCardContainer.innerHTML = `<div class="live-card"><div class="live-card-head"><div class="live-dot"></div><div class="live-card-title">¡Clase en vivo ahora!</div></div><div class="live-card-msg">Tu profesor ${session.teacherName||''} está en línea. Únete ahora y no te pierdas la explicación en vivo. 🚀</div><button class="live-card-btn" onclick="joinLiveClass('${course.id}')">Entrar a clase en vivo</button></div>`;
  }else{ liveCardContainer.innerHTML=''; }
}
async function startLiveClass(courseId){
  try{
    await db.collection('live_sessions').doc(courseId).set({ active:true, courseId, teacherEmail: state.user.email, teacherName: state.user.name, startedAt: firebase.firestore.FieldValue.serverTimestamp(), participants:0 },{merge:true});
    window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`;
  }catch(e){ alert('Error al iniciar clase: '+e.message); }
}
async function endLiveClass(courseId){
  if(!confirm('¿Finalizar la clase en vivo? Los alumnos serán desconectados.')) return;
  try{
    await db.collection('live_sessions').doc(courseId).update({ active:false, endedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }catch(e){ alert('Error al finalizar: '+e.message); }
}
function joinLiveClass(courseId){ window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`; }
window.startLiveClass = startLiveClass; window.joinLiveClass = joinLiveClass; window.endLiveClass = endLiveClass;

async function init(){ await loadData(); populateGroupSelect(inpGroup,'A'); }
init();
