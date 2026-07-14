-- ============================================
-- TABLAS ACADEMIA ADDISON v3.0
-- ============================================

-- Tabla 1: Usuarios (Identidad Global)
CREATE TABLE IF NOT EXISTS usuarios (
    usuario_id VARCHAR(36) PRIMARY KEY,
    correo_electronico VARCHAR(255) UNIQUE NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    avatar_url TEXT,
    auth_provider VARCHAR(20) DEFAULT 'firebase',
    estado_usuario VARCHAR(20) DEFAULT 'active' CHECK (estado_usuario IN ('active', 'banned', 'pending_verification')),
    creado_en TIMESTAMP DEFAULT NOW(),
    ultimo_login TIMESTAMP
);

-- Tabla 2: Instituciones
CREATE TABLE IF NOT EXISTS instituciones (
    institucion_id SERIAL PRIMARY KEY,
    nombre_institucion VARCHAR(255) NOT NULL,
    institucion_slug VARCHAR(255) UNIQUE NOT NULL,
    pais_codigo VARCHAR(5) DEFAULT 'PE',
    superadmin_id VARCHAR(36) REFERENCES usuarios(usuario_id),
    institucion_status VARCHAR(20) DEFAULT 'active' CHECK (institucion_status IN ('trial', 'active', 'suspended', 'closed')),
    settings JSONB DEFAULT '{}',
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla 3: Membresias (Realidad Paralela)
CREATE TABLE IF NOT EXISTS membresias (
    membresia_id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL REFERENCES usuarios(usuario_id),
    institucion_id INTEGER NOT NULL REFERENCES instituciones(institucion_id),
    tipo_rol VARCHAR(20) NOT NULL CHECK (tipo_rol IN ('superadmin', 'director', 'auxiliary', 'professor', 'student')),
    estado_membresia VARCHAR(20) DEFAULT 'active' CHECK (estado_membresia IN ('active', 'suspended', 'expired', 'invited', 'rejected')),
    invitado_por VARCHAR(36) REFERENCES usuarios(usuario_id),
    aceptado_en TIMESTAMP,
    creado_en TIMESTAMP DEFAULT NOW(),
    metadata_rol JSONB DEFAULT '{}',
    UNIQUE(usuario_id, institucion_id, tipo_rol)
);

-- Tabla 4: Grupos Academicos
CREATE TABLE IF NOT EXISTS grupos_academicos (
    grupo_id SERIAL PRIMARY KEY,
    institucion_id INTEGER NOT NULL REFERENCES instituciones(institucion_id),
    nombre_grupo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'draft', 'archived')),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla 5: Cursos
CREATE TABLE IF NOT EXISTS cursos (
    curso_id SERIAL PRIMARY KEY,
    institucion_id INTEGER NOT NULL REFERENCES instituciones(institucion_id),
    grupo_id INTEGER REFERENCES grupos_academicos(grupo_id),
    nombre_curso VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'draft', 'archived')),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla 6: Temas
CREATE TABLE IF NOT EXISTS temas (
    tema_id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL REFERENCES cursos(curso_id),
    nombre_tema VARCHAR(255) NOT NULL,
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'draft', 'archived')),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla 7: Subtemas
CREATE TABLE IF NOT EXISTS subtemas (
    subtema_id SERIAL PRIMARY KEY,
    tema_id INTEGER NOT NULL REFERENCES temas(tema_id),
    nombre_subtema VARCHAR(255) NOT NULL,
    orden INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'active' CHECK (estado IN ('active', 'draft', 'archived')),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Indices para velocidad
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_membresias_usuario ON membresias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_membresias_institucion ON membresias(institucion_id);
CREATE INDEX IF NOT EXISTS idx_cursos_grupo ON cursos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_temas_curso ON temas(curso_id);
CREATE INDEX IF NOT EXISTS idx_subtemas_tema ON subtemas(tema_id);

-- Mensaje de confirmacion
SELECT 'Tablas creadas correctamente' as resultado;
