const GestionJerarquia = {
    subordinados: [],
    capacidadesDelegables: [],
    puedeCrearHijos: false,
    etiquetasFrecuentes: [],
    miNivel: 0,
    miMembresiaId: null,
    
    async iniciar() {
        const main = document.getElementById('main') || document.getElementById('contenidoPrincipal');
        if (!main) { console.error('[JERARQUIA] No se encontro contenedor principal'); return; }
        
        // Obtener mi info del contexto
        const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo') || '{}');
        const institucionActiva = JSON.parse(localStorage.getItem('institucion_activa') || '{}');
        this.miMembresiaId = usuarioActivo.membresia_id || 1;
        this.miNivel = usuarioActivo.nivel || 0;
        
        main.innerHTML = '<div style="padding:20px;">' +
            '<h2 style="margin-bottom:20px;">Gestion de Jerarquia</h2>' +
            '<div style="background:var(--fondo-secundario);padding:12px 16px;border-radius:8px;margin-bottom:16px;">' +
            '<strong>Tu nivel jerarquico: ' + this.miNivel + '</strong> ' +
            '<span style="color:var(--texto-secundario);">(Solo tu y tus superiores lo ven)</span>' +
            '</div>' +
            '<div id="jerarquia-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;"></div>' +
            '<div id="jerarquia-acciones" style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;"></div>' +
            '<div id="jerarquia-lista"></div>' +
            '</div>';
        
        await this.cargar();
    },
    
    async cargar() {
        try {
            const [capResp, subResp, etiqResp] = await Promise.all([
                jerarquiaServicio.obtenerCapacidadesDelegables(),
                jerarquiaServicio.obtenerSubordinados(),
                jerarquiaServicio.obtenerEtiquetasFrecuentes()
            ]);
            
            if (capResp && capResp.exito) { 
                this.capacidadesDelegables = capResp.capacidades_delegables || []; 
                this.puedeCrearHijos = capResp.puede_crear_hijos || false; 
            }
            if (subResp && subResp.exito) this.subordinados = subResp.subordinados || [];
            if (etiqResp && etiqResp.exito) this.etiquetasFrecuentes = etiqResp.etiquetas || [];
            
            this.renderizar();
        } catch (e) { 
            const lista = document.getElementById('jerarquia-lista');
            if (lista) lista.innerHTML = '<div class="estado-vacio"><p>Error: ' + e.message + '</p><button class="btn-secundario" onclick="GestionJerarquia.cargar()">Reintentar</button></div>'; 
        }
    },
    
    renderizar() {
        const stats = document.getElementById('jerarquia-stats');
        const acciones = document.getElementById('jerarquia-acciones');
        const lista = document.getElementById('jerarquia-lista');
        
        const totalActivos = this.subordinados.length;
        const porNivel = {};
        this.subordinados.forEach(s => { 
            if (!porNivel[s.sub_nivel]) porNivel[s.sub_nivel] = 0; 
            porNivel[s.sub_nivel]++; 
        });
        
        if (stats) stats.innerHTML = 
            '<div class="stat-card"><span class="stat-numero">' + totalActivos + '</span><span class="stat-label">Subordinados</span></div>' +
            '<div class="stat-card"><span class="stat-numero">' + Object.keys(porNivel).length + '</span><span class="stat-label">Niveles</span></div>' +
            '<div class="stat-card"><span class="stat-numero">' + this.capacidadesDelegables.length + '</span><span class="stat-label">Capacidades</span></div>' +
            '<div class="stat-card"><span class="stat-numero">' + (this.puedeCrearHijos ? 'Si' : 'No') + '</span><span class="stat-label">Puede Crear</span></div>';
        
        if (acciones) acciones.innerHTML = 
            (this.puedeCrearHijos ? '<button class="btn-primario" onclick="GestionJerarquia.mostrarModalCrear()">+ Crear Usuario</button>' : '<span class="badge-limitado">Sin permiso</span>') +
            '<button class="btn-secundario" onclick="GestionJerarquia.cargar()">Actualizar</button>';
        
        if (!lista) return;
        
        if (this.subordinados.length === 0) { 
            lista.innerHTML = '<div class="estado-vacio"><p>Aun no tienes subordinados.</p><p class="texto-secundario">Crea tu primer usuario.</p></div>'; 
            return; 
        }
        
        let html = '<table class="tabla-jerarquia">' +
            '<thead><tr>' +
            '<th>Usuario</th>' +
            '<th>Cargo</th>' +
            '<th>Nivel</th>' +
            '<th>Capacidades</th>' +
            '<th>Acciones</th>' +
            '</tr></thead><tbody>';
        
        this.subordinados.forEach(s => {
            const caps = (s.capacidades || []).map(c => '<span class="capacidad-tag">' + c.codigo + '</span>').join('');
            html += '<tr>' +
                '<td><strong>' + this.esc(s.sub_nombre_completo || '') + '</strong><br><small>' + this.esc(s.sub_correo || '') + '</small></td>' +
                '<td>' + this.esc(s.sub_nombre_rol || '') + '</td>' +
                '<td>' + s.sub_nivel + '</td>' +
                '<td>' + (caps || '<span class="sin-capacidades">Ninguna</span>') + '</td>' +
                '<td>' +
                '<button class="btn-mini" onclick="GestionJerarquia.editarSubordinado(' + s.sub_membresia_id + ')">Editar</button>' +
                '<button class="btn-mini btn-peligro" onclick="GestionJerarquia.desactivarSubordinado(' + s.sub_membresia_id + ')">Desactivar</button>' +
                '</td>' +
                '</tr>';
        });
        
        html += '</tbody></table>';
        lista.innerHTML = html;
    },
    
    esc(texto) {
        if (!texto) return '';
        return texto.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    
    mostrarModalCrear() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay activo';
        modal.id = 'modal-crear-jerarquia';
        
        const etiquetasHtml = this.etiquetasFrecuentes.map(e => 
            '<option value="' + this.esc(e.nombre_etiqueta) + '">'
        ).join('');
        
        const capsHtml = this.capacidadesDelegables.length === 0 ? 
            '<p>No tienes capacidades para delegar.</p>' : 
            this.capacidadesDelegables.map(cap => 
                '<label class="checkbox-capacidad"><input type="checkbox" name="capacidad" value="' + cap.capacidad_id + '"> ' + this.esc(cap.nombre) + '</label>'
            ).join('');
        
        modal.innerHTML = '<div class="modal-panel">' +
            '<div class="modal-header"><h3>Crear Nuevo Usuario</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">X</button></div>' +
            '<form id="form-crear-jerarquia" onsubmit="GestionJerarquia.crear(event)">' +
            
            // NOMBRE DEL CARGO
            '<div class="campo-formulario">' +
            '<label>Nombre del Cargo *</label>' +
            '<input list="etiquetas-lista" type="text" id="crear-nombre-rol" placeholder="Ej: Coordinador, Facilitador..." required>' +
            '<datalist id="etiquetas-lista">' + etiquetasHtml + '</datalist>' +
            '<small>Escribe libremente o selecciona de las etiquetas frecuentes</small>' +
            '</div>' +
            
            // EMAIL
            '<div class="campo-formulario">' +
            '<label>Email *</label>' +
            '<input type="email" id="crear-email" placeholder="usuario@email.com" required>' +
            '</div>' +
            
            // NOMBRE COMPLETO
            '<div class="campo-formulario">' +
            '<label>Nombre Completo</label>' +
            '<input type="text" id="crear-nombre-completo" placeholder="Juan Perez">' +
            '</div>' +
            
            // NIVEL JERARQUICO - CAMPO NUEVO CRITICO
            '<div class="campo-formulario">' +
            '<label>Nivel Jerarquico *</label>' +
            '<input type="number" id="crear-nivel" min="' + (this.miNivel + 1) + '" value="' + (this.miNivel + 1) + '" required>' +
            '<small>Debe ser mayor que tu nivel (' + this.miNivel + '). Tu subordinado tendra este nivel.</small>' +
            '</div>' +
            
            // SUPERIOR INMEDIATO - CAMPO NUEVO CRITICO
            '<div class="campo-formulario">' +
            '<label>Superior Inmediato ID *</label>' +
            '<input type="number" id="crear-superior" value="' + this.miMembresiaId + '" required>' +
            '<small>ID de la membresia que sera su superior. Por defecto: tu ID (' + this.miMembresiaId + ')</small>' +
            '</div>' +
            
            // CAPACIDADES
            '<div class="campo-formulario">' +
            '<label>Capacidades a Delegar</label>' +
            '<div class="capacidades-container">' + capsHtml + '</div>' +
            '</div>' +
            
            // PUEDE CREAR HIJOS
            '<div class="campo-formulario">' +
            '<label><input type="checkbox" id="crear-puede-crear-hijos"> Este usuario puede crear mas subordinados</label>' +
            '</div>' +
            
            '<div class="modal-acciones">' +
            '<button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button>' +
            '<button type="submit" class="btn-primario">Crear Usuario</button>' +
            '</div>' +
            '</form></div>';
        
        document.body.appendChild(modal);
    },
    
    async crear(e) {
        e.preventDefault();
        const caps = Array.from(document.querySelectorAll('input[name="capacidad"]:checked')).map(cb => parseInt(cb.value));
        const datos = {
            email: document.getElementById('crear-email').value.trim(),
            nombre_rol: document.getElementById('crear-nombre-rol').value.trim(),
            nombre_completo: document.getElementById('crear-nombre-completo').value.trim(),
            nivel_jerarquico: parseInt(document.getElementById('crear-nivel').value),
            superior_inmediato_id: parseInt(document.getElementById('crear-superior').value),
            capacidades_ids: caps,
            puede_crear_hijos: document.getElementById('crear-puede-crear-hijos').checked
        };
        
        if (!datos.email || !datos.nombre_rol || isNaN(datos.nivel_jerarquico) || isNaN(datos.superior_inmediato_id)) {
            app.mostrarToast('Completa todos los campos obligatorios', 'error');
            return;
        }
        
        // Validacion adicional: nivel debe ser mayor que el mio
        if (datos.nivel_jerarquico <= this.miNivel) {
            app.mostrarToast('El nivel debe ser mayor que el tuyo (' + this.miNivel + ')', 'error');
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
                btn.textContent = 'Crear';
                return;
            }
            
            app.mostrarToast('Usuario creado: ' + datos.nombre_rol + ' (nivel ' + datos.nivel_jerarquico + ')', 'exito');
            this.cerrarModal();
            this.cargar();
        } catch (err) {
            app.mostrarToast('Error: ' + err.message, 'error');
        }
    },
    
    async editarSubordinado(membresiaId) {
        const s = this.subordinados.find(sub => sub.sub_membresia_id === membresiaId);
        if (!s) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay activo';
        modal.id = 'modal-editar-jerarquia';
        
        const capsActuales = (s.capacidades || []).map(c => c.capacidad_id);
        const capsHtml = this.capacidadesDelegables.map(cap => {
            const checked = capsActuales.includes(cap.capacidad_id) ? 'checked' : '';
            return '<label class="checkbox-capacidad"><input type="checkbox" name="capacidad-edit" value="' + cap.capacidad_id + '" ' + checked + '> ' + this.esc(cap.nombre) + '</label>';
        }).join('');
        
        modal.innerHTML = '<div class="modal-panel">' +
            '<div class="modal-header"><h3>Editar: ' + this.esc(s.sub_nombre_rol || 'Usuario') + '</h3><button class="btn-cerrar" onclick="GestionJerarquia.cerrarModal()">X</button></div>' +
            '<form id="form-editar-jerarquia" onsubmit="GestionJerarquia.guardarEdicion(event, ' + membresiaId + ')">' +
            '<div class="campo-formulario"><label>Capacidades</label><div class="capacidades-container">' + capsHtml + '</div></div>' +
            '<div class="campo-formulario"><label><input type="checkbox" id="editar-puede-crear-hijos" ' + (s.sub_puede_crear_hijos ? 'checked' : '') + '> Puede crear mas usuarios</label></div>' +
            '<div class="modal-acciones"><button type="button" class="btn-secundario" onclick="GestionJerarquia.cerrarModal()">Cancelar</button><button type="submit" class="btn-primario">Guardar</button></div>' +
            '</form></div>';
        
        document.body.appendChild(modal);
    },
    
    async guardarEdicion(e, membresiaId) {
        e.preventDefault();
        const caps = Array.from(document.querySelectorAll('input[name="capacidad-edit"]:checked')).map(cb => parseInt(cb.value));
        const datos = {
            capacidades_ids: caps,
            puede_crear_hijos: document.getElementById('editar-puede-crear-hijos').checked
        };
        
        try {
            const r = await jerarquiaServicio.modificarCapacidadesSubordinado(membresiaId, datos);
            if (r.exito) {
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
    
    async desactivarSubordinado(membresiaId) {
        // PROTECCION: No puedes desactivarte a ti mismo
        if (membresiaId === this.miMembresiaId) {
            app.mostrarToast('No puedes desactivarte a ti mismo', 'error');
            return;
        }
        
        if (!confirm('¿Desactivar este usuario?')) return;
        try {
            const r = await jerarquiaServicio.desactivarSubordinado(membresiaId);
            if (r.exito) {
                app.mostrarToast('Usuario desactivado', 'exito');
                this.cargar();
            } else {
                app.mostrarToast(r.error || 'Error', 'error');
            }
        } catch (err) {
            app.mostrarToast('Error: ' + err.message, 'error');
        }
    },
    
    cerrarModal() {
        const m1 = document.getElementById('modal-crear-jerarquia');
        if (m1) m1.remove();
        const m2 = document.getElementById('modal-editar-jerarquia');
        if (m2) m2.remove();
    }
};

window.GestionJerarquia = GestionJerarquia;
