// ═══════════════════════════════════════════════════════════════════════════
// ACADEMIA-ADDISON — Servicio del Arbol Academico
// Ensambla la jerarquia: Grupos -> Cursos -> Temas -> Subtemas -> Teorias -> Materiales
// FIX: Resuelve el endpoint /api/v1/arbol que causaba "Failed to fetch"
// ═══════════════════════════════════════════════════════════════════════════

const arbolRepositorio = require('../repositorios/arbol.repositorio');
const { ErrorValidacion } = require('../utilidades/errores');

function ensamblarArbol(filasPlanas) {
  const grupos = new Map();
  const cursos = new Map();
  const temas = new Map();
  const subtemas = new Map();
  const teorias = new Map();

  for (const fila of filasPlanas) {
    // Grupo
    if (!grupos.has(fila.grupo_id)) {
      grupos.set(fila.grupo_id, {
        id: fila.grupo_id,
        nombre: fila.grupo_nombre,
        orden: fila.grupo_orden,
        cursos: [],
      });
    }

    // Curso
    if (fila.curso_id && !cursos.has(fila.curso_id)) {
      const curso = {
        id: fila.curso_id,
        titulo: fila.curso_titulo,
        slug: fila.curso_slug,
        orden: fila.curso_orden,
        temas: [],
      };
      cursos.set(fila.curso_id, curso);
      grupos.get(fila.grupo_id).cursos.push(curso);
    }

    // Tema
    if (fila.tema_id && !temas.has(fila.tema_id)) {
      const tema = {
        id: fila.tema_id,
        titulo: fila.tema_titulo,
        orden: fila.tema_orden,
        subtemas: [],
      };
      temas.set(fila.tema_id, tema);
      if (fila.curso_id) {
        cursos.get(fila.curso_id).temas.push(tema);
      }
    }

    // Subtema
    if (fila.subtema_id && !subtemas.has(fila.subtema_id)) {
      const subtema = {
        id: fila.subtema_id,
        titulo: fila.subtema_titulo,
        orden: fila.subtema_orden,
        teorias: [],
      };
      subtemas.set(fila.subtema_id, subtema);
      if (fila.tema_id) {
        temas.get(fila.tema_id).subtemas.push(subtema);
      }
    }

    // Teoria
    if (fila.teoria_id && !teorias.has(fila.teoria_id)) {
      const teoria = {
        id: fila.teoria_id,
        titulo: fila.teoria_titulo,
        orden: fila.teoria_orden,
        materiales: [],
      };
      teorias.set(fila.teoria_id, teoria);
      if (fila.subtema_id) {
        subtemas.get(fila.subtema_id).teorias.push(teoria);
      }
    }

    // Material
    if (fila.material_id) {
      const material = {
        id: fila.material_id,
        titulo: fila.material_titulo,
        tipo: fila.material_tipo,
        url: fila.material_url,
        orden: fila.material_orden,
      };
      if (fila.teoria_id) {
        teorias.get(fila.teoria_id).materiales.push(material);
      }
    }
  }

  return Array.from(grupos.values());
}

async function obtenerArbol(institucionId) {
  if (!institucionId) {
    throw new ErrorValidacion('institucion_id es requerido');
  }

  const resultado = await arbolRepositorio.obtenerArbolCompleto(institucionId);
  const arbol = ensamblarArbol(resultado.rows);

  return {
    exito: true,
    mensaje: 'Arbol academico obtenido',
    datos: arbol,
  };
}

async function obtenerGrupos(institucionId) {
  const resultado = await arbolRepositorio.obtenerGrupos(institucionId);
  return {
    exito: true,
    mensaje: 'Grupos obtenidos',
    datos: resultado.rows,
  };
}

module.exports = {
  obtenerArbol,
  obtenerGrupos,
  ensamblarArbol,
};
