#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  INSTALADOR JERARQUÍA v4.0 - Academia Addison              ║"
echo "╚══════════════════════════════════════════════════════════════╝"

# ───────────────────────────────────────────────────────────────
# PASO 0: BACKUP
# ───────────────────────────────────────────────────────────────
echo "📦 PASO 0: Backup de base de datos..."
cd ~/ACADEMIA-ADDISON
docker exec postgres-academia pg_dump -U addison -d academia_addison > backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup creado"

# ───────────────────────────────────────────────────────────────
# PASO 1: MIGRACIÓN SQL
# ───────────────────────────────────────────────────────────────
echo "🗄️  PASO 1: Migrando base de datos..."

cat > /tmp/migracion_jerarquia.sql << 'SQLEOF'
BEGIN;

CREATE TABLE IF NOT EXISTS capacidades (
    capacidad_id      SERIAL PRIMARY KEY,
    codigo            VARCHAR(50) UNIQUE NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    descripcion       TEXT,
    categoria         VARCHAR(50),
    es_delegable      BOOLEAN DEFAULT TRUE,
    es_crear_usuarios BOOLEAN DEFAULT FALSE,
    requiere_nivel    INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capacidades_codigo ON capacidades(codigo);
CREATE INDEX IF NOT EXISTS idx_capacidades_categoria ON capacidades(categoria);

INSERT INTO capacidades (codigo, nombre, descripcion, categoria, es_delegable, es_crear_usuarios) VALUES
('crear_usuarios',        'Crear Usuarios',        'Capacidad especial para crear usuarios hijos en la jerarquia', 'admin', true, true),
('gestionar_instituciones','Gestionar Instituciones','Crear, editar, eliminar instituciones', 'admin', true, false),
('gestionar_grupos',      'Gestionar Grupos',      'Crear, editar, eliminar grupos academicos', 'academico', true, false),
('gestionar_cursos',      'Gestionar Cursos',      'Crear, editar, eliminar cursos', 'academico', true, false),
('gestionar_temas',       'Gestionar Temas',       'Crear, editar, eliminar temas', 'academico', true, false),
('gestionar_subtemas',    'Gestionar Subtemas',    'Crear, editar, eliminar subtemas', 'academico', true, false),
('gestionar_teorias',     'Gestionar Teorias',     'Crear, editar, eliminar teorias', 'academico', true, false),
('gestionar_materiales',  'Gestionar Materiales',  'Crear, editar, eliminar materiales', 'academico', true, false),
('gestionar_examenes',    'Gestionar Examenes',    'Crear, editar, calificar examenes', 'academico', true, false),
('gestionar_preguntas',   'Gestionar Preguntas',   'Crear, editar, eliminar banco de preguntas', 'academico', true, false),
('gestionar_clases_vivo', 'Gestionar Clases Vivo', 'Crear, editar, gestionar clases en vivo', 'academico', true, false),
('gestionar_grabaciones', 'Gestionar Grabaciones', 'Ver, descargar, eliminar grabaciones', 'academico', true, false),
('gestionar_asistencia',  'Gestionar Asistencia',  'Marcar y ver asistencia', 'academico', true, false),
('gestionar_calendario',  'Gestionar Calendario',  'Crear y editar eventos del calendario', 'academico', true, false),
('ver_reportes',          'Ver Reportes',          'Ver reportes y estadisticas', 'reportes', true, false),
('ver_auditoria',         'Ver Auditoria',         'Ver logs de auditoria del sistema', 'admin', true, false),
('gestionar_membresias',  'Gestionar Membresias',  'Crear, editar, eliminar membresias', 'finanzas', true, false),
('gestionar_pagos',       'Gestionar Pagos',       'Ver y gestionar pagos', 'finanzas', true, false),
('ver_finanzas',          'Ver Finanzas',          'Acceso al modulo de finanzas', 'finanzas', true, false),
('modo_fantasma',         'Modo Fantasma',         'Entrar a clases sin ser visto', 'especial', true, false),
('descargar_grabaciones', 'Descargar Grabaciones', 'Descargar grabaciones de clases', 'especial', true, false),
('supervisar_usuarios',   'Supervisar Usuarios',   'Ver actividad de usuarios subordinados', 'admin', true, false),
('modificar_capacidades', 'Modificar Capacidades', 'Cambiar capacidades de usuarios creados por mi', 'admin', true, false)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS jerarquia_log (
    log_id            SERIAL PRIMARY KEY,
    accion            VARCHAR(50) NOT NULL,
    actor_membresia_id INTEGER,
    actor_usuario_id  VARCHAR(36),
    objetivo_membresia_id INTEGER,
    objetivo_usuario_id VARCHAR(36),
    capacidad_id      INTEGER REFERENCES capacidades(capacidad_id),
    detalle_json      JSONB,
    ip_address        INET,
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jl_actor ON jerarquia_log(actor_usuario_id);
CREATE INDEX IF NOT EXISTS idx_jl_objetivo ON jerarquia_log(objetivo_usuario_id);
CREATE INDEX IF NOT EXISTS idx_jl_fecha ON jerarquia_log(created_at);

ALTER TABLE membresias ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1;
ALTER TABLE membresias ADD COLUMN IF NOT EXISTS nombre_rol VARCHAR(100);
ALTER TABLE membresias ADD COLUMN IF NOT EXISTS puede_crear_hijos BOOLEAN DEFAULT FALSE;
ALTER TABLE membresias ADD COLUMN IF NOT EXISTS padre_membresia_id INTEGER REFERENCES membresias(membresia_id);
ALTER TABLE membresias ADD COLUMN IF NOT EXISTS creado_por_usuario_id VARCHAR(36) REFERENCES usuarios(usuario_id);

CREATE TABLE IF NOT EXISTS membresia_capacidades (
    id                    SERIAL PRIMARY KEY,
    membresia_id          INTEGER NOT NULL REFERENCES membresias(membresia_id) ON DELETE CASCADE,
    capacidad_id          INTEGER NOT NULL REFERENCES capacidades(capacidad_id),
    asignado_por_membresia_id INTEGER REFERENCES membresias(membresia_id),
    asignado_por_usuario_id VARCHAR(36) REFERENCES usuarios(usuario_id),
    nivel_asignacion      INTEGER,
    puede_delegar         BOOLEAN DEFAULT TRUE,
    created_at            TIMESTAMP DEFAULT NOW(),
    UNIQUE(membresia_id, capacidad_id)
);

CREATE INDEX IF NOT EXISTS idx_mc_membresia ON membresia_capacidades(membresia_id);
CREATE INDEX IF NOT EXISTS idx_mc_capacidad ON membresia_capacidades(capacidad_id);

UPDATE membresias SET 
    nivel = CASE tipo_rol
        WHEN 'superadmin' THEN 0
        WHEN 'director' THEN 1
        WHEN 'professor' THEN 2
        WHEN 'auxiliary' THEN 2
        WHEN 'student' THEN 3
        ELSE 1
    END,
    puede_crear_hijos = CASE tipo_rol
        WHEN 'superadmin' THEN TRUE
        WHEN 'director' THEN TRUE
        ELSE FALSE
    END,
    nombre_rol = CASE tipo_rol
        WHEN 'superadmin' THEN 'Superadministrador'
        WHEN 'director' THEN 'Director'
        WHEN 'professor' THEN 'Profesor'
        WHEN 'auxiliary' THEN 'Auxiliar'
        WHEN 'student' THEN 'Estudiante'
        ELSE tipo_rol
    END
WHERE nivel IS NULL OR nombre_rol IS NULL;

INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_usuario_id, nivel_asignacion, puede_delegar)
SELECT m.membresia_id, c.capacidad_id, m.usuario_id, 0, true
FROM membresias m
CROSS JOIN capacidades c
WHERE m.tipo_rol = 'superadmin'
ON CONFLICT (membresia_id, capacidad_id) DO NOTHING;

INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_usuario_id, nivel_asignacion, puede_delegar)
SELECT m.membresia_id, c.capacidad_id, m.usuario_id, 1, true
FROM membresias m
CROSS JOIN capacidades c
WHERE m.tipo_rol = 'director'
AND c.codigo IN (
    'crear_usuarios', 'gestionar_grupos', 'gestionar_cursos', 'gestionar_temas',
    'gestionar_subtemas', 'gestionar_teorias', 'gestionar_materiales', 'gestionar_examenes',
    'gestionar_preguntas', 'gestionar_clases_vivo', 'gestionar_grabaciones', 'gestionar_asistencia',
    'gestionar_calendario', 'ver_reportes', 'supervisar_usuarios', 'modificar_capacidades',
    'descargar_grabaciones', 'modo_fantasma'
)
ON CONFLICT (membresia_id, capacidad_id) DO NOTHING;

INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_usuario_id, nivel_asignacion, puede_delegar)
SELECT m.membresia_id, c.capacidad_id, m.usuario_id, 2, false
FROM membresias m
CROSS JOIN capacidades c
WHERE m.tipo_rol = 'professor'
AND c.codigo IN (
    'gestionar_teorias', 'gestionar_materiales', 'gestionar_examenes',
    'gestionar_preguntas', 'gestionar_clases_vivo', 'gestionar_asistencia',
    'gestionar_calendario', 'ver_reportes'
)
ON CONFLICT (membresia_id, capacidad_id) DO NOTHING;

INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_usuario_id, nivel_asignacion, puede_delegar)
SELECT m.membresia_id, c.capacidad_id, m.usuario_id, 3, false
FROM membresias m
CROSS JOIN capacidades c
WHERE m.tipo_rol = 'student'
AND c.codigo IN ('ver_reportes')
ON CONFLICT (membresia_id, capacidad_id) DO NOTHING;

CREATE OR REPLACE FUNCTION es_descendiente_membresia(padre_id INTEGER, hijo_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    actual INTEGER := hijo_id;
    contador INTEGER := 0;
BEGIN
    WHILE actual IS NOT NULL AND contador < 100 LOOP
        IF actual = padre_id THEN
            RETURN TRUE;
        END IF;
        SELECT padre_membresia_id INTO actual FROM membresias WHERE membresia_id = actual;
        contador := contador + 1;
    END LOOP;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION obtener_descendientes_membresia(padre_membresia_id INTEGER)
RETURNS TABLE(
    membresia_id INTEGER,
    usuario_id VARCHAR(36),
    institucion_id INTEGER,
    nombre_rol VARCHAR,
    nivel INTEGER,
    padre_membresia_id INTEGER,
    puede_crear_hijos BOOLEAN,
    tipo_rol VARCHAR,
    estado_membresia VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendientes AS (
        SELECT m.membresia_id, m.usuario_id, m.institucion_id, m.nombre_rol, 
               m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.tipo_rol, m.estado_membresia
        FROM membresias m 
        WHERE m.padre_membresia_id = $1 AND m.estado_membresia = 'active'
        UNION ALL
        SELECT m.membresia_id, m.usuario_id, m.institucion_id, m.nombre_rol, 
               m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.tipo_rol, m.estado_membresia
        FROM membresias m
        INNER JOIN descendientes d ON m.padre_membresia_id = d.membresia_id
        WHERE m.estado_membresia = 'active'
    )
    SELECT d.membresia_id, d.usuario_id, d.institucion_id, d.nombre_rol, 
           d.nivel, d.padre_membresia_id, d.puede_crear_hijos, d.tipo_rol, d.estado_membresia
    FROM descendientes d
    ORDER BY d.nivel, d.nombre_rol;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION tiene_capacidad(p_membresia_id INTEGER, p_codigo VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    resultado BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM membresia_capacidades mc
        INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
        WHERE mc.membresia_id = p_membresia_id AND c.codigo = p_codigo
    ) INTO resultado;
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION prevenir_ciclo_membresia()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membresia_id = NEW.padre_membresia_id THEN
        RAISE EXCEPTION 'Una membresia no puede ser su propio padre';
    END IF;
    IF NEW.padre_membresia_id IS NOT NULL AND 
       es_descendiente_membresia(NEW.membresia_id, NEW.padre_membresia_id) THEN
        RAISE EXCEPTION 'No se puede crear un ciclo en la jerarquia';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevenir_ciclo_membresia ON membresias;
CREATE TRIGGER trg_prevenir_ciclo_membresia
    BEFORE INSERT OR UPDATE OF padre_membresia_id ON membresias
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_ciclo_membresia();

CREATE INDEX IF NOT EXISTS idx_membresias_padre ON membresias(padre_membresia_id);
CREATE INDEX IF NOT EXISTS idx_membresias_nivel ON membresias(nivel);
CREATE INDEX IF NOT EXISTS idx_membresias_nombre_rol ON membresias(nombre_rol);

SELECT 'Migracion completada' as resultado,
       (SELECT COUNT(*) FROM capacidades) as total_capacidades,
       (SELECT COUNT(*) FROM membresia_capacidades) as total_asignaciones,
       (SELECT COUNT(*) FROM membresias WHERE nivel IS NOT NULL) as membresias_migradas;

COMMIT;
SQLEOF

docker exec -i postgres-academia psql -U addison -d academia_addison < /tmp/migracion_jerarquia.sql
echo "✅ SQL ejecutado"

# ───────────────────────────────────────────────────────────────
# PASO 2: BACKEND - CONTROLADOR
# ───────────────────────────────────────────────────────────────
echo "⚙️  PASO 2: Creando controlador..."

cat > ~/ACADEMIA-ADDISON/api/controladores/jerarquia.controlador.js << 'EOF'
const { consulta } = require('../configuracion/base_de_datos');
const admin = require('firebase-admin');

class JerarquiaControlador {

  async crearUsuarioHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      
      if (!creador_membresia_id || !creador_usuario_id || !institucion_id) {
        return res.status(400).json({ error: 'Falta contexto', codigo: 'SIN_CONTEXTO' });
      }

      const { email, nombre_rol, nombre_completo, capacidades_ids, puede_crear_hijos } = req.body;

      const tienePoder = await consulta(
        `SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`,
        [creador_membresia_id]
      );
      if (tienePoder.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso', codigo: 'SIN_PODER_CREAR' });
      }

      const puedeCrear = await consulta('SELECT puede_crear_hijos, nivel FROM membresias WHERE membresia_id = $1', [creador_membresia_id]);
      if (!puedeCrear.rows[0]?.puede_crear_hijos) {
        return res.status(403).json({ error: 'Creacion deshabilitada', codigo: 'CREACION_DESHABILITADA' });
      }
      const creador_nivel = puedeCrear.rows[0].nivel;

      let usuarioFirebase;
      try { usuarioFirebase = await admin.auth().getUserByEmail(email); }
      catch (e) { return res.status(400).json({ error: 'Email no en Firebase', codigo: 'EMAIL_NO_FIREBASE' }); }
      const uid_firebase = usuarioFirebase.uid;

      const existe = await consulta('SELECT membresia_id FROM membresias WHERE usuario_id = $1 AND institucion_id = $2 AND estado_membresia = $3', [uid_firebase, institucion_id, 'active']);
      if (existe.rows.length > 0) return res.status(409).json({ error: 'Ya tiene membresia', codigo: 'MEMBRESIA_EXISTENTE' });

      const usuarioExiste = await consulta('SELECT usuario_id FROM usuarios WHERE usuario_id = $1', [uid_firebase]);
      if (usuarioExiste.rows.length === 0) {
        await consulta(`INSERT INTO usuarios (usuario_id, correo_electronico, nombre_completo, auth_provider, estado_usuario, creado_en) VALUES ($1, $2, $3, $4, $5, NOW())`, [uid_firebase, email, nombre_completo || usuarioFirebase.displayName || email.split('@')[0], 'firebase', 'active']);
      }

      if (capacidades_ids && capacidades_ids.length > 0) {
        const capsCreador = await consulta(`SELECT c.capacidad_id FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`, [creador_membresia_id, capacidades_ids]);
        const idsCreador = capsCreador.rows.map(r => r.capacidad_id);
        const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
        if (idsIlegales.length > 0) return res.status(403).json({ error: 'No puedes delegar capacidades que no posees', codigo: 'DELEGACION_ILEGAL', capacidades_ilegales: idsIlegales });
      }

      const capCrear = await consulta("SELECT capacidad_id FROM capacidades WHERE codigo = 'crear_usuarios'");
      if (capacidades_ids?.includes(capCrear.rows[0]?.capacidad_id)) return res.status(403).json({ error: 'crear_usuarios no delegable directamente', codigo: 'CREAR_USUARIOS_NO_DELEGABLE' });

      const nivelHijo = creador_nivel + 1;
      const nuevaMembresia = await consulta(
        `INSERT INTO membresias (usuario_id, institucion_id, tipo_rol, nombre_rol, nivel, padre_membresia_id, puede_crear_hijos, creado_por_usuario_id, creado_por_membresia_id, estado_membresia, creado_en) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) RETURNING membresia_id`,
        [uid_firebase, institucion_id, 'custom', nombre_rol, nivelHijo, creador_membresia_id, puede_crear_hijos || false, creador_usuario_id, creador_membresia_id, 'active']
      );
      const nueva_membresia_id = nuevaMembresia.rows[0].membresia_id;

      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`).join(', ');
        const params = [nueva_membresia_id, ...capacidades_ids, ...capacidades_ids.map(() => creador_membresia_id), ...capacidades_ids.map(() => creador_usuario_id), ...capacidades_ids.map(() => creador_nivel)];
        await consulta(`INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion) VALUES ${values}`, params);
      }

      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json) VALUES ('crear_usuario', $1, $2, $3, $4, $5)`, [creador_membresia_id, creador_usuario_id, nueva_membresia_id, uid_firebase, JSON.stringify({nombre_rol, nivel: nivelHijo, capacidades_ids, puede_crear_hijos: puede_crear_hijos||false, institucion_id})]);

      res.status(201).json({ exito: true, mensaje: 'Usuario creado', membresia: { membresia_id: nueva_membresia_id, usuario_id: uid_firebase, email, nombre_rol, nivel: nivelHijo, padre_membresia_id: creador_membresia_id, puede_crear_hijos: puede_crear_hijos||false, capacidades_asignadas: capacidades_ids?.length||0 }});
    } catch (error) {
      console.error('Error crearUsuarioHijo:', error);
      res.status(500).json({ error: 'Error interno', codigo: 'ERROR_INTERNO', detalle: error.message });
    }
  }

  async obtenerMisHijos(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const resultado = await consulta(`SELECT * FROM obtener_descendientes_membresia($1)`, [membresia_id]);
      const hijosConCapacidades = await Promise.all(resultado.rows.map(async (hijo) => {
        const caps = await consulta(`SELECT c.codigo, c.nombre, c.categoria FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1`, [hijo.membresia_id]);
        return { ...hijo, capacidades: caps.rows };
      }));
      res.json({ exito: true, total: resultado.rows.length, hijos: hijosConCapacidades });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async obtenerMisCapacidades(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const resultado = await consulta(`SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria, c.es_delegable, c.es_crear_usuarios, mc.puede_delegar, mc.asignado_por_membresia_id, mc.nivel_asignacion FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 ORDER BY c.categoria, c.nombre`, [membresia_id]);
      const infoMembresia = await consulta('SELECT puede_crear_hijos, nivel, nombre_rol, tipo_rol FROM membresias WHERE membresia_id = $1', [membresia_id]);
      res.json({ exito: true, membresia: infoMembresia.rows[0], capacidades: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async capacidadesDisponiblesParaDelegar(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      if (!membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const resultado = await consulta(`SELECT c.capacidad_id, c.codigo, c.nombre, c.descripcion, c.categoria FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.es_delegable = true AND c.es_crear_usuarios = false AND mc.puede_delegar = true ORDER BY c.categoria, c.nombre`, [membresia_id]);
      const puedeCrear = await consulta('SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1', [membresia_id]);
      res.json({ exito: true, puede_crear_hijos: puedeCrear.rows[0]?.puede_crear_hijos||false, capacidades_delegables: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async modificarCapacidadesHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      const { capacidades_ids, puede_crear_hijos } = req.body;
      if (!creador_membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
      if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es tu descendiente', codigo: 'NO_ES_DESCENDIENTE' });
      if (capacidades_ids && capacidades_ids.length > 0) {
        const capsCreador = await consulta(`SELECT c.capacidad_id FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.capacidad_id = ANY($2::int[])`, [creador_membresia_id, capacidades_ids]);
        const idsCreador = capsCreador.rows.map(r => r.capacidad_id);
        const idsIlegales = capacidades_ids.filter(id => !idsCreador.includes(id));
        if (idsIlegales.length > 0) return res.status(403).json({ error: 'No puedes asignar capacidades que no posees', codigo: 'ASIGNACION_ILEGAL', capacidades_ilegales: idsIlegales });
      }
      const creadorInfo = await consulta('SELECT nivel FROM membresias WHERE membresia_id = $1', [creador_membresia_id]);
      const creador_nivel = creadorInfo.rows[0]?.nivel;
      await consulta('DELETE FROM membresia_capacidades WHERE membresia_id = $1', [objetivo_membresia_id]);
      if (capacidades_ids && capacidades_ids.length > 0) {
        const values = capacidades_ids.map((cap_id, idx) => `($1, $${idx+2}, $${idx+2+capacidades_ids.length}, $${idx+2+2*capacidades_ids.length}, $${idx+2+3*capacidades_ids.length})`).join(', ');
        const params = [objetivo_membresia_id, ...capacidades_ids, ...capacidades_ids.map(() => creador_membresia_id), ...capacidades_ids.map(() => creador_usuario_id), ...capacidades_ids.map(() => creador_nivel)];
        await consulta(`INSERT INTO membresia_capacidades (membresia_id, capacidad_id, asignado_por_membresia_id, asignado_por_usuario_id, nivel_asignacion) VALUES ${values}`, params);
      }
      if (puede_crear_hijos !== undefined) await consulta('UPDATE membresias SET puede_crear_hijos = $1 WHERE membresia_id = $2', [puede_crear_hijos, objetivo_membresia_id]);
      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, detalle_json) VALUES ('modificar_capacidades', $1, $2, $3, $4)`, [creador_membresia_id, creador_usuario_id, objetivo_membresia_id, JSON.stringify({nuevas_capacidades: capacidades_ids, puede_crear_hijos})]);
      res.json({ exito: true, mensaje: 'Capacidades modificadas', membresia_id: objetivo_membresia_id, capacidades_asignadas: capacidades_ids?.length||0 });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async eliminarHijo(req, res) {
    try {
      const creador_membresia_id = req.contexto_institucion?.membresia_id;
      const creador_usuario_id = req.usuario_autenticado?.usuario_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (!creador_membresia_id) return res.status(400).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
      const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
      if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es tu descendiente', codigo: 'NO_ES_DESCENDIENTE' });
      const infoObjetivo = await consulta('SELECT nivel, usuario_id FROM membresias WHERE membresia_id = $1', [objetivo_membresia_id]);
      if (infoObjetivo.rows[0]?.nivel === 0) return res.status(403).json({ error: 'No puedes eliminar superadmin', codigo: 'PROTECCION_SUPERADMIN' });
      await consulta("UPDATE membresias SET estado_membresia = 'suspended', padre_membresia_id = NULL WHERE membresia_id = $1", [objetivo_membresia_id]);
      await consulta(`INSERT INTO jerarquia_log (accion, actor_membresia_id, actor_usuario_id, objetivo_membresia_id, objetivo_usuario_id, detalle_json) VALUES ('desactivar_usuario', $1, $2, $3, $4, $5)`, [creador_membresia_id, creador_usuario_id, objetivo_membresia_id, infoObjetivo.rows[0]?.usuario_id, JSON.stringify({metodo: 'soft_delete', nivel_previo: infoObjetivo.rows[0]?.nivel})]);
      res.json({ exito: true, mensaje: 'Usuario desactivado', membresia_id: objetivo_membresia_id });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }

  async arbolCompletoInstitucion(req, res) {
    try {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const institucion_id = req.contexto_institucion?.institucion_id;
      if (!membresia_id || !institucion_id) return res.status(400).json({ error: 'Sin contexto', codigo: 'SIN_CONTEXTO' });
      const esSuperadmin = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [membresia_id]);
      if (esSuperadmin.rows.length === 0) return res.status(403).json({ error: 'Solo superadmin', codigo: 'NO_SUPERADMIN' });
      const resultado = await consulta(`SELECT m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia, u.correo_electronico, u.nombre_completo, u.avatar_url, COALESCE(jsonb_agg(jsonb_build_object('capacidad_id', c.capacidad_id, 'codigo', c.codigo, 'nombre', c.nombre) ORDER BY c.nombre) FILTER (WHERE c.capacidad_id IS NOT NULL), '[]'::jsonb) as capacidades FROM membresias m JOIN usuarios u ON m.usuario_id = u.usuario_id LEFT JOIN membresia_capacidades mc ON m.membresia_id = mc.membresia_id LEFT JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE m.institucion_id = $1 AND m.estado_membresia = 'active' GROUP BY m.membresia_id, m.usuario_id, m.nombre_rol, m.nivel, m.padre_membresia_id, m.puede_crear_hijos, m.estado_membresia, u.correo_electronico, u.nombre_completo, u.avatar_url ORDER BY m.nivel, u.nombre_completo`, [institucion_id]);
      res.json({ exito: true, total: resultado.rows.length, arbol: resultado.rows });
    } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_INTERNO' }); }
  }
}

module.exports = new JerarquiaControlador();
EOF

echo "✅ Controlador creado"

# ───────────────────────────────────────────────────────────────
# PASO 3: BACKEND - MIDDLEWARE
# ───────────────────────────────────────────────────────────────
echo "🔒 PASO 3: Creando middleware..."

cat > ~/ACADEMIA-ADDISON/api/middleware/jerarquia.middleware.js << 'EOF'
const { consulta } = require('../configuracion/base_de_datos');

class JerarquiaMiddleware {
  verificarCapacidad(capacidadCodigo) {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const resultado = await consulta(`SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = $2`, [membresia_id, capacidadCodigo]);
        if (resultado.rows.length === 0) return res.status(403).json({ error: `Capacidad requerida: ${capacidadCodigo}`, codigo: 'CAPACIDAD_REQUERIDA' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarPuedeCrearUsuarios() {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const tieneCap = await consulta(`SELECT 1 FROM membresia_capacidades mc INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id WHERE mc.membresia_id = $1 AND c.codigo = 'crear_usuarios'`, [membresia_id]);
        if (tieneCap.rows.length === 0) return res.status(403).json({ error: 'Sin capacidad crear_usuarios', codigo: 'SIN_CAPACIDAD_CREAR' });
        const puedeCrear = await consulta('SELECT puede_crear_hijos FROM membresias WHERE membresia_id = $1', [membresia_id]);
        if (!puedeCrear.rows[0]?.puede_crear_hijos) return res.status(403).json({ error: 'Creacion deshabilitada', codigo: 'CREACION_DESHABILITADA' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarEsDescendiente() {
    return async (req, res, next) => {
      try {
        const creador_membresia_id = req.contexto_institucion?.membresia_id;
        const objetivo_membresia_id = parseInt(req.params.membresia_id);
        if (!creador_membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const esSuperadmin = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [creador_membresia_id]);
        if (esSuperadmin.rows.length > 0) return next();
        const esDescendiente = await consulta('SELECT 1 FROM obtener_descendientes_membresia($1) WHERE membresia_id = $2', [creador_membresia_id, objetivo_membresia_id]);
        if (esDescendiente.rows.length === 0) return res.status(403).json({ error: 'No es descendiente', codigo: 'NO_ES_DESCENDIENTE' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarSuperadmin() {
    return async (req, res, next) => {
      try {
        const membresia_id = req.contexto_institucion?.membresia_id;
        if (!membresia_id) return res.status(401).json({ error: 'Sin membresia', codigo: 'SIN_MEMBRESIA' });
        const resultado = await consulta('SELECT 1 FROM membresias WHERE membresia_id = $1 AND nivel = 0', [membresia_id]);
        if (resultado.rows.length === 0) return res.status(403).json({ error: 'Requiere superadmin', codigo: 'REQUIERE_SUPERADMIN' });
        next();
      } catch (error) { res.status(500).json({ error: 'Error', codigo: 'ERROR_VERIFICACION' }); }
    };
  }

  verificarNoAutoModificacion() {
    return async (req, res, next) => {
      const membresia_id = req.contexto_institucion?.membresia_id;
      const objetivo_membresia_id = parseInt(req.params.membresia_id);
      if (membresia_id === objetivo_membresia_id) return res.status(403).json({ error: 'No auto-modificacion', codigo: 'AUTO_MODIFICACION_PROHIBIDA' });
      next();
    };
  }
}

module.exports = new JerarquiaMiddleware();
EOF

echo "✅ Middleware creado"

# ───────────────────────────────────────────────────────────────
# PASO 4: BACKEND - RUTAS
# ───────────────────────────────────────────────────────────────
echo "🌐 PASO 4: Creando rutas..."

cat > ~/ACADEMIA-ADDISON/api/rutas/jerarquia.rutas.js << 'EOF'
const express = require('express');
const router = express.Router();
const jerarquiaControlador = require('../controladores/jerarquia.controlador');
const jerarquiaMiddleware = require('../middleware/jerarquia.middleware');
const { middlewareAutenticar } = require('../middleware/autenticar');
const { middlewareContexto } = require('../middleware/contexto_institucion');

router.use(middlewareAutenticar);
router.use(middlewareContexto);

router.post('/crear', jerarquiaMiddleware.verificarPuedeCrearUsuarios(), jerarquiaControlador.crearUsuarioHijo);
router.get('/mis-hijos', jerarquiaControlador.obtenerMisHijos);
router.get('/mis-capacidades', jerarquiaControlador.obtenerMisCapacidades);
router.get('/capacidades-delegables', jerarquiaControlador.capacidadesDisponiblesParaDelegar);
router.put('/:membresia_id/capacidades', jerarquiaMiddleware.verificarEsDescendiente(), jerarquiaMiddleware.verificarNoAutoModificacion(), jerarquiaControlador.modificarCapacidadesHijo);
router.delete('/:membresia_id', jerarquiaMiddleware.verificarEsDescendiente(), jerarquiaMiddleware.verificarNoAutoModificacion(), jerarquiaControlador.eliminarHijo);
router.get('/arbol-completo', jerarquiaMiddleware.verificarSuperadmin(), jerarquiaControlador.arbolCompletoInstitucion);

module.exports = router;
EOF

echo "✅ Rutas creadas"

# ───────────────────────────────────────────────────────────────
# PASO 5: MODIFICAR SERVIDOR.JS
# ───────────────────────────────────────────────────────────────
echo "🔧 PASO 5: Registrando ruta en servidor.js..."

cd ~/ACADEMIA-ADDISON/api
cp servidor.js servidor.js.BAK

# Agregar la linea de require
if ! grep -q "rutasJerarquia" servidor.js; then
    sed -i "/const rutasProgreso = require/a const rutasJerarquia = require('./rutas/jerarquia.rutas');" servidor.js
fi

# Agregar la linea de app.use
if ! grep -q "api/v1/jerarquia" servidor.js; then
    sed -i "/app.use('\/api\/v1\/progreso'/a app.use('/api/v1/jerarquia', rutasJerarquia);" servidor.js
fi

echo "✅ Servidor.js modificado"

# ───────────────────────────────────────────────────────────────
# PASO 6: MODIFICAR AUTH.CONTROLADOR.JS
# ───────────────────────────────────────────────────────────────
echo "🔑 PASO 6: Modificando auth.controlador.js..."

cd ~/ACADEMIA-ADDISON/api/controladores
cp auth.controlador.js auth.controlador.js.BAK

# Crear version modificada completa
cat > auth.controlador.js << 'EOF'
const { obtenerAuth } = require('../configuracion/firebase');
const { consulta } = require('../configuracion/base_de_datos');
const { generarToken } = require('../utilidades/jwt');

async function login(req, res) {
  try {
    const { token_firebase } = req.body;
    if (!token_firebase) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    const auth = obtenerAuth();
    const decoded = await auth.verifyIdToken(token_firebase);
    const uid = decoded.uid;
    const correo = decoded.email;
    const nombre = decoded.name || 'Usuario';

    let result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
    let usuario;

    if (result.rows.length === 0) {
      const porEmail = await consulta('SELECT * FROM usuarios WHERE correo_electronico = $1', [correo]);
      if (porEmail.rows.length > 0) {
        const uidViejo = porEmail.rows[0].usuario_id;
        try {
          await consulta('UPDATE usuarios SET usuario_id = $1, ultimo_login = NOW(), auth_provider = $2, estado_usuario = $3 WHERE correo_electronico = $4', [uid, 'firebase', 'active', correo]);
          await consulta('UPDATE membresias SET usuario_id = $1, estado_membresia = $2 WHERE usuario_id = $3', [uid, 'active', uidViejo]);
          await consulta('UPDATE instituciones SET superadmin_id = $1 WHERE superadmin_id = $2', [uid, uidViejo]);
        } catch (err) {
          console.error('Error en migracion de usuario:', err);
          return res.status(500).json({ error: 'Error al migrar usuario', detalle: err.message });
        }
        result = await consulta('SELECT * FROM usuarios WHERE usuario_id = $1', [uid]);
        usuario = result.rows[0];
      } else {
        return res.status(403).json({
          error: 'No estas registrado en la plataforma',
          mensaje: 'Para tener acceso a la plataforma educativa matriculate primero.',
          codigo: 'NO_REGISTRADO',
          correo: correo
        });
      }
    } else {
      usuario = result.rows[0];
      await consulta("UPDATE usuarios SET estado_usuario = 'active', ultimo_login = NOW(), auth_provider = COALESCE(auth_provider, 'firebase') WHERE usuario_id = $1", [uid]);
      await consulta("UPDATE membresias SET estado_membresia = 'active' WHERE usuario_id = $1 AND estado_membresia IN ('pending','pending_verification')", [uid]);
    }

    const membresias = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, m.metadata_rol, m.nivel, m.nombre_rol, m.puede_crear_hijos, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.usuario_id = $1 AND m.estado_membresia = $2',
      [uid, 'active']
    );

    if (membresias.rows.length === 0) {
      return res.status(403).json({
        error: 'No tienes membresia activa',
        mensaje: 'Contacta al administrador o director de tu academia para que te asigne una membresia.',
        codigo: 'SIN_MEMBRESIA',
        correo: correo
      });
    }

    // OBTENER CAPACIDADES DE LA MEMBRESIA
    const capacidadesResult = await consulta(
      `SELECT c.codigo FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1`,
      [membresias.rows[0].membresia_id]
    );
    const capacidades = capacidadesResult.rows.map(r => r.codigo);

    if (membresias.rows.length === 1) {
      const membresia = membresias.rows[0];
      const tokenSesion = generarToken({
        usuario_id: uid,
        membresia_id: membresia.membresia_id,
        institucion_id: membresia.institucion_id,
        tipo_rol: membresia.tipo_rol,
        correo: usuario.correo_electronico
      });

      return res.status(200).json({
        tipo: 'login_directo',
        token_sesion: tokenSesion,
        usuario: {
          nombre: usuario.nombre_completo || nombre,
          correo: usuario.correo_electronico || correo,
          rol: membresia.tipo_rol,
          avatar: usuario.avatar_url || null,
          nivel: membresia.nivel || 1,
          nombre_rol: membresia.nombre_rol || membresia.tipo_rol,
          puede_crear_hijos: membresia.puede_crear_hijos || false,
          capacidades: capacidades
        },
        institucion: {
          id: membresia.institucion_id,
          nombre: membresia.nombre_institucion,
          slug: membresia.institucion_slug
        },
        membresia_id: membresia.membresia_id
      });

    } else {
      return res.status(200).json({
        tipo: 'selector_requerido',
        token_preliminar: generarToken({ usuario_id: uid, correo: usuario.correo_electronico }),
        usuario: {
          nombre: usuario.nombre_completo || nombre,
          correo: usuario.correo_electronico || correo,
          avatar: usuario.avatar_url || null
        },
        membresias: membresias.rows.map(m => ({
          membresia_id: m.membresia_id,
          institucion_id: m.institucion_id,
          nombre_institucion: m.nombre_institucion,
          slug: m.institucion_slug,
          rol: m.tipo_rol,
          nivel: m.nivel || 1,
          nombre_rol: m.nombre_rol || m.tipo_rol,
          puede_crear_hijos: m.puede_crear_hijos || false,
          capacidades: capacidades
        }))
      });
    }

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno de servidor', detalle: error.message });
  }
}

async function seleccionarContexto(req, res) {
  try {
    const { token_preliminar, membresia_id } = req.body;
    if (!token_preliminar || !membresia_id) {
      return res.status(400).json({ error: 'token_preliminar y membresia_id requeridos' });
    }

    const { verificarToken } = require('../utilidades/jwt');
    const payload = verificarToken(token_preliminar);
    const uid = payload.usuario_id;

    const membresia = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.estado_membresia, m.nivel, m.nombre_rol, m.puede_crear_hijos, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [membresia_id, uid, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresia no encontrada o inactiva' });
    }

    const m = membresia.rows[0];
    
    const capacidadesResult = await consulta(
      `SELECT c.codigo FROM membresia_capacidades mc
       INNER JOIN capacidades c ON mc.capacidad_id = c.capacidad_id
       WHERE mc.membresia_id = $1`,
      [membresia_id]
    );
    const capacidades = capacidadesResult.rows.map(r => r.codigo);

    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol,
      correo: payload.correo
    });

    return res.status(200).json({
      tipo: 'login_directo',
      token_sesion: tokenSesion,
      usuario: {
        nombre: payload.nombre || 'Usuario',
        correo: payload.correo,
        rol: m.tipo_rol,
        nivel: m.nivel || 1,
        nombre_rol: m.nombre_rol || m.tipo_rol,
        puede_crear_hijos: m.puede_crear_hijos || false,
        capacidades: capacidades
      },
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      membresia_id: m.membresia_id
    });

  } catch (error) {
    console.error('Error seleccionar contexto:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}

async function switchContext(req, res) {
  try {
    const { membresia_id } = req.body;
    const uid = req.usuario_id;

    const membresia = await consulta(
      'SELECT m.membresia_id, m.institucion_id, m.tipo_rol, m.nivel, m.nombre_rol, m.puede_crear_hijos, i.nombre_institucion, i.institucion_slug FROM membresias m JOIN instituciones i ON m.institucion_id = i.institucion_id WHERE m.membresia_id = $1 AND m.usuario_id = $2 AND m.estado_membresia = $3',
      [membresia_id, uid, 'active']
    );

    if (membresia.rows.length === 0) {
      return res.status(404).json({ error: 'Membresia no encontrada' });
    }

    const m = membresia.rows[0];
    const { generarToken } = require('../utilidades/jwt');
    const tokenSesion = generarToken({
      usuario_id: uid,
      membresia_id: m.membresia_id,
      institucion_id: m.institucion_id,
      tipo_rol: m.tipo_rol
    });

    return res.status(200).json({
      token_sesion: tokenSesion,
      institucion: {
        id: m.institucion_id,
        nombre: m.nombre_institucion,
        slug: m.institucion_slug
      },
      rol: m.tipo_rol,
      nivel: m.nivel || 1,
      nombre_rol: m.nombre_rol || m.tipo_rol,
      puede_crear_hijos: m.puede_crear_hijos || false
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = { login, seleccionarContexto, switchContext };
EOF

echo "✅ Auth modificado"

# ───────────────────────────────────────────────────────────────
# PASO 7: FRONTEND - SERVICIO
# ───────────────────────────────────────────────────────────────
echo "🖥️  PASO 7: Creando frontend..."

cat > ~/ACADEMIA-ADDISON/js/servicios/jerarquia.servicio.js << 'EOF'
class JerarquiaServicio {
    constructor() {
        this.api = window.api;
    }
    async crearUsuarioHijo(datos) {
        return await this.api._llamar('/jerarquia/crear', { method: 'POST', body: JSON.stringify(datos) });
    }
    async obtenerMisHijos() {
        return await this.api._llamar('/jerarquia/mis-hijos');
    }
    async obtenerMisCapacidades() {
        return await this.api._llamar('/jerarquia/mis-capacidades');
    }
    async obtenerCapacidadesDelegables() {
        return await this.api._llamar('/jerarquia/capacidades-delegables');
    }
    async modificarCapacidadesHijo(membresiaId, datos) {
        return await this.api._llamar(`/jerarquia/${membresiaId}/capacidades`, { method: 'PUT', body: JSON.stringify(datos) });
    }
    async eliminarHijo(membresiaId) {
        return await this.api._llamar(`/jerarquia/${membresiaId}`, { method: 'DELETE' });
    }
    async arbolCompleto() {
        return await this.api._llamar('/jerarquia/arbol-completo');
    }
}
window.jerarquiaServicio = new JerarquiaServicio();
EOF

# ───────────────────────────────────────────────────────────────
# PASO 8: FRONTEND - COMPONENTE
# ───────────────────────────────────────────────────────────────
cat > ~/ACADEMIA-ADDISON/js/jerarquia.gestion.js << 'EOF'
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
EOF

echo "✅ Frontend creado"

# ───────────────────────────────────────────────────────────────
# PASO 9: REINICIAR SERVIDOR
# ───────────────────────────────────────────────────────────────
echo "🚀 PASO 9: Reiniciando servidor..."

cd ~/ACADEMIA-ADDISON/api
pm2 restart api-addison

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ INSTALACIÓN COMPLETADA                                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Archivos creados:"
echo "  - api/controladores/jerarquia.controlador.js"
echo "  - api/middleware/jerarquia.middleware.js"
echo "  - api/rutas/jerarquia.rutas.js"
echo "  - api/controladores/auth.controlador.js (modificado)"
echo "  - api/servidor.js (modificado)"
echo "  - js/servicios/jerarquia.servicio.js"
echo "  - js/jerarquia.gestion.js"
echo ""
echo "Backups creados:"
echo "  - backup_*.sql"
echo "  - auth.controlador.js.BAK"
echo "  - servidor.js.BAK"
echo ""
echo "Para probar: haz login con tu cuenta superadmin y verifica"
echo "que la respuesta JSON incluye: nivel, nombre_rol, capacidades"

