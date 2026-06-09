// tools/sync.js
// Sincroniza data/courses.json -> teoria/data/theory_media.json + paginas autocontenidas + examen con preguntas de relleno
// NO sobrescribe lo que ya existe

const fs = require('fs');
const path = require('path');

const COURSES_PATH = 'data/courses.json';
const THEORY_PATH = 'teoria/data/theory_media.json';
const QUESTIONS_BASE = 'examen/data/questions';
const PAGINAS_DIR = 'teoria/paginas';

function load(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return fallback; }
}
function save(p, data) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

const courses = load(COURSES_PATH, { courses: [] });
const theory = load(THEORY_PATH, {});

fs.mkdirSync(path.dirname(THEORY_PATH), { recursive: true });
fs.mkdirSync(PAGINAS_DIR, { recursive: true });
fs.mkdirSync(QUESTIONS_BASE, { recursive: true });

let newTheory = 0, newPages = 0, newExams = 0;

for (const c of courses.courses || []) {
  const cid = c.id; if (!cid) continue;
  theory[cid] = theory[cid] || {};

  for (const t of c.topics || []) {
    const tid = t.id; if (!tid) continue;
    theory[cid][tid] = theory[cid][tid] || {};

    for (const s of t.subtopics || []) {
      const sid = s.id; if (!sid) continue;

      // 1. TEORÍA
      if (!theory[cid][tid][sid]) {
        theory[cid][tid][sid] = {
          youtube: '',
          page: `paginas/${cid}_${tid}_${sid}.html`
        };
        newTheory++;
      }

      // 2. PÁGINA HTML AUTOCONTENIDA
      const pageFile = path.join(PAGINAS_DIR, `${cid}_${tid}_${sid}.html`);
      if (!fs.existsSync(pageFile)) {
        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.name} - ${t.name} - ${s.name}</title>
<style>
  :root{--brand:#D30000;--bg:#fff;--text:#1F2328;--muted:#6B7280;--border:#F0D6E0;--card:#fff}
  @media (prefers-color-scheme:dark){
    :root{--bg:#0F141D;--text:#E5EAF1;--muted:#9CA9B9;--border:#334155;--card:#1A2230}
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6}
.wrap{max-width:900px;margin:0 auto;padding:24px}
  h1{color:var(--brand);margin:0 0 8px;font-size:28px}
.meta{color:var(--muted);font-weight:600;margin-bottom:24px}
.card{border:1px solid var(--border);border-radius:16px;padding:20px;background:var(--card)}
</style>
</head>
<body>
  <div class="wrap">
    <h1>${c.name}</h1>
    <div class="meta">${t.name} • ${s.name}</div>
    <div class="card">
      <h2>Teoría</h2>
      <p>Reemplaza este texto con tu contenido.</p>
      <h2>Juego / Actividad</h2>
      <p>Tu juego interactivo aquí.</p>
      <div id="app"></div>
    </div>
  </div>
<script>
  (function(){ const app=document.getElementById('app'); })();
</script>
</body>
</html>`;
        fs.writeFileSync(pageFile, html, 'utf8');
        newPages++;
      }

      // 3. EXAMEN JSON con preguntas de relleno
      const examDir = path.join(QUESTIONS_BASE, cid, tid);
      const examFile = path.join(examDir, `${sid}.json`);
      if (!fs.existsSync(examFile)) {
        fs.mkdirSync(examDir, { recursive: true });
        const examData = {
          courseId: cid,
          topicId: tid,
          subId: sid,
          courseName: c.name,
          examTopic: t.name,
          subName: s.name,
          timePerQuestionSeconds: 60,
          questions: [
            {
              q: `Pregunta 1 de ${s.name}`,
              options: ["Opción A","Opción B","Opción C","Opción D"],
              correct: 0,
              exp: "Explicación de ejemplo 1."
            },
            {
              q: `Pregunta 2 de ${s.name}`,
              options: ["Opción A","Opción B","Opción C","Opción D"],
              correct: 1,
              exp: "Explicación de ejemplo 2."
            },
            {
              q: `Pregunta 3 de ${s.name}`,
              options: ["Opción A","Opción B","Opción C","Opción D"],
              correct: 2,
              exp: "Explicación de ejemplo 3."
            }
          ]
        };
        fs.writeFileSync(examFile, JSON.stringify(examData, null, 2), 'utf8');
        newExams++;
      }
    }
  }
}

save(THEORY_PATH, theory);

console.log('✓ Sincronización completada');
console.log(` Teoría nuevas: ${newTheory}`);
console.log(` Páginas creadas: ${newPages}`);
console.log(` Exámenes nuevos: ${newExams}`);