const GestionJerarquia = {
    hijos: [], capacidadesDelegables: [], puedeCrearHijos: false, miNivel: 0,
    iniciar() {
        const appDiv = document.getElementById('app');
        if (!appDiv) return;
        appDiv.innerHTML = `
            <div class="layout-app">
                <header class="app-header">
                    <div class="header-left">
                        <button class="btn-icono" onclick="app.navegar('dashboard')">←</button>
                        <span class="app-titulo">Academia Addison</span>
                    </div>
                    <div class="header-right">
                        <span class="usuario-nombre">${app.usuario?.nombre || 'Usuario'}</span>
                        <button class="btn-icono" onclick="app.cerrarSesion()">🚪</button>
                    </div>
                </header>
                <div class="app-body">
                    <main class="main" id="main">
                        <div class="arbol-header">
                            <h2 class="arbol-titulo">🏛️ Gestión de Jerarquía</h2>
                            <div class="arbol-subtitulo">Sistema de Niveles Infinitos</div>
                        </div>
                        <div id="jerarquia-stats"></div>
                        <div id="jerarquia-acciones"></div>
                        <div id="jerarquia-arbol"><div class="cargando-arbol"><div class="spinner"></div><p>Cargando...</p></div></div>
                    </main>
                </div>
            </div>`;
        this.cargar();
    },
    async cargar() {
        try {
            const [capResp, hijosResp] = await Promise.all([
                jerarquiaServicio.obtenerCapacidadesDelegables(),
                jerarquiaServicio.obtenerMisHijos()
            ]);
            if (capResp.exito) { this.capacidadesDelegables = capResp.capacidades_delegables || []; this.puedeCrearHijos = capResp.puede_crear_hijos || false; }
            if (hijosResp.exito) this.hijos = hijosResp.hijos || [];
            this.renderizar();
        } catch (e) { document.getElementById('jerarquia-arbol').innerHTML = `<div class="estado-vacio"><p>❌ Error: ${e.message}</p><button class="btn-secundario" onclick="GestionJerarquia.cargar()">Reintentar</button></div>`; }
    },
    renderizar() {
        const stats = document.getElementById('jerarquia-stats');
        const acciones = document.getElementById('jerarquia-acciones');
        const arbol = document.getElementById('jerarquia-arbol');
        if (stats) stats.innerHTML = `<div class="stat-card"><span class="stat-numero">${this.hijos.length}</span><span class="stat-label">Usuarios creados</span></div><div class="stat-card"><span class="stat-numero">${this.capacidadesDelegables.length}</span><span class="stat-label">Capacidades para delegar</span></div><div class="stat-card"><span class="stat-numero">${this.puedeCrearHijos ? '👑' : '🔒'}</span><span class="stat-label">${this.puedeCrearHijos ? 'Puedes crear usuarios' : 'No puedes crear usuarios'}</span></div>`;
        if (acciones) acciones.innerHTML = `${this.puedeCrearHijos ? `<button class="btn-primario" onclick="GestionJerarquia.mostrarModalCrear()"><span>➕</span> Crear Nuevo Usuario</button>` : '<span class="badge-limitado">🔒 No puedes crear usuarios</span>'}<button class="btn-secundario" onclick="GestionJerarquia.cargar()">🔄 Actualizar</button>`;
        if (!arbol) return;
        if (this.hijos.length === 0) { arbol.innerHTML = `<div class="estado-vacio"><p>🌱 Aún no has creado usuarios.</p><p class="texto-secundario">Crea tu primer usuario usando el botón superior.</p></div>`; return; }
        const porNivel = {};
        this.hijos.forEach(h => { if (!porNivel[h.nivel]) porNivel[h.nivel] = []; porNivel[h.nivel].push(h); });
        let html = '<div class="arbol-niveles">';
        Object.keys(porNivel).sort((a, b) => a - b).forEach(nivel => {
            html += `<div class="nivel-grupo"><div class="nivel-header"><span class="nivel-badge">Nivel ${nivel}</span><span class="nivel-cantidad">${porNivel[nivel].length} usuarios</span></div><div class="nivel-usuarios">${porNivel[nivel].map(u => this.renderCard(u)).join('')}</div></div>`;
        });
        html += '</div>';
        arbol.innerHTML = html;
    },
    renderCard(u) {
        const caps = (u.capacidades || []).map(c => `<span class="capacidad-tag" title="${c.nombre}">${c.codigo}</span>`).join('');
        return `<div class="usuario-card"><div class="usuario-header"><span class="usuario-nivel">N${u.nivel}</span><span class="usuario-rol">${this.esc(u.nombre_rol || 'Sin rol')}</span>${u.puede_crear_hijos ? '<span class="badge-creador">👑 Creador</span>' : ''}</div><div class="usuario-info"><p class="usuario-email">📧 ${this.esc(u.correo_electronico || u.email || '')}</p><p class="usuario-nombre">👤 ${this.esc(u.nombre_completo || '')}</p></div><div class="usuario-capacidades">${caps || '<span class="sin-capacidades">Sin capacidades</span>'}</div><div class="usuario-acciones"><button class="btn-mini" onclick="GestionJerarquia.editarUsuario(${u.membresia_id})">✏️ Editar</button></div></div>`;
    },
    mostrarModalCrear() {
        const modal = document.createElement('div'); modal.className = 'modal-overlay activo'; modal.id = 'modal-crear-jerarquia';
        const capsHtml = this.capacidadesDelegables.length === 0 ? '<p class="sin-capacidades">No tienes capacidades para delegar.</p>' : this.capacidadesDelegables.map(cap => `<label class="checkbox-capacidad"><input type="checkbox" name="capacidad" value="${cap.capacidad_id}"><div class="capacidad-info"><span class="capacidad-nombre">${cap.nombre}</span>${cap.descripcion ? `<small class="capacidad-desc">${cap.descripcion}</small>` : ''}</div></label>`).join('');
        modal.innerHTML = `<div class="modal-panel modal-panel-arbol"><div class="modal-header"><h3>➕ Crear Nuevo Usuario</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">✕</button></div><form id="form-crear-jerarquia" onsubmit="GestionJerarquia.crear(event)"><div class="campo-formulario"><label>Nombre del Cargo (libre)</label><input type="text" id="crear-nombre-rol" placeholder="Ej: Coordinador Académico..." required><small>No hay roles predefinidos. Pones el nombre que quieras.</small></div><div class="campo-formulario"><label>Email de Google (Firebase)</label><input type="email" id="crear-email" placeholder="usuario@gmail.com" required><small>El usuario debe haber iniciado sesión con Google primero.</small></div><div class="campo-formulario"><label>Nombre Completo (opcional)</label><input type="text" id="crear-nombre-completo" placeholder="Juan Pérez"></div><div class="campo-formulario"><label>Capacidades a Delegar</label><div class="capacidades-container">${capsHtml}</div></div><div class="campo-formulario"><label class="checkbox-label"><input type="checkbox" id="crear-puede-crear-hijos"><span><strong>¿Este usuario puede crear más usuarios?</strong></span></label><small>Si marcas esto, tu hijo podrá crear nietos con sus capacidades.</small></div><div class="modal-acciones"><button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button><button type="submit" class="btn-primario">Crear Usuario</button></div></form></div>`;
        document.body.appendChild(modal);
    },
    cerrarModal() { const m = document.getElementById('modal-crear-jerarquia'); if (m) m.remove(); const m2 = document.getElementById('modal-editar-jerarquia'); if (m2) m2.remove(); },
    async crear(e) { e.preventDefault(); const caps = Array.from(document.querySelectorAll('input[name="capacidad"]:checked')).map(cb => parseInt(cb.value)); const datos = { email: document.getElementById('crear-email').value.trim(), nombre_rol: document.getElementById('crear-nombre-rol').value.trim(), nombre_completo: document.getElementById('crear-nombre-completo').value.trim(), capacidades_ids: caps, puede_crear_hijos: document.getElementById('crear-puede-crear-hijos').checked }; if (!datos.email || !datos.nombre_rol) { app.mostrarToast('Email y nombre del cargo son obligatorios', 'error'); return; } try { const btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; btn.textContent = 'Creando...'; const r = await jerarquiaServicio.crearUsuarioHijo(datos); if (r && r.error) { app.mostrarToast(r.error, 'error'); btn.disabled = false; btn.textContent = 'Crear Usuario'; return; } app.mostrarToast(`✅ ${datos.nombre_rol} creado exitosamente`, 'exito'); this.cerrarModal(); this.cargar(); } catch (err) { app.mostrarToast(`Error: ${err.message}`, 'error'); } },
    async editarUsuario(mid) { const u = this.hijos.find(h => h.membresia_id === mid); if (!u) return; const modal = document.createElement('div'); modal.className = 'modal-overlay activo'; modal.id = 'modal-editar-jerarquia'; modal.innerHTML = `<div class="modal-panel modal-panel-arbol"><div class="modal-header"><h3>✏️ Editar: ${this.esc(u.nombre_rol || 'Usuario')}</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">✕</button></div><form id="form-editar-jerarquia" onsubmit="GestionJerarquia.guardarEdicion(event, ${mid})"><div class="campo-formulario"><label>Capacidades Actuales</label><div class="capacidades-actuales">${(u.capacidades || []).map(c => `<span class="capacidad-tag activa">${c.codigo}</span>`).join('') || '<span class="sin-capacidades">Sin capacidades</span>'}</div></div><div class="campo-formulario"><label class="checkbox-label"><input type="checkbox" id="editar-puede-crear-hijos" ${u.puede_crear_hijos ? 'checked' : ''}><span><strong>¿Puede crear más usuarios?</strong></span></label></div><div class="modal-acciones"><button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button><button type="submit" class="btn-primario">Guardar Cambios</button><button type="button" class="btn-peligro" onclick="GestionJerarquia.eliminarUsuario(${mid})">🗑️ Desactivar</button></div></form></div>`; document.body.appendChild(modal); },
    async guardarEdicion(e, mid) { e.preventDefault(); const datos = { capacidades_ids: [], puede_crear_hijos: document.getElementById('editar-puede-crear-hijos').checked }; try { const r = await jerarquiaServicio.modificarCapacidadesHijo(mid, datos); if (r.exito) { app.mostrarToast('✅ Cambios guardados', 'exito'); this.cerrarModal(); this.cargar(); } else app.mostrarToast(r.error || 'Error', 'error'); } catch (err) { app.mostrarToast(`Error: ${err.message}`, 'error'); } },
    async eliminarUsuario(mid) { const u = this.hijos.find(h => h.membresia_id === mid); if (!u) return; if (!confirm(`¿Desactivar a "${u.nombre_rol || 'este usuario'}"? No podrá acceder.`)) return; try { const r = await jerarquiaServicio.eliminarHijo(mid); if (r.exito) { app.mostrarToast('✅ Desactivado', 'exito'); this.cerrarModal(); this.cargar(); } else app.mostrarToast(r.error || 'Error', 'error'); } catch (err) { app.mostrarToast(`Error: ${err.message}`, 'error'); } },
    esc(t) { if (!t) return ''; return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
};
window.GestionJerarquia = GestionJerarquia;
