/* ============================================
   ARCHIVO: arbol.ui.js
   MODULO: arbol
   CONTRATO:
     - Solo renderizado del árbol académico
     - Recibe datos planos, NUNCA hace fetch
   ============================================ */

function renderizarArbol({ arbol, onEditar, onEliminar, onClonar, onVolver, onCrearCurso }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>🌳 Árbol Académico</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearCurso">+ Curso</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="arbolContenido"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  if (onCrearCurso) {
    document.getElementById('btnCrearCurso').addEventListener('click', onCrearCurso);
  }

  const contenedor = document.getElementById('arbolContenido');
  if (!arbol || arbol.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay cursos creados. Haz click en "+ Curso" para crear uno.</p>';
    return;
  }

  arbol.forEach((curso) => {
    const divCurso = document.createElement('div');
    divCurso.className = 'tarjeta';
    divCurso.style.marginBottom = '16px';
    divCurso.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="font-size:16px;">📘 ${curso.nombre}</strong>
        <div style="display:flex;gap:6px;">
          <button class="btn-icono" data-accion="editar" data-tipo="curso" data-id="${curso.curso_id}" title="Editar">✏️</button>
          <button class="btn-icono" data-accion="clonar" data-tipo="curso" data-id="${curso.curso_id}" title="Clonar">📋</button>
          <button class="btn-icono" data-accion="eliminar" data-tipo="curso" data-id="${curso.curso_id}" title="Eliminar" style="color:var(--error);">🗑️</button>
        </div>
      </div>
      <div style="padding-left:16px;border-left:2px solid var(--borde);">
        ${renderizarTemas(curso.hijos || [])}
      </div>
      <button class="btn btn-sm btn-secundario" style="margin-top:8px;" data-accion="crear-tema" data-curso="${curso.curso_id}">+ Tema</button>
    `;
    contenedor.appendChild(divCurso);
  });

  contenedor.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, tipo, id, curso } = btn.dataset;
    if (accion === 'editar') onEditar(tipo, id);
    if (accion === 'eliminar') onEliminar(tipo, id);
    if (accion === 'clonar') onClonar(tipo, id);
    if (accion === 'crear-tema') onEditar('tema', null, curso);
  });
}

function renderizarTemas(temas) {
  if (!temas || temas.length === 0) return '<p style="color:var(--texto-secundario);font-size:12px;">Sin temas</p>';
  return temas.map(t => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;background:var(--fondo-secundario);border-radius:var(--radio-borde-sm);">
        <span style="font-weight:500;">📑 ${t.nombre}</span>
        <div style="display:flex;gap:4px;">
          <button class="btn-icono" data-accion="editar" data-tipo="tema" data-id="${t.tema_id}" title="Editar">✏️</button>
          <button class="btn-icono" data-accion="eliminar" data-tipo="tema" data-id="${t.tema_id}" title="Eliminar" style="color:var(--error);">🗑️</button>
        </div>
      </div>
      <div style="padding-left:16px;margin-top:4px;">
        ${renderizarSubtemas(t.hijos || [])}
      </div>
      <button class="btn btn-xs btn-secundario" style="margin-top:4px;margin-left:16px;" data-accion="crear-subtema" data-tema="${t.tema_id}">+ Subtema</button>
    </div>
  `).join('');
}

function renderizarSubtemas(subtemas) {
  if (!subtemas || subtemas.length === 0) return '<p style="color:var(--texto-secundario);font-size:11px;">Sin subtemas</p>';
  return subtemas.map(s => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--superficie);border-radius:var(--radio-borde-xs);margin-bottom:3px;">
      <span style="font-size:13px;">📄 ${s.nombre}</span>
      <div style="display:flex;gap:4px;">
        <button class="btn-icono" data-accion="editar" data-tipo="subtema" data-id="${s.subtema_id}" title="Editar">✏️</button>
        <button class="btn-icono" data-accion="eliminar" data-tipo="subtema" data-id="${s.subtema_id}" title="Eliminar" style="color:var(--error);">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderizarModalCrear({ tipo, cursoId, temaId, onGuardar, onCancelar }) {
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const titulos = { curso: 'Nuevo Curso', tema: 'Nuevo Tema', subtema: 'Nuevo Subtema' };
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalArbol';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:400px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">${titulos[tipo] || 'Nuevo'}</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre *</label>
        <input type="text" id="inputNombreArbol" class="input" placeholder="Nombre..." style="width:100%;margin-bottom:12px;">
        ${tipo === 'curso' ? `
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Descripción</label>
        <textarea id="inputDescArbol" class="input" placeholder="Descripción..." style="width:100%;min-height:60px;resize:vertical;"></textarea>
        ` : ''}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelarArbol">Cancelar</button>
        <button class="btn" id="btnGuardarArbol">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelarArbol').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardarArbol').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombreArbol').value.trim();
    const descripcion = tipo === 'curso' ? (document.getElementById('inputDescArbol')?.value.trim() || '') : '';
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    modal.remove();
    onGuardar({ nombre, descripcion, curso_id: cursoId, tema_id: temaId });
  });
}
