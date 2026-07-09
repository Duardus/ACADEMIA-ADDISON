/* ============================================
   📁 ARCHIVO: arbol.api.js
   📂 MÓDULO: arbol
   🔗 DEPENDENCIAS: peticiones.js (01-nucleo)
   📝 CONTRATO:
     - CRUD del árbol académico
     - NO toca DOM, NO toca localStorage
   ============================================ */

async function apiObtenerArbolCompleto() {
  return get('/arbol');
}

async function apiCrearGrupo(datos) {
  return post('/arbol/grupos', datos);
}

async function apiCrearCurso(datos) {
  return post('/arbol/cursos', datos);
}

async function apiActualizarNodo(tipo, id, datos) {
  return put(`/arbol/${tipo}/${id}`, datos);
}

async function apiEliminarNodo(tipo, id, motivo) {
  return del(`/arbol/${tipo}/${id}`, { motivo_eliminacion: motivo });
}

async function apiClonarNodo(tipo, id) {
  return post(`/arbol/${tipo}/${id}/clonar`);
}
