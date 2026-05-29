// ==================== CONFIGURACIÓN GLOBAL ====================
// ALLOW_GROUP_CHANGE permite al usuario cambiar de grupo desde su perfil.

const ALLOW_GROUP_CHANGE = true;

let DATA;

async function loadData(){
  const res = await fetch('data/courses.json');
  if(!res.ok) throw new Error('No se pudo cargar courses.json');
  DATA = await res.json();
}

// ==================== UTILIDADES DE LOCALSTORAGE ====================
function groupLabel(key){const g=DATA.groups[key];return g?`${key} - ${g.name}`:key;}
const LS_USERS='addison_users',LS_SESSION='addison_session';
const loadUsers=()=>{try{return JSON.parse(localStorage.getItem(LS_USERS)||'{}')}catch{return{}}};
const saveUsers=u=>localStorage.setItem(LS_USERS,JSON.stringify(u));
const getSession=()=>localStorage.getItem(LS_SESSION);
const setSession=e=>localStorage.setItem(LS_SESSION,e);
const clearSession=()=>localStorage.removeItem(LS_SESSION);
let state={user:null,activeCourseId:null};
const progKey=(c,t,s,type)=>`${c}|${t}|${s||''}|${type}`;
const getProgress=(c,t,s,type)=>state.user?.progress?.[progKey(c,t,s,type)];
const setProgress=(c,t,s,type,val)=>{if(!state.user)return;state.user.progress=state.user.progress||{};state.user.progress[progKey(c,t,s,type)]=val;persistUser();renderTopics();renderCourses();};
function persistUser(){const users=loadUsers();users[state.user.email]=state.user;saveUsers(users);}

const welcomeEl=document.getElementById('welcome');const appEl=document.getElementById('app');const loginForm=document.getElementById('loginForm');
const inpName=document.getElementById('inpName');const inpEmail=document.getElementById('inpEmail');const inpPass=document.getElementById('inpPass');const inpGroup=document.getElementById('inpGroup');
const fName=document.getElementById('fName');const fEmail=document.getElementById('fEmail');const fPass=document.getElementById('fPass');
const btnToggleSidebar=document.getElementById('btnToggleSidebar');const appBody=document.getElementById('appBody');const sidebarEl=document.getElementById('sidebar');
const sidebarBackdrop=document.getElementById('sidebarBackdrop');const courseListEl=document.getElementById('courseList');const sidebarGroupEl=document.getElementById('sidebarGroup');const sidebarOverallEl=document.getElementById('sidebarOverall');
const topicsGridEl=document.getElementById('topicsGrid');const userNameTop=document.getElementById('userNameTop');
const modalAccount=document.getElementById('modalAccount');const btnAccount=document.getElementById('btnAccount');
const accName=document.getElementById('accName');const accEmail=document.getElementById('accEmail');const accGroup=document.getElementById('accGroup');
const accGroupHint=document.getElementById('accGroupHint');const accPass=document.getElementById('accPass');
const btnSaveAccount=document.getElementById('btnSaveAccount');const btnLogout=document.getElementById('btnLogout');const btnCloseAccount=document.getElementById('btnCloseAccount');
const modalIframe=document.getElementById('modalIframe');const iframeTitle=document.getElementById('iframeTitle');const iframeContent=document.getElementById('iframeContent');const btnCloseIframe=document.getElementById('btnCloseIframe');

function populateGroupSelect(selectEl,selectedKey){selectEl.innerHTML='';Object.keys(DATA.groups).forEach(key=>{const opt=document.createElement('option');opt.value=key;opt.textContent=groupLabel(key);if(key===selectedKey)opt.selected=true;selectEl.appendChild(opt);});}

function validateName(){const v=inpName.value.trim();const ok=v.split(/\s+/).filter(Boolean).length>=2;fName.classList.toggle('error',!ok);return ok}
function validateEmail(){const v=inpEmail.value.trim();const ok=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);fEmail.classList.toggle('error',!ok);return ok}
inpName.addEventListener('input',()=>fName.classList.remove('error'));inpEmail.addEventListener('input',()=>fEmail.classList.remove('error'));inpPass.addEventListener('input',()=>fPass.classList.remove('error'));
loginForm.addEventListener('submit',e=>{e.preventDefault();const nameOk=validateName();const emailOk=validateEmail();const email=inpEmail.value.trim().toLowerCase();const pass=inpPass.value;const name=inpName.value.trim();const group=inpGroup.value;if(!nameOk||!emailOk||!pass)return;const users=loadUsers();if(users[email]){if(users[email].pass!==pass){fPass.classList.add('error');return}state.user=users[email];}else{state.user={name,email,pass,group,progress:{}};users[email]=state.user;saveUsers(users);}setSession(email);enterApp();});

function enterApp(){welcomeEl.classList.add('hidden');appEl.classList.remove('hidden');userNameTop.textContent=state.user.name.split(' ')[0];renderCourses();const courses=getCoursesForGroup(state.user.group);const lastCourse=sessionStorage.getItem('addison_last_course');if(lastCourse && courses.some(c=>c.id===lastCourse)){state.activeCourseId=lastCourse;}else{const first=courses[0];if(first){state.activeCourseId=first.id;}}renderTopics();}
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
function courseProgress(course){if(!course.topics.length)return 0;const sum=course.topics.reduce((a,t)=>a+topicProgress(course,t),0);return Math.round(sum/course.topics.length);}

function renderCourses(){courseListEl.innerHTML='';sidebarGroupEl.textContent=groupLabel(state.user.group);const courses=getCoursesForGroup(state.user.group);let overallPct=0;if(courses.length){const sum=courses.reduce((a,c)=>a+courseProgress(c),0);overallPct=Math.round(sum/courses.length);}if(sidebarOverallEl){const radius=18,circ=2*Math.PI*radius,offset=circ*(1-overallPct/100);sidebarOverallEl.innerHTML=`<div class="course-progress"><svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="${radius}" stroke="var(--bg-soft)" stroke-width="4" fill="none"/><circle cx="22" cy="22" r="${radius}" stroke="var(--brand)" stroke-width="4" fill="none" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"/></svg><div class="pct">${overallPct}%</div></div>`;}courses.forEach(c=>{const div=document.createElement('div');div.className='course-item'+(c.id===state.activeCourseId?' active':'');const topicsCount=c.topics?c.topics.length:0;const pct=courseProgress(c);const radius=15,circ=2*Math.PI*radius;const offset=circ*(1-pct/100);div.innerHTML=`<div class="course-info"><strong>${c.name}</strong><small>${topicsCount} temas</small></div><div class="course-progress"><svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="${radius}" stroke="var(--bg-soft)" stroke-width="3.5" fill="none"/><circle cx="18" cy="18" r="${radius}" stroke="var(--brand)" stroke-width="3.5" fill="none" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"/></svg><div class="pct">${pct}%</div></div>`;div.onclick=()=>{state.activeCourseId=c.id;renderCourses();renderTopics();if(isMobile()){sidebarEl.classList.remove('open');sidebarBackdrop.classList.remove('show')}};courseListEl.appendChild(div);});}

function renderTopics(){topicsGridEl.innerHTML='';const course=DATA.courses.find(c=>c.id===state.activeCourseId);if(!course)return;course.topics.forEach(topic=>{const pct=topicProgress(course,topic);const hasSubs=topic.subtopics&&topic.subtopics.length>0;const card=document.createElement('div');card.className='topic-card';card.innerHTML=`<div class="topic-head"><strong>${topic.name}</strong><span class="badge">${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div>`;if(hasSubs){topic.subtopics.forEach(s=>{const th=!!getProgress(course.id,topic.id,s.id,'theory');const ex=getProgress(course.id,topic.id,s.id,'exam');const exText=typeof ex==='number'?ex+'%':(ex?'✓':'✕');const sub=document.createElement('div');sub.className='subtopic';sub.innerHTML=`<strong>${s.name}</strong><div class="sub-meta">Teoría: ${th?'✓':'✕'} • Examen: ${exText}</div><div class="sub-actions"><button>Teoría</button><button class="primary">Examen</button></div>`;sub.querySelector('button').onclick=()=>openContent('Teoría',s.theoryUrl,course.id,topic.id,s.id,'theory');sub.querySelector('.primary').onclick=()=>openContent('Examen',s.examUrl,course.id,topic.id,s.id,'exam');card.appendChild(sub);});}else{const th=!!getProgress(course.id,topic.id,'','theory');const ex=getProgress(course.id,topic.id,'','exam');const exText=typeof ex==='number'?ex+'%':(ex?'✓':'✕');const meta=document.createElement('div');meta.className='sub-meta';meta.textContent=`Teoría: ${th?'✓':'✕'} • Examen: ${exText}`;const actions=document.createElement('div');actions.className='sub-actions';actions.innerHTML=`<button>Teoría</button><button class="primary">Examen</button>`;actions.children[0].onclick=()=>openContent('Teoría',topic.theoryUrl,course.id,topic.id,'','theory');actions.children[1].onclick=()=>openContent('Examen',topic.examUrl,course.id,topic.id,'','exam');card.appendChild(meta);card.appendChild(actions);}topicsGridEl.appendChild(card);});}

function openContent(title,url,courseId,topicId,subId,type){
  let targetUrl='';
  let examKey='';
  let theoryKey='';
  if(type==='exam'){
    targetUrl='examen/index.html';
    if(url && url.trim()!==''){try{const clean=url.split('?')[0].split('#')[0];const file=clean.split('/').pop()||'';examKey=file.replace(/\.html?$/i,'');}catch(e){}}
  }else if(type==='theory'){
    targetUrl='teoria/index.html';
    if(url && url.trim()!==''){try{const clean=url.split('?')[0].split('#')[0];const file=clean.split('/').pop()||'';theoryKey=file.replace(/\.html?$/i,'');}catch(e){}}
  }else{
    targetUrl=url && url.trim()!==''?url:(type==='theory'?'teoria_final.html':'');
  }
  if(targetUrl){
    const fullUrl=targetUrl.startsWith('http')?targetUrl:targetUrl;
    const urlSinCache=fullUrl+(fullUrl.includes('?')?'&':'?')+'t='+Date.now();
    const sep=urlSinCache.includes('?')?'&':'?';
    let urlWithIds=urlSinCache+sep+'courseId='+encodeURIComponent(courseId)+'&topicId='+encodeURIComponent(topicId)+'&subId='+encodeURIComponent(subId||'');
    if(type==='exam' && examKey) urlWithIds+='&examKey='+encodeURIComponent(examKey);
    if(type==='theory' && theoryKey) urlWithIds+='&theoryKey='+encodeURIComponent(theoryKey);
    let courseName='',topicName='',subName='';
    try{
      const studentName=state.user?.name||'';
      const course=DATA.courses.find(c=>c.id===courseId);
      if(course){courseName=course.name||'';const topic=course.topics?.find(t=>t.id===topicId);if(topic){topicName=topic.name||'';const sub=topic.subtopics?.find(s=>s.id===subId);if(sub) subName=sub.name||'';}}
      if(studentName){urlWithIds+='&name='+encodeURIComponent(studentName);try{localStorage.setItem('ava_name',studentName);}catch(e){}}
      if(courseName) urlWithIds+='&courseName='+encodeURIComponent(courseName);
      if(topicName) urlWithIds+='&topicName='+encodeURIComponent(topicName);
      if(subName) urlWithIds+='&subName='+encodeURIComponent(subName);
    }catch(e){}
    try{sessionStorage.setItem('addison_last_course',courseId);sessionStorage.setItem('addison_last_topic',topicId);sessionStorage.setItem('addison_last_sub',subId||'');}catch(e){}
    window.location.href=urlWithIds;
    return;
  }else{
    const val=type==='exam'?Math.floor(Math.random()*41)+60:true;
    setProgress(courseId,topicId,subId,type,val);
  }
}


btnCloseIframe.onclick = ()=>{ modalIframe.classList.add('hidden'); if(iframeContent){ iframeContent.src='about:blank'; } };

window.addEventListener('message', e=>{ const d=e.data||{}; if(d.type==='progress'){ setProgress(d.courseId,d.topicId,d.subId,d.contentType,d.value??true); } });

btnAccount.onclick=()=>{accName.value=state.user.name;accEmail.value=state.user.email;populateGroupSelect(accGroup,state.user.group);accPass.value='';if(ALLOW_GROUP_CHANGE){accGroup.disabled=false;accGroupHint.textContent='Puedes cambiar de grupo.';}else{accGroup.disabled=true;accGroupHint.textContent='Cambio deshabilitado.';}modalAccount.classList.remove('hidden');};
btnCloseAccount.onclick=()=>modalAccount.classList.add('hidden');
btnSaveAccount.onclick=()=>{state.user.name=accName.value.trim()||state.user.name;if(accPass.value)state.user.pass=accPass.value;if(ALLOW_GROUP_CHANGE && accGroup.value!==state.user.group){state.user.group=accGroup.value;const first=getCoursesForGroup(state.user.group)[0];state.activeCourseId=first?first.id:null;}persistUser();userNameTop.textContent=state.user.name.split(' ')[0];modalAccount.classList.add('hidden');renderCourses();renderTopics();};
btnLogout.onclick=()=>{clearSession();state.user=null;appEl.classList.add('hidden');welcomeEl.classList.remove('hidden');modalAccount.classList.add('hidden');};

async function init(){
  await loadData();
  populateGroupSelect(inpGroup,'A');
  const email=getSession();
  if(email){
    const users=loadUsers();
    if(users[email]){
      state.user=users[email];
      enterApp();
      try{
        const dataStr = sessionStorage.getItem('examProgress');
        if(dataStr){
          const d = JSON.parse(dataStr);
          if(d && d.courseId){
            setProgress(d.courseId,d.topicId,d.subId,d.contentType||'exam',d.value??true);
            sessionStorage.removeItem('examProgress');
          }
        }
      }catch(e){}
    }
  }
}
init();

window.addEventListener('message', (event)=>{
  const data = event.data;
  if(!data) return;
  const isProgress = data.type==='progress' || data.type==='addison_progress';
  if(isProgress){
    if(data.contentType==='exam' || data.type==='exam'){
      const courseId = data.courseId||'';
      const topicId = data.topicId||'';
      const subId = data.subId||'';
      const value = Number(data.value)||0;
      if(courseId){
        setProgress(courseId,topicId,subId,'exam',value);
        if(typeof renderTopics==='function') renderTopics();
        if(typeof renderCourses==='function') renderCourses();
        try{ event.source && event.source.postMessage({type:'addison_ack',status:'ok'},'*'); }catch(e){}
      }
    }
  }
});
