// ACADEMIA ADDISON - PLATFORM.JS v4.0 FIRESTORE
// Roles dinámicos + progreso en cadena + admin panel

const ADMIN_EMAIL_INICIAL = 'eduardo.floreshu@gmail.com';

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
  const res = await fetch('data/courses.json', { cache: 'no-store' });
  if(!res.ok) throw new Error('No se pudo cargar courses.json: '+res.status);
  DATA = await res.json();
}

function groupLabel(key){const g=DATA.groups[key];return g?`${key} - ${g.name}`:key;}
const LS_USERS='addison_users';
const loadUsers=()=>{try{return JSON.parse(localStorage.getItem(LS_USERS)||'{}')}catch{return{}}};
const saveUsers=u=>localStorage.setItem(LS_USERS,JSON.stringify(u));

let state={user:null,activeCourseId:null,isTeacher:false,isAdmin:false,liveSessions:{}};

const progKey=(c,t,s,type)=>`${c}|${t}|${s||''}|${type}`;
const getProgress=(c,t,s,type)=>state.user?.progress?.[progKey(c,t,s,type)];

const setProgress=async(c,t,s,type,val)=>{
  if(!state.user)return;
  state.user.progress=state.user.progress||{};
  state.user.progress[progKey(c,t,s,type)]=val;
  await persistUser();
  renderTopics();
  renderCourses();
};

async function persistUser(){
  if(!state.user) return;
  try{
    await db.collection('users').doc(state.user.email).set({
      nombre: state.user.name,
      email: state.user.email,
      grupo: state.user.group,
      rol: state.user.rol,
      progreso: state.user.progress || {},
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge:true});
  }catch(e){ console.error('Error guardando:', e); }
}

const welcomeEl=document.getElementById('welcome');
const appEl=document.getElementById('app');
const inpGroup=document.getElementById('inpGroup');
const btnGoogleLogin=document.getElementById('btnGoogleLogin');
const btnToggleSidebar=document.getElementById('btnToggleSidebar');
const appBody=document.getElementById('appBody');
const sidebarEl=document.getElementById('sidebar');
const sidebarBackdrop=document.getElementById('sidebarBackdrop');
const courseListEl=document.getElementById('courseList');
const sidebarGroupEl=document.getElementById('sidebarGroup');
const sidebarOverallEl=document.getElementById('sidebarOverall');
const topicsGridEl=document.getElementById('topicsGrid');
const userNameTop=document.getElementById('userNameTop');
const modalAccount=document.getElementById('modalAccount');
const btnAccount=document.getElementById('btnAccount');
const accName=document.getElementById('accName');
const accEmail=document.getElementById('accEmail');
const accGroup=document.getElementById('accGroup');
const accGroupHint=document.getElementById('accGroupHint');
const btnSaveAccount=document.getElementById('btnSaveAccount');
const btnLogout=document.getElementById('btnLogout');
const btnCloseAccount=document.getElementById('btnCloseAccount');
const liveBarEl=document.getElementById('liveBar');
const liveCardContainer=document.getElementById('liveCardContainer');

function populateGroupSelect(selectEl,selectedKey){
  selectEl.innerHTML='';
  Object.keys(DATA.groups).forEach(key=>{
    const opt=document.createElement('option');
    opt.value=key;
    opt.textContent=groupLabel(key);
    if(key===selectedKey)opt.selected=true;
    selectEl.appendChild(opt);
  });
}

btnGoogleLogin?.addEventListener('click', async ()=>{
  try{ await auth.signInWithPopup(googleProvider); }catch(e){ alert('Error: '+e.message); }
});

auth.onAuthStateChanged(async user=>{
  if(user){
    if(!DATA) await loadData();
    const email=user.email.toLowerCase();
    
    const userRef = db.collection('users').doc(email);
    const doc = await userRef.get();
    
    let profile;
    let isNewUser = false;
    
    if(doc.exists){
      const data = doc.data();
      profile = {
        name: data.nombre,
        email: data.email,
        group: data.grupo,
        rol: data.rol || 'alumno',
        progress: data.progreso || {}
      };
    } else {
      isNewUser = true;
      const selectedGroup = inpGroup.value || Object.keys(DATA.groups)[0];
      const rolInicial = (email === ADMIN_EMAIL_INICIAL) ? 'administrador' : 'alumno';
      
      profile = {
        name: user.displayName || email.split('@')[0],
        email,
        group: selectedGroup,
        rol: rolInicial,
        progress: {}
      };
      
      await userRef.set({
        nombre: profile.name,
        email: profile.email,
        grupo: profile.group,
        rol: profile.rol,
        progreso: {},
        creadoEn: firebase.firestore.FieldValue.serverTimestamp(),
        creadoPor: 'sistema'
      });
    }
    
    // Migrar localStorage
    const localUsers = loadUsers();
    if(localUsers[email] && localUsers[email].progress){
      const localProgress = localUsers[email].progress;
      if(Object.keys(localProgress).length > 0 && Object.keys(profile.progress).length === 0){
        profile.progress = localProgress;
        await userRef.update({ progreso: localProgress });
        delete localUsers[email];
        saveUsers(localUsers);
      }
    }
    
    state.user = profile;
    state.isTeacher = profile.rol === 'docente' || profile.rol === 'administrador';
    state.isAdmin = profile.rol === 'administrador';
    
    enterApp();
    if(isNewUser){ 
      alert(`¡Bienvenido ${profile.name.split(' ')[0]}!`); 
    }
  }else{ 
    state.user=null; 
    appEl.classList.add('hidden'); 
    welcomeEl.classList.remove('hidden'); 
  }
});

function enterApp(){
  welcomeEl.classList.add('hidden'); 
  appEl.classList.remove('hidden');
  userNameTop.textContent=state.user.name.split(' ')[0];
  
  if(state.isAdmin && !document.getElementById('btnAdmin')){
    const adminBtn = document.createElement('button');
    adminBtn.id = 'btnAdmin';
    adminBtn.className = 'user-btn';
    adminBtn.innerHTML = '👑';
    adminBtn.title = 'Panel Admin';
    adminBtn.style.marginLeft = '8px';
    adminBtn.onclick = ()=>document.getElementById('modalAdmin')?.classList.remove('hidden');
    document.querySelector('.topbar').appendChild(adminBtn);
  }
  
  renderCourses();
  const courses=getCoursesForGroup(state.user.group);
  const lastCourse=sessionStorage.getItem('addison_last_course');
  if(lastCourse && courses.some(c=>c.id===lastCourse)){ state.activeCourseId=lastCourse; }
  else{ const first=courses[0]; if(first){state.activeCourseId=first.id;} }
  renderTopics(); 
  initLive();
}

function isMobile(){return window.innerWidth<=960}
function toggleSidebar(){
  if(isMobile()){
    const open=!sidebarEl.classList.contains('open');
    sidebarEl.classList.toggle('open',open);
    sidebarBackdrop.classList.toggle('show',open);
  }else{
    appBody.classList.toggle('collapsed');
  }
}
btnToggleSidebar.onclick=toggleSidebar;
sidebarBackdrop.onclick=()=>{sidebarEl.classList.remove('open');sidebarBackdrop.classList.remove('show')};

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
  let sum=0; 
  course.topics.forEach(t=> sum+=topicProgress(course,t)); 
  return Math.round(sum/course.topics.length);
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

document.getElementById('btnCloseIframe').onclick = ()=>{ document.getElementById('modalIframe').classList.add('hidden'); };
window.addEventListener('message', e=>{ const d=e.data||{}; if(d.type==='progress'){ setProgress(d.courseId,d.topicId,d.subId,d.contentType,d.value??true); } });

btnAccount.onclick=()=>{ 
  accName.value=state.user.name; 
  accEmail.value=state.user.email; 
  populateGroupSelect(accGroup,state.user.group); 
  const puedeCambiar = state.isAdmin || state.user.rol === 'docente';
  accGroup.disabled = !puedeCambiar;
  accGroupHint.textContent = puedeCambiar ? 'Puedes cambiar de grupo.' : 'Solo administradores pueden cambiar grupos.';
  document.getElementById('accGroupField').style.display = state.user.rol === 'alumno' ? 'none' : 'block';
  modalAccount.classList.remove('hidden'); 
};
btnCloseAccount.onclick=()=>modalAccount.classList.add('hidden');
btnSaveAccount.onclick=async()=>{
  state.user.name=accName.value.trim()||state.user.name; 
  if((state.isAdmin || state.user.rol==='docente') && accGroup.value!==state.user.group){ 
    state.user.group=accGroup.value; 
    const first=getCoursesForGroup(state.user.group)[0]; 
    state.activeCourseId=first?first.id:null; 
  } 
  await persistUser(); 
  userNameTop.textContent=state.user.name.split(' ')[0]; 
  modalAccount.classList.add('hidden'); 
  renderCourses(); 
  renderTopics(); 
};
btnLogout.onclick=()=>{auth.signOut();};

function initLive(){
  if(!state.user) return;
  db.collection('live_sessions').where('active','==',true).onSnapshot(snapshot=>{
    const activeSessions = {};
    snapshot.forEach(doc=>{ activeSessions[doc.id]=doc.data(); });
    state.liveSessions = activeSessions;
    renderLiveBar(); renderLiveCard(); renderCourses();
  });
}

function renderLiveBar(){
  if(!liveBarEl) return;
  const course = DATA.courses.find(c=>c.id===state.activeCourseId);
  if(!course){ liveBarEl.classList.add('hidden'); return; }
  const session = state.liveSessions?.[course.id];
  liveBarEl.classList.remove('hidden');
  
  // Mostrar historial de grabaciones para todos
  db.collection('live_history').where('cursoId','==',course.id).orderBy('inicio','desc').limit(3).get().then(snap=>{
    let historial = '';
    snap.forEach(doc=>{
      const d=doc.data();
      const dias = Math.ceil((d.expiraEn.toDate() - new Date())/(1000*60*60*24));
      historial += `<div style="font-size:12px;opacity:.9">${d.tema} - borra en ${dias}d</div>`;
    });
    
    if(session && session.active && state.isTeacher){
      liveBarEl.innerHTML = `<div class="live-bar-left"><div class="live-dot"></div><div><div class="live-bar-title">Clase en vivo</div><div class="live-bar-sub">${course.name}</div></div></div><div style="display:flex;gap:8px"><button class="live-bar-btn" onclick="joinLiveClass('${course.id}')">Entrar</button><button class="live-bar-btn" style="background:#fff;color:#d32f2f" onclick="endLiveClass('${course.id}')">Finalizar</button></div>`;
    } else {
      liveBarEl.innerHTML = `<div class="live-bar-left"><div style="width:12px"></div><div><div class="live-bar-title">Grabaciones recientes</div>${historial||'<div style="font-size:12px;opacity:.9">No hay grabaciones</div>'}</div></div>`;
    }
  });
}

function renderLiveCard(){
  if(!liveCardContainer) return;
  if(state.isTeacher){ liveCardContainer.innerHTML=''; return; }
  const course = DATA.courses.find(c=>c.id===state.activeCourseId);
  if(!course){ liveCardContainer.innerHTML=''; return; }
  const session = state.liveSessions?.[course.id];
  if(session && session.active){
    liveCardContainer.innerHTML = `<div class="live-card"><div class="live-card-head"><div class="live-dot"></div><div class="live-card-title">¡Clase en vivo ahora!</div></div><div class="live-card-msg">Tu profesor está en línea.</div><button class="live-card-btn" onclick="joinLiveClass('${course.id}')">Entrar</button></div>`;
  }else{ liveCardContainer.innerHTML=''; }
}

async function startLiveClass(courseId){
  const tema = prompt('Tema de la clase de hoy:');
  if(!tema) return;
  sessionStorage.setItem('liveTema', tema);
  await db.collection('live_sessions').doc(courseId).set({ active:true, courseId, teacherEmail: state.user.email, teacherName: state.user.name, tema, startedAt: firebase.firestore.FieldValue.serverTimestamp(), participants:0 },{merge:true});
  window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`;
}
async function endLiveClass(courseId){
  if(!confirm('¿Finalizar clase?')) return;
  await db.collection('live_sessions').doc(courseId).update({ active:false, endedAt: firebase.firestore.FieldValue.serverTimestamp() });
}
function joinLiveClass(courseId){ window.location.href = `live/room.html?course=${encodeURIComponent(courseId)}`; }
window.startLiveClass = startLiveClass; window.joinLiveClass = joinLiveClass; window.endLiveClass = endLiveClass;

async function init(){ await loadData(); populateGroupSelect(inpGroup,'A'); }
init();

// Admin functions
async function crearUsuario(){
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const nombre = document.getElementById('adminName').value.trim();
  const rol = document.getElementById('adminRol').value;
  const grupo = document.getElementById('adminGrupo').value;
  if(!email || !nombre) return alert('Completa datos');
  await db.collection('users').doc(email).set({ nombre, email, rol, grupo, progreso:{}, creadoEn: firebase.firestore.FieldValue.serverTimestamp(), creadoPor: state.user.email });
  document.getElementById('adminMsg').textContent = '✓ Usuario creado';
}
document.getElementById('btnCreateUser')?.addEventListener('click', crearUsuario);
document.getElementById('btnCloseAdmin')?.addEventListener('click', ()=>document.getElementById('modalAdmin').classList.add('hidden'));
