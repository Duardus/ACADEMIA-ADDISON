const GestionJerarquia = {
    subordinados: [],
    capacidadesDelegables: [],
    puedeCrearHijos: false,
    etiquetasFrecuentes: [],
    miNivel: 0,
    miMembresiaId: null,
    
    async iniciar() {
        const appDiv = document.getElementById('app');
        if (!appDiv) { console.error('[JERARQUIA] No se encontro #app'); return; }
        
        const usuarioActivo = JSON.parse(localStorage.getItem('usuario_activo') || '{}');
        const institucionActiva = JSON.parse(localStorage.getItem('institucion_activa') || '{}');
        this.miMembresiaId = usuarioActivo.membresia_id || 1;
        this.miNivel = usuarioActivo.nivel || 0;
        
        appDiv.innerHTML = `
            <div class="layout-app">
                <header class="app-header">
                    <div class="header-left">
                        <button class="btn-icono" onclick="app.mostrarDashboard()" title="Volver al dashboard" style="font-size:1.2rem;">←</button>
                        <span class="app-titulo">Academia Addison</span>
                    </div>
                    <div class="header-right">
                        <span class="usuario-nombre">${app.usuario?.nombre || 'Usuario'}</span>
                        <button class="btn-icono" onclick="app.cerrarSesion()">🚪</button>
                    </div>
                </header>
                <div class="app-body">
                    <main class="main" id="main">
                        <div style="padding:20px;">
                            <h2 style="margin-bottom:20px;">🏛️ Gestion de Jerarquia</h2>
                            <div style="background:var(--fondo-secundario);padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                                <strong>Tu nivel jerarquico: ${this.miNivel}</strong>
                                <span style="color:var(--texto-secundario);"> (Solo tu y tus superiores lo ven)</span>
                            </div>
                            <div id="jerarquia-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:20px;"></div>
                            <div id="jerarquia-acciones" style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;"></div>
                            <div id="jerarquia-lista"></div>
                        </div>
                    </main>
                </div>
            </div>
        `;
        
        await this.cargar();
    },
    
    async cargar() {
        try {
            // FIX: Usar api directo (ya desempaqueta { exito, datos })
            const [capResp, subResp, etiqResp] = await Promise.all([
                api.listarMisSubordinados(),
                api.listarMisSubordinados(), // Mismo endpoint, el backend filtra
                api._llamar('/jerarquia/etiquetas') // Fallback directo
            ]);
            
            // api.servicio.js ya desempaqueta — no necesitamos .exito
            this.capacidadesDelegables = capResp?.capacidades_delegables || [];
            this.puedeCrearHijos = capResp?.puede_crear_hijos || false;
            this.subordinados = subResp?.subordinados || [];
            this.etiquetasFrecuentes = etiqResp?.etiquetas || [];
            
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
        
        let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
        this.subordinados.forEach(s => {
            html += this.renderizarSubordinado(s);
        });
        html += '</div>';
        lista.innerHTML = html;
    },
    
    renderizarSubordinado(s) {
        const caps = s.capacidades || [];
        const capsHtml = caps.length > 0 
            ? caps.map(c => '<span class="badge-capacidad">' + (c.codigo || c.nombre) + '</span>').join(' ')
            : '<span class="texto-secundario">Sin capacidades</span>';
        
        return `
            <div class="subordinado-card" style="background:var(--fondo-secundario);padding:16px;border-radius:8px;border:1px solid var(--borde);">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div>
                        <strong style="font-size:16px;">${s.sub_nombre_completo || s.sub_correo || 'Sin nombre'}</strong>
                        <div style="color:var(--texto-secundario);font-size:13px;">${s.sub_correo || ''}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button class="btn-icono" onclick="GestionJerarquia.editarSubordinado(${s.sub_membresia_id})" title="Editar">✏️</button>
                        <button class="btn-icono btn-peligro" onclick="GestionJerarquia.desactivarSubordinado(${s.sub_membresia_id})" title="Desactivar">🚫</button>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
                    <span class="badge">Nivel ${s.sub_nivel}</span>
                    <span class="badge" style="background:var(--color-marca);color:#fff;">${s.sub_nombre_rol || 'Miembro'}</span>
                    ${s.sub_puede_crear_hijos ? '<span class="badge" style="background:#50C878;color:#fff;">Puede crear</span>' : ''}
                </div>
                <div style="font-size:12px;color:var(--texto-secundario);">Capacidades: ${capsHtml}</div>
            </div>
        `;
    },
    
    mostrarModalCrear() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modal-crear-usuario';
        modal.innerHTML = `
            <div class="modal-tarjeta" style="max-width:500px;">
                <h3>Crear Usuario</h3>
                <form id="form-crear-usuario" onsubmit="GestionJerarquia.crear(event)">
                    <div class="campo">
                        <label>Email</label>
                        <input type="email" id="email-usuario" required placeholder="usuario@email.com">
                    </div>
                    <div class="campo">
                        <label>Nombre completo</label>
                        <input type="text" id="nombre-usuario" placeholder="Nombre del usuario">
                    </div>
                    <div class="campo">
                        <label>Nombre del rol</label>
                        <input type="text" id="rol-usuario" required placeholder="Ej: Asistente, Profesor">
                    </div>
                    <div class="campo">
                        <label>Nivel jerarquico</label>
                        <input type="number" id="nivel-usuario" required min="${this.miNivel + 1}" value="${this.miNivel + 1}">
                    </div>
                    <div class="campo">
                        <label>Superior inmediato</label>
                        <input type="number" id="superior-usuario" value="${this.miMembresiaId}">
                    </div>
                    <div class="modal-acciones">
                        <button type="button" class="btn-secundario" onclick="document.getElementById('modal-crear-usuario').remove()">Cancelar</button>
                        <button type="submit" class="btn-primario">Crear</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    async crear(e) {
        e.preventDefault();
        const datos = {
            email: document.getElementById('email-usuario').value,
            nombre_completo: document.getElementById('nombre-usuario').value,
            nombre_rol: document.getElementById('rol-usuario').value,
            nivel_jerarquico: parseInt(document.getElementById('nivel-usuario').value),
            superior_inmediato_id: parseInt(document.getElementById('superior-usuario').value),
            puede_crear_hijos: false
        };
        
        try {
            await api.crearUsuarioHijo(datos);
            document.getElementById('modal-crear-usuario').remove();
            app.mostrarToast('✅ Usuario creado correctamente');
            await this.cargar();
        } catch (error) {
            app.mostrarToast('❌ Error: ' + error.message, 'error');
        }
    },
    
    async editarSubordinado(membresiaId) {
        app.mostrarToast('Editar subordinado ' + membresiaId + ' (en desarrollo)');
    },
    
    async desactivarSubordinado(membresiaId) {
        if (!confirm('¿Desactivar este subordinado?')) return;
        try {
            await api.desactivarSubordinado(membresiaId);
            app.mostrarToast('🚫 Subordinado desactivado');
            await this.cargar();
        } catch (error) {
            app.mostrarToast('❌ Error: ' + error.message, 'error');
        }
    }
};
