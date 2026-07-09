/* ============================================
   📁 ARCHIVO: arbol.ui.js
   📂 MÓDULO: arbol
   🔗 DEPENDENCIAS: utilidades.js (01-nucleo)
   📝 CONTRATO:
     - Solo renderizado del árbol académico
     - Recibe datos planos, NUNCA hace fetch
   ============================================ */

function renderizarArbol({ arbol, onEditar, onEliminar, onClonar, onVolver, onCrearGrupo }) {
  // Limpiar modales previos
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="padding:20px;max-width:1200px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2>🌳 Árbol Académico</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnCrearGrupo">+ Grupo</button>
          <button class="btn btn-sm btn-secundario" id="btnVolver">← Volver</button>
        </div>
      </div>
      <div id="arbolContenido"></div>
    </div>
  `;

  document.getElementById('btnVolver').addEventListener('click', onVolver);
  if (onCrearGrupo) {
    document.getElementById('btnCrearGrupo').addEventListener('click', onCrearGrupo);
  }

  const contenedor = document.getElementById('arbolContenido');
  if (!arbol || arbol.length === 0) {
    contenedor.innerHTML = '<p style="color:var(--texto-secundario);">No hay grupos creados. Haz click en "+ Grupo" para crear uno.</p>';
    return;
  }

  arbol.forEach((grupo) => {
    const divGrupo = document.createElement('div');
    divGrupo.className = 'tarjeta';
    divGrupo.style.marginBottom = '16px';
    divGrupo.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="font-size:16px;">📁 ${grupo.nombre_grupo || grupo.nombre}</strong>
        <div style="display:flex;gap:6px;">
          <button class="btn-icono" data-accion="editar" data-tipo="grupo" data-id="${grupo.grupo_id || grupo.id}" title="Editar">✏️</button>
          <button class="btn-icono" data-accion="clonar" data-tipo="grupo" data-id="${grupo.grupo_id || grupo.id}" title="Clonar">📋</button>
          <button class="btn-icono" data-accion="eliminar" data-tipo="grupo" data-id="${grupo.grupo_id || grupo.id}" title="Eliminar" style="color:var(--error);">🗑️</button>
        </div>
      </div>
      <div style="padding-left:16px;border-left:2px solid var(--borde);">
        ${renderizarCursos(grupo.hijos || grupo.cursos || [])}
      </div>
      <button class="btn btn-sm btn-secundario" style="margin-top:8px;" data-accion="crear-curso" data-grupo="${grupo.grupo_id || grupo.id}">+ Curso</button>
    `;
    contenedor.appendChild(divGrupo);
  });

  // Event delegation para botones de acción
  contenedor.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, tipo, id, grupo } = btn.dataset;
    if (accion === 'editar') onEditar(tipo, id);
    if (accion === 'eliminar') onEliminar(tipo, id);
    if (accion === 'clonar') onClonar(tipo, id);
    if (accion === 'crear-curso') onEditar('curso', null, grupo);
  });
}

function renderizarCursos(cursos) {
  if (!cursos || cursos.length === 0) return '<p style="color:var(--texto-secundario);font-size:12px;">Sin cursos</p>';
  return cursos.map(c => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--fondo-secundario);border-radius:var(--radio-borde-sm);margin-bottom:6px;">
      <span>📘 ${c.nombre_curso || c.nombre}</span>
      <div style="display:flex;gap:4px;">
        <button class="btn-icono" data-accion="editar" data-tipo="curso" data-id="${c.curso_id || c.id}" title="Editar">✏️</button>
        <button class="btn-icono" data-accion="eliminar" data-tipo="curso" data-id="${c.curso_id || c.id}" title="Eliminar" style="color:var(--error);">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderizarModalCrear({ tipo, grupoId, onGuardar, onCancelar }) {
  // Limpiar modales previos
  document.querySelectorAll('.modal').forEach(m => m.remove());

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'modalArbol';
  modal.innerHTML = `
    <div class="modal-tarjeta" style="max-width:400px;background:var(--superficie);border:1px solid var(--borde);border-radius:var(--radio-borde);padding:22px;">
      <h3 style="margin:0 0 16px;font-size:20px;">${tipo === 'grupo' ? 'Nuevo Grupo' : 'Nuevo Curso'}</h3>
      <div style="margin:16px 0;">
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin-bottom:4px;">Nombre</label>
        <input type="text" id="inputNombre" class="input" placeholder="Nombre..." style="width:100%;">
        ${tipo === 'curso' ? `
        <label style="display:block;font-size:12px;color:var(--texto-secundario);margin:12px 0 4px;">Descripción</label>
        <textarea id="inputDescripcion" class="input" placeholder="Descripción..." style="width:100%;min-height:60px;resize:vertical;"></textarea>
        ` : ''}
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secundario" id="btnCancelar">Cancelar</button>
        <button class="btn" id="btnGuardar">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btnCancelar').addEventListener('click', () => {
    modal.remove();
    onCancelar();
  });
  document.getElementById('btnGuardar').addEventListener('click', () => {
    const nombre = document.getElementById('inputNombre').value.trim();
    const descripcion = tipo === 'curso' ? document.getElementById('inputDescripcion').value.trim() : '';
    if (!nombre) {
      alert('El nombre es obligatorio');
      return;
    }
    modal.remove();
    onGuardar({ nombre, descripcion, grupo_id: grupoId });
  });
}
