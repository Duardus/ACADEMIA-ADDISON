// WHITEBOARD - Pizarra colaborativa Samsung Notes style
(() => {
  const canvas = document.getElementById('whiteboard');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let currentColor = '#FFEB3B';
  let currentTool = 'pen';
  let lineWidth = 3;
  let lastPoint = null;

  function resizeCanvas(){
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#000000';
    ctx.fillRect(0,0,rect.width,rect.height);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Paleta
  document.querySelectorAll('.color-dot').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.color-dot').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentColor = btn.dataset.color;
      if(btn.id === 'btnMoreColors'){
        const color = prompt('Ingresa código HEX (ej: #FF00FF):', currentColor);
        if(color) currentColor = color;
      }
    });
    let pressTimer;
    btn.addEventListener('pointerdown', ()=>{
      pressTimer = setTimeout(()=>{
        const color = prompt('Color personalizado HEX:', currentColor);
        if(color){
          btn.dataset.color = color;
          btn.style.background = color;
          btn.click();
        }
      }, 600);
    });
    btn.addEventListener('pointerup', ()=>clearTimeout(pressTimer));
    btn.addEventListener('pointerleave', ()=>clearTimeout(pressTimer));
  });

  // Herramientas
  const toolPen = document.getElementById('toolPen');
  const toolHighlighter = document.getElementById('toolHighlighter');
  const toolEraser = document.getElementById('toolEraser');
  const toolClear = document.getElementById('toolClear');

  function setTool(tool){
    currentTool = tool;
    [toolPen, toolHighlighter, toolEraser].forEach(b=>b?.classList.remove('active'));
    if(tool==='pen') toolPen?.classList.add('active');
    if(tool==='highlighter') toolHighlighter?.classList.add('active');
    if(tool==='eraser') toolEraser?.classList.add('active');
  }
  toolPen?.addEventListener('click', ()=>setTool('pen'));
  toolHighlighter?.addEventListener('click', ()=>setTool('highlighter'));
  toolEraser?.addEventListener('click', ()=>setTool('eraser'));
  toolClear?.addEventListener('click', ()=>{
    if(confirm('¿Limpiar toda la pizarra?')){
      const rect = canvas.getBoundingClientRect();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0,0,rect.width,rect.height);
    }
  });

  function getPoint(e){
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 0.5
    };
  }

  canvas.addEventListener('pointerdown', (e)=>{
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isDrawing = true;
    lastPoint = getPoint(e);
  });

  canvas.addEventListener('pointermove', (e)=>{
    if(!isDrawing) return;
    const point = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);

    if(currentTool === 'eraser'){
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 30;
    }else if(currentTool === 'highlighter'){
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 20;
    }else{
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.globalAlpha = 1;
      const pressure = Math.max(0.1, point.pressure);
      ctx.lineWidth = lineWidth + pressure * 4;
    }
    ctx.stroke();
    lastPoint = point;
  });

  function endDraw(){
    isDrawing = false;
    lastPoint = null;
    ctx.globalAlpha = 1;
  }
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  canvas.addEventListener('pointerleave', endDraw);

  window.whiteboard = {
    clear: ()=>toolClear.click(),
    setColor: (c)=>{currentColor=c},
    setTool
  };
})();