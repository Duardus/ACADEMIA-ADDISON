const GestionJerarquia = {
    hijos: [],
    capacidadesDelegables: [],
    puedeCrearHijos: false,
    
    async iniciar() {
        const main = document.getElementById('main') || document.getElementById('contenidoPrincipal');
        if (!main) { console.error('[JERARQUIA] No se encontro contenedor principal'); return; }
        
        main.innerHTML = '<div style="padding:20px;"><h2 style="margin-bottom:20px;">Gestion de Jerarquia</h2><div id="jerarquia-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;"></div><div id="jerarquia-acciones" style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;"></div><div id="jerarquia-arbol"></div></div>';
        
        await this.cargar();
    },
    
    async cargar() {
        try {
            const [capResp, hijosResp] = await Promise.all([
                jerarquiaServicio.obtenerCapacidadesDelegables(),
                jerarquiaServicio.obtenerArbolCompleto()
            ]);
            if (capResp && capResp.exito) { 
                this.capacidadesDelegables = capResp.capacidades_delegables || []; 
                this.puedeCrearHijos = capResp.puede_crear_hijos || false; 
            }
            if (hijosResp && hijosResp.exito) this.hijos = hijosResp.arbol || [];
            this.renderizar();
        } catch (e) { 
            const arbol = document.getElementById('jerarquia-arbol');
            if (arbol) arbol.innerHTML = '<div class="estado-vacio"><p>Error: ' + e.message + '</p><button class="btn-secundario" onclick="GestionJerarquia.cargar()">Reintentar</button></div>'; 
        }
    },
    
    renderizar() {
        const stats = document.getElementById('jerarquia-stats');
        const acciones = document.getElementById('jerarquia-acciones');
        const arbol = document.getElementById('jerarquia-arbol');
        
        const totalActivos = this.hijos.filter(h => h.estado_membresia === 'active').length;
        const porNivel = {};
        this.hijos.forEach(h => { if (!porNivel[h.nivel]) porNivel[h.nivel] = 0; porNivel[h.nivel]++; });
        
        if (stats) stats.innerHTML = '<div class="stat-card"><span class="stat-numero">' + totalActivos + '</span><span class="stat-label">Usuarios Activos</span></div><div class="stat-card"><span class="stat-numero">' + Object.keys(porNivel).length + '</span><span class="stat-label">Niveles</span></div><div class="stat-card"><span class="stat-numero">' + this.capacidadesDelegables.length + '</span><span class="stat-label">Capacidades</span></div><div class="stat-card"><span class="stat-numero">' + (this.puedeCrearHijos ? 'Si' : 'No') + '</span><span class="stat-label">Puede Crear</span></div>';
        
        if (acciones) acciones.innerHTML = (this.puedeCrearHijos ? '<button class="btn-primario" onclick="GestionJerarquia.mostrarModalCrear()">+ Crear Usuario</button>' : '<span class="badge-limitado">Sin permiso</span>') + '<button class="btn-secundario" onclick="GestionJerarquia.cargar()">Actualizar</button>';
        
        if (!arbol) return;
        
        if (this.hijos.length === 0) { 
            arbol.innerHTML = '<div class="estado-vacio"><p>Aun no has creado usuarios.</p></div>'; 
            return; 
        }
        
        let html = '<div class="tabla-container"><table class="tabla-usuarios"><thead><tr><th>Usuario</th><th>Rol</th><th>Nivel</th><th>Capacidades</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
        
        this.hijos.forEach(u => {
            const caps = (u.capacidades || []).map(c => '<span class="cap-badge" title="' + this.esc(c.nombre) + '">' + this.esc(c.codigo) + '</span>').join('');
            const estadoBadge = u.estado_membresia === 'active' ? '<span class="badge-activo">Activo</span>' : '<span class="badge-inactivo">Inactivo</span>';
            
            html += '<tr><td><div class="user-info"><div class="user-avatar">' + (u.nombre_completo || u.correo_electronico || '?')[0].toUpperCase() + '</div><div class="user-details"><div class="user-name">' + this.esc(u.nombre_completo || 'Sin nombre') + '</div><div class="user-email">' + this.esc(u.correo_electronico || '') + '</div></div></div></td><td><span class="rol-badge">' + this.esc(u.nombre_rol || 'Sin rol') + '</span></td><td><span class="nivel-badge">N' + u.nivel + '</span></td><td><div class="caps-container">' + (caps || '<span class="sin-caps">Ninguna</span>') + '</div></td><td>' + estadoBadge + '</td><td><button class="btn-editar" onclick="GestionJerarquia.editarUsuario(' + u.membresia_id + ')" title="Editar">Editar</button> <button class="btn-eliminar" onclick="GestionJerarquia.eliminarUsuario(' + u.membresia_id + ')" title="Desactivar">Desactivar</button></td></tr>';
        });
        
        html += '</tbody></table></div>';
        arbol.innerHTML = html;
    },
    
    mostrarModalCrear() {
        const modal = document.createElement('div'); 
        modal.className = 'modal-overlay activo'; 
        modal.id = 'modal-crear-jerarquia';
        
        const capsHtml = this.capacidadesDelegables.length === 0 
            ? '<p class="sin-caps">No tienes capacidades para delegar.</p>' 
            : this.capacidadesDelegables.map(cap => '<label class="checkbox-capacidad"><input type="checkbox" name="capacidad" value="' + cap.capacidad_id + '"><div class="capacidad-info"><span class="capacidad-nombre">' + this.esc(cap.nombre) + '</span>' + (cap.descripcion ? '<small class="capacidad-desc">' + this.esc(cap.descripcion) + '</small>' : '') + '</div></label>').join('');
        
        modal.innerHTML = '<div class="modal-panel modal-panel-arbol"><div class="modal-header"><h3>Crear Nuevo Usuario</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">X</button></div><form id="form-crear-jerarquia" onsubmit="GestionJerarquia.crear(event)"><div class="campo-formulario"><label>Nombre del Cargo</label><input type="text" id="crear-nombre-rol" placeholder="Ej: Coordinador Academico..." required></div><div class="campo-formulario"><label>Email de Google</label><input type="email" id="crear-email" placeholder="usuario@gmail.com" required></div><div class="campo-formulario"><label>Nombre Completo</label><input type="text" id="crear-nombre-completo" placeholder="Juan Perez"></div><div class="campo-formulario"><label>Capacidades</label><div class="capacidades-container">' + capsHtml + '</div></div><div class="campo-formulario"><label class="checkbox-label"><input type="checkbox" id="crear-puede-crear-hijos"><span>Puede crear mas usuarios?</span></label></div><div class="modal-acciones"><button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button><button type="submit" class="btn-primario">Crear Usuario</button></div></form></div>';
        document.body.appendChild(modal);
    },
    
    async editarUsuario(mid) {
        const u = this.hijos.find(h => h.membresia_id === mid);
        if (!u) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay activo';
        modal.id = 'modal-editar-jerarquia';
        
        const capsActuales = (u.capacidades || []).map(c => c.codigo);
        
        const capsHtml = this.capacidadesDelegables.length === 0
            ? '<p class="sin-caps">No tienes capacidades para delegar.</p>'
            : this.capacidadesDelegables.map(cap => {
                const estaMarcada = capsActuales.includes(cap.codigo);
                return '<label class="checkbox-capacidad"><input type="checkbox" name="capacidad_edit" value="' + cap.capacidad_id + '"' + (estaMarcada ? ' checked' : '') + '><div class="capacidad-info"><span class="capacidad-nombre">' + this.esc(cap.nombre) + '</span>' + (cap.descripcion ? '<small class="capacidad-desc">' + this.esc(cap.descripcion) + '</small>' : '') + '</div></label>';
            }).join('');
        
        modal.innerHTML = '<div class="modal-panel modal-panel-arbol"><div class="modal-header"><h3>Editar: ' + this.esc(u.nombre_rol || 'Usuario') + '</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">X</button></div><div class="user-info-edit"><div class="user-avatar-large">' + (u.nombre_completo || u.correo_electronico || '?')[0].toUpperCase() + '</div><div class="user-details-edit"><div class="user-name-large">' + this.esc(u.nombre_completo || 'Sin nombre') + '</div><div class="user-email-large">' + this.esc(u.correo_electronico || '') + '</div><div class="user-rol-large">Rol: ' + this.esc(u.nombre_rol || 'Sin rol') + ' | Nivel: ' + u.nivel + '</div></div></div><form id="form-editar-jerarquia" onsubmit="GestionJerarquia.guardarEdicion(event, ' + mid + ')"><div class="campo-formulario"><label>Capacidades</label><small>Marca/desmarca las capacidades:</small><div class="capacidades-container">' + capsHtml + '</div></div><div class="campo-formulario"><label class="checkbox-label"><input type="checkbox" id="editar-puede-crear-hijos"' + (u.puede_crear_hijos ? ' checked' : '') + '><span>Puede crear mas usuarios?</span></label></div><div class="modal-acciones"><button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button><button type="submit" class="btn-primario">Guardar Cambios</button><button type="button" class="btn-peligro" onclick="GestionJerarquia.eliminarUsuario(' + mid + ')">Desactivar</button></div></form></div>';
        document.body.appendChild(modal);
    },
    
    async guardarEdicion(e, mid) {
        e.preventDefault();
        const caps = Array.from(document.querySelectorAll('input[name="capacidad_edit"]:checked')).map(cb => parseInt(cb.value));
        const datos = { 
            capacidades_ids: caps, 
            puede_crear_hijos: document.getElementById('editar-puede-crear-hijos').checked 
        };
        
        try {
            const r = await jerarquiaServicio.modificarCapacidadesHijo(mid, datos);
            if (r && r.exito) {
                app.mostrarToast('Cambios guardados', 'exito');
                this.cerrarModal();
                this.cargar();
            } else {
                app.mostrarToast(r.error || 'Error', 'error');
            }
        } catch (err) {
            app.mostrarToast('Error: ' + err.message, 'error');
        }
    },
    
    async eliminarUsuario(mid) {
        const u = this.hijos.find(h => h.membresia_id === mid);
        if (!u) return;
        if (!confirm('Desactivar a "' + (u.nombre_rol || 'este usuario') + '"?')) return;
        
        try {
            const r = await jerarquiaServicio.eliminarHijo(mid);
            if (r && r.exito) {
                app.mostrarToast('Desactivado', 'exito');
                this.cerrarModal();
                this.cargar();
            } else {
                app.mostrarToast(r.error || 'Error', 'error');
            }
        } catch (err) {
            app.mostrarToast('Error: ' + err.message, 'error');
        }
    },
    
    cerrarModal() {
        const m = document.getElementById('modal-crear-jerarquia');
        if (m) m.remove();
        const m2 = document.getElementById('modal-editar-jerarquia');
        if (m2) m2.remove();
    },
    
    async crear(e) {
        e.preventDefault();
        const caps = Array.from(document.querySelectorAll('input[name="capacidad"]:checked')).map(cb => parseInt(cb.value));
        const datos = {
            email: document.getElementById('crear-email').value.trim(),
            nombre_rol: document.getElementById('crear-nombre-rol').value.trim(),
            nombre_completo: document.getElementById('crear-nombre-completo').value.trim(),
            capacidades_ids: caps,
            puede_crear_hijos: document.getElementById('crear-puede-crear-hijos').checked
        };
        
        if (!datos.email || !datos.nombre_rol) {
            app.mostrarToast('Email y nombre del cargo son obligatorios', 'error');
            return;
        }
        
        try {
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Creando...';
            
            const r = await jerarquiaServicio.crearUsuarioHijo(datos);
            if (r && r.error) {
                app.mostrarToast(r.error, 'error');
                btn.disabled = false;
                btn.textContent = 'Crear Usuario';
                return;
            }
            
            app.mostrarToast(datos.nombre_rol + ' creado exitosamente', 'exito');
            this.cerrarModal();
            this.cargar();
        } catch (err) {
            app.mostrarToast('Error: ' + err.message, 'error');
        }
    },
    
    esc(t) {
        if (!t) return '';
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};

window.GestionJerarquia = GestionJerarquia;
