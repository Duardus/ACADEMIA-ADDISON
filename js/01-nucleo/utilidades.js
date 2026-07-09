/* ============================================
   📁 ARCHIVO: utilidades.js
   📂 CAPA: 01-nucleo
   🔗 DEPENDENCIAS: NINGUNA
   📝 CONTRATO:
     - Funciones puras: formatear, validar, generar IDs
     - NUNCA tocan DOM, localStorage, ni fetch
   🚫 NO TOCAR: API calls, Firebase, UI
   ============================================ */

function formatearPorcentaje(valor) {
  const num = parseFloat(valor) || 0;
  return Math.min(100, Math.max(0, num)).toFixed(0);
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function truncarTexto(texto, maximo = 50) {
  if (!texto || texto.length <= maximo) return texto;
  return texto.substring(0, maximo) + '...';
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function esCorreoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function esObjetoVacio(obj) {
  return !obj || Object.keys(obj).length === 0;
}

function clonar(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function debounce(fn, ms = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}
