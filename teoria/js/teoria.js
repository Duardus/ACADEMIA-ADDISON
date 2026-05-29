// ==================== CONFIG ====================
const COURSES_URL = '../data/courses.json';
const MEDIA_URL = 'data/theory_media.json';

// ==================== STORAGE ====================
const LS_USERS = 'addison_users';
const LS_SESSION = 'addison_session';

// ==================== UTILIDADES ====================
async function loadJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('No se pudo cargar ' + url);
  return res.json();
}
function getParams(){
  const p = new URLSearchParams(location.search);
  return {
    courseId: p.get('courseId') || '',
    topicId: p.get('topicId') || '',
    subId: p.get('subId') || ''
  };
}
function progKey(c,t,s,type){
  return `${c}|${t}|${s||''}|${type}`;
}

// ==================== USUARIO ====================
let user = null;
function initUser(){
  const email = localStorage.getItem(LS_SESSION);
  if(!email) return;
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  user = users[email] || null;
}
initUser();

// ==================== PROGRESO ====================
function getProgress(type, ids){
  if(!user ||!user.progress) return null;
  return user.progress[progKey(ids.courseId, ids.topicId, ids.subId, type)];
}
function setProgress(type, val, ids){
  if(!user) return;
  user.progress = user.progress || {};
  user.progress[progKey(ids.courseId, ids.topicId, ids.subId, type)] = val;
  const users = JSON.parse(localStorage.getItem(LS_USERS) || '{}');
  users[user.email] = user;
  localStorage.setItem(LS_USERS, JSON.stringify(users));
  localStorage.setItem('addison_last_update', Date.now().toString());
  try{
    if('BroadcastChannel' in window){
      const ch = new BroadcastChannel('addison_progress');
      ch.postMessage({type:'progress_updated'});
      ch.close();
    }
  }catch(e){}
}

// ==================== NOMBRES ====================
function resolveNames(courses, ids){
  const course = courses.find(c => c.id === ids.courseId);
  const topic = course?.topics.find(t => t.id === ids.topicId);
  const sub = topic?.subtopics.find(s => s.id === ids.subId);
  return {
    courseName: course? course.name : ids.courseId,
    topicName: topic? topic.name : ids.topicId,
    subName: sub? sub.name : ids.subId
  };
}

// ==================== MEDIA ====================
function getMedia(media, ids){
  const c = media[ids.courseId] || {};
  const t = c[ids.topicId] || {};
  const s = t[ids.subId] || {};
  return {
    youtube: s.youtube || '',
    page: s.page || ''
  };
}

// ==================== VIDEO ====================
function initVideo(youtubeUrl){
  const overlay = document.getElementById('videoOverlay');
  const iframe = document.getElementById('ytFrame');
  if(!overlay ||!iframe) return;
  function getVideoId(url){
    try{
      const u = new URL(url);
      if(u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      const parts = u.pathname.split('/');
      const idx = parts.findIndex(p => ['embed','live','shorts'].includes(p));
      if(idx!== -1 && parts[idx+1]) return parts[idx+1];
      if(u.searchParams.get('v')) return u.searchParams.get('v');
    }catch(e){}
    const m = url.match(/(?:embed\/|live\/|shorts\/|v=|youtu\.be\/)([^?&#]+)/);
    return m? m[1] : '';
  }
  const videoId = getVideoId(youtubeUrl);
  const siMatch = youtubeUrl.match(/[?&]si=([^&#]+)/);
  const siParam = siMatch? siMatch[1] : '';
  if(videoId){
    overlay.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`;
  }
  overlay.onclick = () => {
    if(!videoId) return;
    const origin = encodeURIComponent(location.origin);
    let src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1&enablejsapi=1&origin=${origin}`;
    if(siParam) src += `&si=${siParam}`;
    iframe.src = src;
    overlay.style.display = 'none';
  };
}

// ==================== PÁGINA ====================
function loadPage(pageUrl){
  const frame = document.getElementById('contentFrame');
  if(!frame) return;
  if(pageUrl){
    frame.src = pageUrl;
  }else{
    frame.srcdoc = '<div style="padding:40px;font-family:sans-serif;color:#666">No hay página configurada para este subtema. Añádela en teoria/data/theory_media.json</div>';
  }
}

// ==================== UI ====================
const ids = getParams();
const btnHome = document.getElementById('btnHome');
const btnCheck = document.getElementById('btnCheck');
const checkLabel = document.getElementById('checkLabel');
const courseNameEl = document.getElementById('courseName');
const titleMainEl = document.getElementById('titleMain');
const breadcrumbEl = document.getElementById('breadcrumb');

btnHome.onclick = () => {
  if(history.length > 1){
    history.back();
  }else{
    window.location.href = '../index.html';
  }
};

function refreshCheck(){
  const completed =!!getProgress('theory', ids);
  btnCheck.classList.toggle('completed', completed);
  checkLabel.textContent = completed? 'Teoría completada' : 'Marcar como completada';
}
btnCheck.onclick = () => {
  const current =!!getProgress('theory', ids);
  setProgress('theory',!current, ids);
  refreshCheck();
};

(async function init(){
  try{
    const coursesData = await loadJSON(COURSES_URL);
    const mediaData = await loadJSON(MEDIA_URL);
    const names = resolveNames(coursesData.courses, ids);
    const media = getMedia(mediaData, ids);
    const courseName = names.courseName;
    const topicName = names.topicName;
    const subName = names.subName;
    courseNameEl.textContent = courseName;
    titleMainEl.textContent = subName? `${topicName} - ${subName}` : topicName;
    breadcrumbEl.textContent = `${courseName} • ${topicName}`;
    initVideo(media.youtube);
    loadPage(media.page);
    refreshCheck();
  }catch(e){
    console.error(e);
  }
})();

window.addEventListener('storage', e => {
  if(e.key === LS_USERS || e.key === 'addison_last_update'){
    initUser();
    refreshCheck();
  }
});