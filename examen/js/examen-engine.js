// ============================================================================
//  MOTOR ÚNICO DE EXAMEN - VERSIÓN COMENTADA PARA PRINCIPIANTES
// ============================================================================
//  Hola! Este archivo es el cerebro del examen. Piensa en él como el director
//  de orquesta de una obra de teatro escolar: no toca instrumentos, pero dice
//  quién entra, cuándo, y qué debe pasar en cada escena.
//
//  Qué hace en resumen:
//  1. Lee la URL para saber qué curso/tema se pidió
//  2. Busca un archivo JSON con las preguntas (como buscar una receta en un libro)
//  3. Muestra la pantalla de bienvenida, luego las preguntas una por una
//  4. Controla el tiempo, puntaje y al final muestra resultados
//
//  Glosario rápido:
//  - DOM: es el árbol de elementos HTML de la página. Cuando hacemos
//         document.getElementById, estamos pidiendo "tráeme esa caja de la página".
//  - Array (arreglo/lista): una colección ordenada de cosas, como una lista de compras.
//  - Fetch: pedir datos a un archivo o servidor, como pedir un menú al mesero.
//  - Event: un suceso del usuario, como un clic o pulsar una tecla.
//  - localStorage / sessionStorage: cajitas del navegador para guardar datos pequeños.
// ============================================================================

(function(){

  // --------------------------------------------------------------------------
  //  UTILIDADES BÁSICAS
  // --------------------------------------------------------------------------

  // qs = "query selector" abreviado.
  // Esta función es como un apuntador láser: le dices el id y te devuelve el elemento.
  function qs(id){ 
    return document.getElementById(id); 
  }

  // getParams es como el recepcionista del hotel.
  // Lee la URL (location.search) y extrae los datos que vienen después del "?".
  // Por ejemplo: ?courseId=algebra&topicId=t1
  // Devuelve un objeto con esos valores ya listos para usar.
  function getParams(){
    const p = new URLSearchParams(location.search); // URLSearchParams es un ayudante que parsea la URL
    return {
      courseId: p.get('courseId') || '',   // Si no viene, usamos texto vacío
      topicId: p.get('topicId') || '',
      subId: p.get('subId') || '',
      examKey: p.get('examKey') || '',
      type: p.get('type') || 'exam',
      name: p.get('name') || '',
      courseName: p.get('courseName') || '',
      topicName: p.get('topicName') || '',
      subName: p.get('subName') || ''
    };
  }

  // Guardamos los parámetros una sola vez al iniciar, para no leer la URL todo el rato.
  const EXAM_PARAMS = getParams();

  // --------------------------------------------------------------------------
  //  REFERENCIAS AL DOM
  //  Aquí guardamos en variables los elementos de la página que vamos a usar.
  //  Es como ponerle etiquetas a las cajas antes de empezar a trabajar.
  // --------------------------------------------------------------------------
  const welcome = qs('welcome');
  const results = qs('results');
  const review = qs('review');
  const startBtn = qs('startBtn');
  const nextBtn = qs('nextBtn');
  const optionsEl = qs('options');
  const qMeta = qs('qMeta');
  const qText = qs('qText');
  const explanationEl = qs('explanation');
  const expTxt = qs('expTxt');
  const progressBar = qs('progressBar');
  const timeTxt = qs('timeTxt');
  const timePill = qs('timePill');
  const scoreTxt = qs('scoreTxt');
  const nameInput = qs('nameInput');
  const nameDisplay = qs('nameDisplay');
  const resultsName = qs('resultsName');
  const resultsTitle = qs('resultsTitle');
  const resultsMsg = qs('resultsMsg');
  const scoreWrap = qs('scoreWrap');
  const scoreVal = qs('scoreVal');
  const statCorrect = qs('statCorrect');
  const statWrong = qs('statWrong');
  const statTime = qs('statTime');
  const reviewBtn = qs('reviewBtn');
  const restartBtn = qs('restartBtn');
  const closeReviewBtn = qs('closeReviewBtn');
  const reviewList = qs('reviewList');
  const welcomeTitle = qs('welcomeTitle');
  const resultsExamTitle = qs('resultsExamTitle');
  const welcomeClose = qs('welcomeClose');
  const resultsClose = qs('resultsClose');

  // Tiempo por defecto si el JSON no dice otra cosa: 60 segundos por pregunta.
  const DEFAULT_TIME_PER_QUESTION_SECONDS = 120;

  // --------------------------------------------------------------------------
  //  FUNCIONES DE AYUDA
  // --------------------------------------------------------------------------

  // formatTime es como un reloj digital.
  // Convierte segundos totales a formato mm:ss para que se vea bonito.
  function formatTime(s){
    const m = Math.floor(s/60).toString().padStart(2,'0'); // minutos con 2 dígitos
    const sec = (s%60).toString().padStart(2,'0');         // segundos con 2 dígitos
    return `${m}:${sec}`;
  }

  // shuffleArray mezcla una lista al azar.
  // Analogía: es como barajar cartas. Lo hacemos para que las preguntas no salgan siempre en el mismo orden.
  function shuffleArray(a){
    const arr = a.slice(); // copiamos para no modificar la original
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1)); // elegimos posición aleatoria
      [arr[i],arr[j]] = [arr[j],arr[i]]; // intercambiamos
    }
    return arr;
  }

  // shuffleOptions mezcla las opciones de respuesta de una pregunta.
  // Por qué: así el estudiante no memoriza "la correcta es siempre la B".
  // Mantenemos cuál era la correcta después de mezclar.
  function shuffleOptions(opts, correctIdx){
    // Creamos pares {texto, esCorrecta}
    const paired = opts.map((text,i)=>({text, isCorrect:i===correctIdx}));
    const shuffled = shuffleArray(paired);
    return {
      options: shuffled.map(p=>p.text), // solo los textos mezclados
      correct: shuffled.findIndex(p=>p.isCorrect) // nueva posición de la correcta
    };
  }

  // tryFetchQuestions es el mensajero que va a buscar el JSON.
  // Usa fetch (petición de red) y espera la respuesta.
  async function tryFetchQuestions(url){
    const res = await fetch(url, {cache:'no-store'}); // pedimos el archivo sin usar caché viejo
    if(!res.ok) throw new Error(`HTTP ${res.status}`); // si falla, lanzamos error
    const json = await res.json(); // convertimos texto a objeto JS
    // El JSON puede ser un array directo o un objeto con propiedad questions
    const questions = Array.isArray(json)? json : (Array.isArray(json?.questions)? json.questions : null);
    if(!questions ||!questions.length) throw new Error('JSON sin preguntas');
    // Devolvemos tanto las preguntas como el resto de metadatos
    return {questions, meta: (json &&!Array.isArray(json))? json : {}};
  }

  // buildCandidateUrls construye la lista de rutas donde podría estar el banco.
  // Es como probar varias llaves hasta abrir la puerta correcta.
  function buildCandidateUrls(){
    const c = [];
    if(EXAM_PARAMS.examKey){
      c.push(`data/${EXAM_PARAMS.examKey}.json`);
      c.push(`data/${EXAM_PARAMS.examKey}/questions.json`);
    }
    if(EXAM_PARAMS.courseId && EXAM_PARAMS.topicId && EXAM_PARAMS.subId){
      c.push(`data/questions/${EXAM_PARAMS.courseId}/${EXAM_PARAMS.topicId}/${EXAM_PARAMS.subId}.json`);
    }
    if(EXAM_PARAMS.courseId && EXAM_PARAMS.topicId){
      c.push(`data/questions/${EXAM_PARAMS.courseId}/${EXAM_PARAMS.topicId}.json`);
    }
    c.push('data/questions.json'); // último recurso
    return c;
  }

  // safeText convierte cualquier valor a texto seguro, evitando null/undefined.
  function safeText(v){ return (v==null?'':String(v)); }

  // normalizeQuestions limpia y estandariza las preguntas que vienen del JSON.
  // Por qué: los archivos pueden tener nombres distintos (q/question, exp/explanation).
  // Aquí unificamos todo a un mismo formato interno.
  function normalizeQuestions(raw){
    return raw.map(q=>{
      const topic = safeText(q.topic || '');
      const text = safeText(q.q || q.question || '');
      const options = Array.isArray(q.options)? q.options.map(safeText) : [];
      const correct = Number.isFinite(q.correct)? q.correct : Number(q.correct);
      const exp = safeText(q.exp || q.explanation || '');
      return {topic, q:text, options, correct, exp};
    }).filter(q=>q.q && q.options.length>=2 && Number.isFinite(q.correct)); // quitamos preguntas incompletas
  }

  // --------------------------------------------------------------------------
  //  ESTADO GLOBAL DEL EXAMEN
  //  Aquí guardamos todo lo que cambia mientras el usuario responde.
  // --------------------------------------------------------------------------
  let QUESTIONS = []; // banco original limpio
  let CURRENT = [];   // banco con opciones mezcladas para esta partida
  let TOTAL = 0;      // número total de preguntas
  let TIME_PER_QUESTION_SECONDS = DEFAULT_TIME_PER_QUESTION_SECONDS;
  let DURATION = 0;   // tiempo total del examen en segundos

  let state = {
    name: localStorage.getItem('ava_name') || '', // recordamos nombre entre visitas
    idx: 0,          // índice de pregunta actual
    answers: [],     // respuestas del usuario
    selected: null,
    answered: false,
    startTime: null,
    elapsed: 0,
    timer: null,     // referencia al setInterval del reloj
    finished: false
  };

  // --------------------------------------------------------------------------
  //  ACTUALIZACIÓN DE CABECERAS
  // --------------------------------------------------------------------------

  // updateWelcomeHeader pone el título del examen en la pantalla de bienvenida.
  // Usa datos de la URL o del JSON.
  function updateWelcomeHeader(meta){
    const courseName = safeText(EXAM_PARAMS.courseName || meta?.courseName || meta?.course || '');
    const topicName = safeText(EXAM_PARAMS.topicName || meta?.examTopic || meta?.topic || '');
    const subName = safeText(EXAM_PARAMS.subName || '');
    const fullTitle = subName? `Examen de ${courseName} - ${topicName} - ${subName}` : (topicName? `Examen de ${topicName}` : 'Examen');
    if(welcomeTitle){
      welcomeTitle.textContent = fullTitle;
    }
    if(resultsExamTitle){
      resultsExamTitle.textContent = fullTitle;
    }
    const courseEl = document.querySelector('.course');
    if(courseEl && courseName){
      courseEl.textContent = courseName;
    }
    document.title = fullTitle? `Academia Virtual Addison - ${fullTitle}` : 'Academia Virtual Addison - Examen';
  }

  // updateWelcomeSub muestra "X preguntas · Y minutos" en la bienvenida.
  function updateWelcomeSub(){
    const subEl = document.querySelector('#welcome .sub');
    if(subEl){
      const mins = Math.max(1, Math.round(DURATION/60));
      subEl.textContent = `${TOTAL} preguntas · ${mins} minutos`;
    }
  }

  // buildQuestions prepara la lista que se va a jugar.
  // Si randomizeOrder es true, baraja el orden de preguntas.
  function buildQuestions(randomizeOrder){
    const base = randomizeOrder? shuffleArray(QUESTIONS) : QUESTIONS.slice();
    return base.map(q=>{
      const s = shuffleOptions(q.options, q.correct);
      return {...q, options:s.options, correct:s.correct};
    });
  }

  // --------------------------------------------------------------------------
  //  TEMPORIZADOR
  // --------------------------------------------------------------------------

  // updateTimer se ejecuta cada segundo.
  // Calcula cuánto tiempo queda y actualiza el reloj en pantalla.
  function updateTimer(){
    const now = Date.now();
    state.elapsed = Math.floor((now - state.startTime)/1000);
    const remaining = Math.max(0, DURATION - state.elapsed);
    if(timeTxt) timeTxt.textContent = formatTime(remaining);
    // Si queda menos de 1 minuto, pintamos el tiempo de rojo para avisar
    if(timePill) timePill.style.color = remaining<=60? '#b91c1c' : '';
    if(remaining<=0){
      finishExam(); // tiempo agotado → terminamos
    }
  }

  function startTimer(){
    state.startTime = Date.now();
    updateTimer();
    clearInterval(state.timer);
    state.timer = setInterval(updateTimer, 1000); // ejecuta updateTimer cada 1000 ms
  }

  function stopTimer(){
    clearInterval(state.timer);
    state.timer = null;
  }

  // --------------------------------------------------------------------------
  //  RENDERIZADO DE PREGUNTAS
  // --------------------------------------------------------------------------

  // renderQuestion pinta en pantalla la pregunta actual y sus opciones.
  // Es como montar el escenario antes de que actúe el actor.
  function renderQuestion(){
    const q = CURRENT[state.idx];
    if(!q) return;
    state.selected = null;
    state.answered = false;
    if(nextBtn) nextBtn.disabled = true; // no se puede avanzar sin responder

    if(qMeta) qMeta.textContent = `Pregunta ${state.idx+1} de ${TOTAL}`;
    if(qText) qText.innerHTML = q.q;

    if(optionsEl){
      optionsEl.innerHTML = ''; // limpiamos opciones anteriores
      const letters = ['A','B','C','D','E','F','G'];
      q.options.forEach((opt,i)=>{
        const btn = document.createElement('button');
        btn.className = 'opt';
        btn.setAttribute('role','option');
        btn.innerHTML = `<span class="badge">${letters[i]||i+1}</span><span class="opt-text">${opt}</span><span class="state"></span>`;
        // Cuando el usuario hace clic, llamamos a selectOption
        btn.onclick = ()=> selectOption(i);
        optionsEl.appendChild(btn);
      });
    }

    if(explanationEl) explanationEl.classList.remove('show');
    if(expTxt) expTxt.textContent = 'Selecciona una opción para ver la explicación.';

    updateProgress();
  }

  // selectOption maneja el clic en una opción.
  // Marca correcta/incorrecta, muestra explicación y habilita "Siguiente".
  function selectOption(idx){
    if(state.answered) return; // ya respondió, ignoramos clics extra
    state.answered = true;
    state.selected = idx;
    const q = CURRENT[state.idx];
    state.answers[state.idx] = {choice: idx, correct: idx === q.correct};

    const opts = optionsEl.querySelectorAll('.opt');
    opts.forEach((el,i)=>{
      el.classList.add('disabled');
      const stateSpan = el.querySelector('.state');
      if(i === q.correct){
        el.classList.add('correct');
        if(stateSpan) stateSpan.textContent = '✓';
      }else if(i === idx){
        el.classList.add('wrong');
        if(stateSpan) stateSpan.textContent = '✗';
      }
    });

    if(expTxt) expTxt.innerHTML = q.exp || 'Sin explicación.';
    if(explanationEl) explanationEl.classList.add('show');
    if(nextBtn) nextBtn.disabled = false;
    updateScore();
  }

  function updateProgress(){
    const pct = TOTAL? Math.round(((state.idx)/TOTAL)*100) : 0;
    if(progressBar) progressBar.style.width = pct + '%';
  }

  function updateScore(){
    const correct = state.answers.filter(a=>a?.correct).length;
    if(scoreTxt) scoreTxt.textContent = `${correct} / ${TOTAL}`;
  }

  function nextQuestion(){
    if(state.idx < TOTAL-1){
      state.idx++;
      renderQuestion();
    }else{
      finishExam();
    }
  }

  // --------------------------------------------------------------------------
  //  FINALIZACIÓN
  // --------------------------------------------------------------------------

  // finishExam calcula resultados, guarda progreso y muestra la pantalla final.
  function finishExam(){
    if(state.finished) return;
    stopTimer();
    state.finished = true;

    const correctCount = state.answers.filter(a=>a?.correct).length;
    const percent = TOTAL? Math.round((correctCount/TOTAL)*100) : 0;

    // Guardar resultado en localStorage para que la plataforma lo recoja al volver
    try{
      const payload = {
        courseId: EXAM_PARAMS.courseId,
        topicId: EXAM_PARAMS.topicId,
        subId: EXAM_PARAMS.subId,
        value: percent
      };
      localStorage.setItem('addison_exam_result', JSON.stringify(payload));
      sessionStorage.setItem('examProgress', JSON.stringify({...payload, contentType:'exam'}));
    }catch(e){}


    // Guardamos progreso en sessionStorage para que la plataforma lo lea
    try{
      const data = {
        courseId: EXAM_PARAMS.courseId,
        topicId: EXAM_PARAMS.topicId,
        subId: EXAM_PARAMS.subId,
        contentType: EXAM_PARAMS.type || 'exam',
        value: percent
      };
      sessionStorage.setItem('examProgress', JSON.stringify(data));
    }catch(e){}

    // Actualizamos UI de resultados
    if(scoreWrap) scoreWrap.style.setProperty('--p', percent);
    if(scoreVal) scoreVal.innerHTML = `${percent}<span>%</span>`;
    if(resultsTitle) resultsTitle.innerHTML = `Resultado<br><span style='color:var(--red)'>¡Completado!</span>`;
    if(statCorrect) statCorrect.innerHTML = `${correctCount}<small>/${TOTAL}</small>`;
    if(statWrong) statWrong.innerHTML = `${TOTAL - correctCount}<small>/${TOTAL}</small>`;
    if(statTime) statTime.textContent = formatTime(state.elapsed);
    if(resultsMsg) resultsMsg.textContent = percent>=80? `¡Excelente, ${state.name||'estudiante'}!` : percent>=60? `¡Bien hecho, ${state.name||'estudiante'}!` : `Ánimo, ${state.name||'estudiante'}.`;

    if(state.name && resultsName){
      resultsName.textContent = `Estudiante: ${state.name}`;
      resultsName.style.display = 'block';
    }

    if(results) results.classList.add('active');

    // Avisamos a la ventana padre (si el examen está en un iframe)
    try{
      parent.postMessage({
        type:"progress",
        courseId: EXAM_PARAMS.courseId,
        topicId: EXAM_PARAMS.topicId,
        subId: EXAM_PARAMS.subId,
        contentType: EXAM_PARAMS.type,
        value: percent
      }, "*");
    }catch(e){}
  }

  function restartToWelcome(){
    stopTimer();
    if(results) results.classList.remove('active');
    if(review) review.classList.remove('active');
    if(welcome) welcome.classList.add('active');
    CURRENT = buildQuestions(true); // nueva partida con orden distinto
    state.idx = 0;
    state.answers = Array(TOTAL).fill(null);
    state.finished = false;
    state.elapsed = 0;
    setTimeout(()=>nameInput?.focus(), 50);
  }

  // openReview muestra la lista de preguntas con tu respuesta y la correcta.
  function openReview(){
    if(!reviewList) return;
    reviewList.innerHTML = '';
    const letters = ['A','B','C','D','E','F','G'];
    CURRENT.forEach((q,i)=>{
      const ans = state.answers[i];
      const userLabel = ans? `${letters[ans.choice]||ans.choice+1}) ${q.options[ans.choice]}` : 'Sin responder';
      const correctLabel = `${letters[q.correct]||q.correct+1}) ${q.options[q.correct]}`;
      const item = document.createElement('div');
      item.className = 'review-item';
      item.innerHTML = `
        <div class="review-q"><strong>${i+1}.</strong> ${q.q}</div>
        <div class="review-a"><b>Tu respuesta:</b> ${userLabel}</div>
        <div class="review-c"><b>Correcta:</b> ${correctLabel}</div>
        <div class="review-exp">${q.exp || ''}</div>
      `;
      reviewList.appendChild(item);
    });
    if(review) review.classList.add('active');
    setTimeout(()=>closeReviewBtn?.focus(), 50);
  }

  // startExam inicia la partida después de la bienvenida.
  function startExam(){
    if(startBtn && startBtn.disabled) return;
    const name = (nameInput?.value || '').trim();
    state.name = name;
    if(name) localStorage.setItem('ava_name', name); // recordamos nombre
    state.idx = 0;
    state.answers = Array(TOTAL).fill(null);
    state.finished = false;
    state.elapsed = 0;
    if(welcome) welcome.classList.remove('active');
    if(results) results.classList.remove('active');
    if(review) review.classList.remove('active');
    renderQuestion();
    startTimer();
  }

  function initName(){
    try{
      if(EXAM_PARAMS.name){
        state.name = EXAM_PARAMS.name;
        localStorage.setItem('ava_name', EXAM_PARAMS.name);
      }
    }catch(e){}
    if(state.name && nameInput){
      nameInput.value = state.name;
    }
    if(state.name && nameDisplay){
      nameDisplay.textContent = `Estudiante: ${state.name}`;
      nameDisplay.style.display = 'block';
    }
  }

  // --------------------------------------------------------------------------
  //  BOOTSTRAP - Punto de entrada
  // --------------------------------------------------------------------------

  // bootstrap es el director que pone todo en marcha al cargar la página.
  async function bootstrap(){
    if(startBtn) startBtn.disabled = true; // evitamos clic antes de cargar
    initName();

    const subEl = document.querySelector('#welcome .sub');
    if(subEl) subEl.textContent = 'Cargando preguntas...';

    const candidates = buildCandidateUrls();
    let payload = null;
    // Probamos cada ruta hasta encontrar una que funcione
    for(const url of candidates){
      try{
        payload = await tryFetchQuestions(url);
        break;
      }catch(e){}
    }

    const raw = payload?.questions || [];
    const meta = payload?.meta || {};
    QUESTIONS = normalizeQuestions(raw);

    // Filtrado opcional por parámetros
    if(EXAM_PARAMS.courseId || EXAM_PARAMS.topicName || EXAM_PARAMS.subName){
      const cId = EXAM_PARAMS.courseId;
      const tId = EXAM_PARAMS.topicId;
      const sId = EXAM_PARAMS.subId;
      const tName = (EXAM_PARAMS.topicName||'').toLowerCase();
      const sName = (EXAM_PARAMS.subName||'').toLowerCase();
      QUESTIONS = QUESTIONS.filter(q=>{
        if(q.courseId && cId && q.courseId!== cId) return false;
        if(q.topicId && tId && q.topicId!== tId) return false;
        if(q.subId && sId && q.subId!== sId) return false;
        if(tName && q.topic &&!q.topic.toLowerCase().includes(tName)) return false;
        if(sName && q.subtopic &&!q.subtopic.toLowerCase().includes(sName)) return false;
        return true;
      });
    }

    if(!QUESTIONS.length){
      if(subEl) subEl.textContent = 'No hay preguntas disponibles para este examen.';
      return;
    }

    TIME_PER_QUESTION_SECONDS = Number(meta?.timePerQuestionSeconds) > 0? Number(meta.timePerQuestionSeconds) : DEFAULT_TIME_PER_QUESTION_SECONDS;
    TOTAL = QUESTIONS.length;
    DURATION = TOTAL * TIME_PER_QUESTION_SECONDS;
    CURRENT = buildQuestions(false);
    state.answers = Array(TOTAL).fill(null);

    updateWelcomeHeader(meta);
    updateWelcomeSub();
    if(startBtn) startBtn.disabled = false;
  }

  // --------------------------------------------------------------------------
  //  EVENTOS
  // --------------------------------------------------------------------------
  startBtn?.addEventListener('click', startExam);
  nextBtn?.addEventListener('click', ()=>{ if(state.answered) nextQuestion(); });
  reviewBtn?.addEventListener('click', openReview);
  restartBtn?.addEventListener('click', restartToWelcome);
  closeReviewBtn?.addEventListener('click', ()=>{ review?.classList.remove('active'); restartBtn?.focus(); });
  welcomeClose?.addEventListener('click', ()=>{
    const ret = sessionStorage.getItem('examReturnUrl') || '../index.html';
    window.location.href = ret;
  });
  resultsClose?.addEventListener('click', ()=>{
    const ret = sessionStorage.getItem('examReturnUrl') || '../index.html';
    window.location.href = ret;
  });

  // Atajos de teclado para accesibilidad
  document.addEventListener('keydown', (e)=>{
    const welcomeActive = welcome?.classList.contains('active');
    const resultsActive = results?.classList.contains('active');
    const reviewActive = review?.classList.contains('active');
    if(welcomeActive){
      if(e.key==='Enter'){
        e.preventDefault();
        if(!(startBtn && startBtn.disabled)) startExam();
      }
      return;
    }
    if(reviewActive && e.key==='Escape'){
      e.preventDefault();
      review.classList.remove('active');
      restartBtn?.focus();
      return;
    }
    if(resultsActive && (e.key==='Escape' || e.key==='Enter')){
      if(e.key==='Escape'){ e.preventDefault(); restartToWelcome(); }
      return;
    }
    if(!welcomeActive &&!resultsActive &&!reviewActive){
      const letters = ['a','b','c','d','e','f','g'];
      const key = e.key.toLowerCase();
      if(!state.answered){
        let idx = letters.indexOf(key);
        if(idx===-1 && /^[1-7]$/.test(key)){
          idx = parseInt(key)-1;
        }
        if(idx>=0 && optionsEl){
          const opts = optionsEl.querySelectorAll('.opt');
          if(idx < opts.length){
            e.preventDefault();
            opts[idx].click();
            return;
          }
        }
      }else{
        if(key==='enter' || key==='arrowright'){
          e.preventDefault();
          nextQuestion();
        }
      }
    }
  });

  // ¡Arrancamos!
  bootstrap();
})();