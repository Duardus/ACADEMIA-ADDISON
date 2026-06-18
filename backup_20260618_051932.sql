--
-- PostgreSQL database dump
--

\restrict AfJ76Q2tfzUIyenmbIvojFT8bghfXv7qbMkdAAykRA8aTbtiB2q9jZOGWJBc2VO

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg13+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asistencia_clases; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.asistencia_clases (
    asistencia_id integer NOT NULL,
    sala_id character varying(255),
    alumno_id character varying(36),
    profesor_id character varying(36),
    institucion_id integer,
    entro_en timestamp without time zone DEFAULT now(),
    salio_en timestamp without time zone,
    duracion_minutos integer,
    calificacion_post_clase integer
);


ALTER TABLE public.asistencia_clases OWNER TO addison;

--
-- Name: asistencia_clases_asistencia_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.asistencia_clases_asistencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asistencia_clases_asistencia_id_seq OWNER TO addison;

--
-- Name: asistencia_clases_asistencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.asistencia_clases_asistencia_id_seq OWNED BY public.asistencia_clases.asistencia_id;


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.auditoria (
    auditoria_id integer NOT NULL,
    actor_id character varying(36),
    actor_rol character varying(20),
    accion character varying(20),
    entidad_tipo character varying(50),
    entidad_id character varying(50),
    institucion_id integer,
    ip_address inet,
    antes_estado jsonb,
    despues_estado jsonb,
    justificacion text,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT auditoria_accion_check CHECK (((accion)::text = ANY ((ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'LOGIN'::character varying, 'LOGOUT'::character varying, 'GHOST_ENTER'::character varying, 'GHOST_EXIT'::character varying, 'SWITCH_CONTEXT'::character varying, 'PAYMENT_REGISTER'::character varying, 'GRADE_EDIT'::character varying])::text[])))
);


ALTER TABLE public.auditoria OWNER TO addison;

--
-- Name: auditoria_auditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.auditoria_auditoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.auditoria_auditoria_id_seq OWNER TO addison;

--
-- Name: auditoria_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.auditoria_auditoria_id_seq OWNED BY public.auditoria.auditoria_id;


--
-- Name: calendario_academico; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.calendario_academico (
    evento_id integer NOT NULL,
    institucion_id integer,
    titulo_evento character varying(255) NOT NULL,
    tipo_evento character varying(20),
    fecha_inicio date,
    fecha_fin date,
    es_nacional boolean DEFAULT false,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT calendario_academico_tipo_evento_check CHECK (((tipo_evento)::text = ANY ((ARRAY['feriado'::character varying, 'simulacro'::character varying, 'reunion'::character varying, 'vacaciones'::character varying, 'examen'::character varying])::text[])))
);


ALTER TABLE public.calendario_academico OWNER TO addison;

--
-- Name: calendario_academico_evento_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.calendario_academico_evento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calendario_academico_evento_id_seq OWNER TO addison;

--
-- Name: calendario_academico_evento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.calendario_academico_evento_id_seq OWNED BY public.calendario_academico.evento_id;


--
-- Name: calificaciones_clase; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.calificaciones_clase (
    calificacion_id integer NOT NULL,
    alumno_id character varying(36),
    sala_id character varying(255),
    estrellas integer,
    comentario character varying(280),
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT calificaciones_clase_estrellas_check CHECK (((estrellas >= 1) AND (estrellas <= 5)))
);


ALTER TABLE public.calificaciones_clase OWNER TO addison;

--
-- Name: calificaciones_clase_calificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.calificaciones_clase_calificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calificaciones_clase_calificacion_id_seq OWNER TO addison;

--
-- Name: calificaciones_clase_calificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.calificaciones_clase_calificacion_id_seq OWNED BY public.calificaciones_clase.calificacion_id;


--
-- Name: calificaciones_dificultad; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.calificaciones_dificultad (
    calificacion_id integer NOT NULL,
    alumno_id character varying(36),
    pregunta_id integer,
    estrellas integer,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT calificaciones_dificultad_estrellas_check CHECK (((estrellas >= 1) AND (estrellas <= 5)))
);


ALTER TABLE public.calificaciones_dificultad OWNER TO addison;

--
-- Name: calificaciones_dificultad_calificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.calificaciones_dificultad_calificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calificaciones_dificultad_calificacion_id_seq OWNER TO addison;

--
-- Name: calificaciones_dificultad_calificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.calificaciones_dificultad_calificacion_id_seq OWNED BY public.calificaciones_dificultad.calificacion_id;


--
-- Name: cursos; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.cursos (
    curso_id integer NOT NULL,
    institucion_id integer NOT NULL,
    grupo_id integer,
    nombre_curso character varying(255) NOT NULL,
    descripcion text,
    orden integer DEFAULT 0,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT cursos_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.cursos OWNER TO addison;

--
-- Name: cursos_curso_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.cursos_curso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cursos_curso_id_seq OWNER TO addison;

--
-- Name: cursos_curso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.cursos_curso_id_seq OWNED BY public.cursos.curso_id;


--
-- Name: examen_preguntas; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.examen_preguntas (
    examen_id integer NOT NULL,
    pregunta_id integer NOT NULL,
    orden integer DEFAULT 0,
    puntaje integer DEFAULT 1
);


ALTER TABLE public.examen_preguntas OWNER TO addison;

--
-- Name: examenes; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.examenes (
    examen_id integer NOT NULL,
    subtema_id integer,
    profesor_id character varying(36),
    institucion_id integer,
    titulo_examen character varying(255) NOT NULL,
    descripcion text,
    tiempo_minutos integer DEFAULT 20,
    num_preguntas integer DEFAULT 20,
    puntaje_aprobacion integer DEFAULT 13,
    estado character varying(20) DEFAULT 'draft'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    abierto_en timestamp without time zone,
    cerrado_en timestamp without time zone,
    CONSTRAINT examenes_estado_check CHECK (((estado)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'open'::character varying, 'closed'::character varying, 'graded'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.examenes OWNER TO addison;

--
-- Name: examenes_examen_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.examenes_examen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.examenes_examen_id_seq OWNER TO addison;

--
-- Name: examenes_examen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.examenes_examen_id_seq OWNED BY public.examenes.examen_id;


--
-- Name: grabaciones; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.grabaciones (
    grabacion_id integer NOT NULL,
    sala_id character varying(255) NOT NULL,
    nombre_sala character varying(255),
    profesor_id character varying(36) NOT NULL,
    institucion_id integer NOT NULL,
    egress_id character varying(255),
    archivo_path character varying(500),
    estado character varying(20) DEFAULT 'grabando'::character varying,
    duracion_segundos integer,
    tamano_bytes bigint,
    creado_en timestamp without time zone DEFAULT now(),
    finalizado_en timestamp without time zone,
    expira_en timestamp without time zone DEFAULT (now() + '7 days'::interval),
    CONSTRAINT grabaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['grabando'::character varying, 'completada'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.grabaciones OWNER TO addison;

--
-- Name: grabaciones_grabacion_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.grabaciones_grabacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grabaciones_grabacion_id_seq OWNER TO addison;

--
-- Name: grabaciones_grabacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.grabaciones_grabacion_id_seq OWNED BY public.grabaciones.grabacion_id;


--
-- Name: grupos_academicos; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.grupos_academicos (
    grupo_id integer NOT NULL,
    institucion_id integer NOT NULL,
    nombre_grupo character varying(255) NOT NULL,
    descripcion text,
    orden integer DEFAULT 0,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT grupos_academicos_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.grupos_academicos OWNER TO addison;

--
-- Name: grupos_academicos_grupo_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.grupos_academicos_grupo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.grupos_academicos_grupo_id_seq OWNER TO addison;

--
-- Name: grupos_academicos_grupo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.grupos_academicos_grupo_id_seq OWNED BY public.grupos_academicos.grupo_id;


--
-- Name: horario_semanal; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.horario_semanal (
    horario_id integer NOT NULL,
    institucion_id integer,
    curso_id integer,
    profesor_id character varying(36),
    dia_semana integer,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    sala_programada character varying(255),
    es_recurrente boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT horario_semanal_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


ALTER TABLE public.horario_semanal OWNER TO addison;

--
-- Name: horario_semanal_horario_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.horario_semanal_horario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horario_semanal_horario_id_seq OWNER TO addison;

--
-- Name: horario_semanal_horario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.horario_semanal_horario_id_seq OWNED BY public.horario_semanal.horario_id;


--
-- Name: instituciones; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.instituciones (
    institucion_id integer NOT NULL,
    nombre_institucion character varying(255) NOT NULL,
    institucion_slug character varying(255) NOT NULL,
    pais_codigo character varying(5) DEFAULT 'PE'::character varying,
    superadmin_id character varying(36),
    institucion_status character varying(20) DEFAULT 'active'::character varying,
    settings jsonb DEFAULT '{}'::jsonb,
    creado_en timestamp without time zone DEFAULT now(),
    actualizado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT instituciones_institucion_status_check CHECK (((institucion_status)::text = ANY ((ARRAY['trial'::character varying, 'active'::character varying, 'suspended'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.instituciones OWNER TO addison;

--
-- Name: instituciones_institucion_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.instituciones_institucion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instituciones_institucion_id_seq OWNER TO addison;

--
-- Name: instituciones_institucion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.instituciones_institucion_id_seq OWNED BY public.instituciones.institucion_id;


--
-- Name: intentos_examen; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.intentos_examen (
    intento_id integer NOT NULL,
    examen_id integer,
    alumno_id character varying(36),
    puntaje_obtenido integer,
    total_preguntas integer,
    estado character varying(20) DEFAULT 'in_progress'::character varying,
    iniciado_en timestamp without time zone DEFAULT now(),
    finalizado_en timestamp without time zone,
    tiempo_usado_segundos integer,
    CONSTRAINT intentos_examen_estado_check CHECK (((estado)::text = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'abandoned'::character varying, 'timed_out'::character varying])::text[])))
);


ALTER TABLE public.intentos_examen OWNER TO addison;

--
-- Name: intentos_examen_intento_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.intentos_examen_intento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.intentos_examen_intento_id_seq OWNER TO addison;

--
-- Name: intentos_examen_intento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.intentos_examen_intento_id_seq OWNED BY public.intentos_examen.intento_id;


--
-- Name: materiales; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.materiales (
    material_id integer NOT NULL,
    curso_id integer,
    tema_id integer,
    subtema_id integer,
    nombre_material character varying(255) NOT NULL,
    tipo_material character varying(20),
    url_archivo text,
    es_obligatorio boolean DEFAULT false,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT materiales_tipo_material_check CHECK (((tipo_material)::text = ANY ((ARRAY['pdf'::character varying, 'video'::character varying, 'audio'::character varying, 'imagen'::character varying, 'link'::character varying])::text[])))
);


ALTER TABLE public.materiales OWNER TO addison;

--
-- Name: materiales_material_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.materiales_material_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materiales_material_id_seq OWNER TO addison;

--
-- Name: materiales_material_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.materiales_material_id_seq OWNED BY public.materiales.material_id;


--
-- Name: membresias; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.membresias (
    membresia_id integer NOT NULL,
    usuario_id character varying(36) NOT NULL,
    institucion_id integer NOT NULL,
    tipo_rol character varying(20) NOT NULL,
    estado_membresia character varying(20) DEFAULT 'active'::character varying,
    invitado_por character varying(36),
    aceptado_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now(),
    metadata_rol jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT membresias_estado_membresia_check CHECK (((estado_membresia)::text = ANY ((ARRAY['active'::character varying, 'suspended'::character varying, 'expired'::character varying, 'invited'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT membresias_tipo_rol_check CHECK (((tipo_rol)::text = ANY ((ARRAY['superadmin'::character varying, 'director'::character varying, 'auxiliary'::character varying, 'professor'::character varying, 'student'::character varying])::text[])))
);


ALTER TABLE public.membresias OWNER TO addison;

--
-- Name: membresias_membresia_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.membresias_membresia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.membresias_membresia_id_seq OWNER TO addison;

--
-- Name: membresias_membresia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.membresias_membresia_id_seq OWNED BY public.membresias.membresia_id;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.notificaciones (
    notificacion_id integer NOT NULL,
    usuario_id character varying(36),
    institucion_id integer,
    tipo_notificacion character varying(50),
    titulo character varying(255),
    mensaje text,
    leida boolean DEFAULT false,
    canal character varying(20),
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT notificaciones_canal_check CHECK (((canal)::text = ANY ((ARRAY['in_app'::character varying, 'email'::character varying, 'push'::character varying])::text[])))
);


ALTER TABLE public.notificaciones OWNER TO addison;

--
-- Name: notificaciones_notificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.notificaciones_notificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notificaciones_notificacion_id_seq OWNER TO addison;

--
-- Name: notificaciones_notificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.notificaciones_notificacion_id_seq OWNED BY public.notificaciones.notificacion_id;


--
-- Name: pagos_alumnos; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.pagos_alumnos (
    pago_id integer NOT NULL,
    alumno_id character varying(36),
    institucion_id integer,
    monto numeric(10,2) NOT NULL,
    descuento_porcentaje numeric(5,2) DEFAULT 0,
    descuento_motivo character varying(255),
    monto_final numeric(10,2),
    metodo_pago character varying(20),
    estado_pago character varying(20) DEFAULT 'pending'::character varying,
    voucher_url text,
    recibo_numero character varying(50),
    vencimiento_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT pagos_alumnos_estado_pago_check CHECK (((estado_pago)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'completed'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT pagos_alumnos_metodo_pago_check CHECK (((metodo_pago)::text = ANY ((ARRAY['efectivo'::character varying, 'transferencia'::character varying, 'tarjeta'::character varying, 'yape'::character varying, 'plin'::character varying])::text[])))
);


ALTER TABLE public.pagos_alumnos OWNER TO addison;

--
-- Name: pagos_alumnos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.pagos_alumnos_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_alumnos_pago_id_seq OWNER TO addison;

--
-- Name: pagos_alumnos_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.pagos_alumnos_pago_id_seq OWNED BY public.pagos_alumnos.pago_id;


--
-- Name: pagos_profesores; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.pagos_profesores (
    pago_id integer NOT NULL,
    profesor_id character varying(36),
    institucion_id integer,
    horas_dictadas numeric(5,2),
    tarifa_hora numeric(10,2),
    monto_total numeric(10,2),
    periodo_inicio date,
    periodo_fin date,
    estado_pago character varying(20) DEFAULT 'pending'::character varying,
    creado_en timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pagos_profesores OWNER TO addison;

--
-- Name: pagos_profesores_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.pagos_profesores_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_profesores_pago_id_seq OWNER TO addison;

--
-- Name: pagos_profesores_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.pagos_profesores_pago_id_seq OWNED BY public.pagos_profesores.pago_id;


--
-- Name: papelera; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.papelera (
    papelera_id integer NOT NULL,
    entidad_tipo character varying(50) NOT NULL,
    entidad_id character varying(50) NOT NULL,
    entidad_datos jsonb,
    padre_id character varying(50),
    padre_tipo character varying(50),
    eliminado_por character varying(36),
    institucion_id integer,
    motivo_eliminacion character varying(255),
    eliminado_en timestamp without time zone DEFAULT now(),
    expira_en timestamp without time zone DEFAULT (now() + '30 days'::interval),
    restaurado boolean DEFAULT false,
    restaurado_en timestamp without time zone
);


ALTER TABLE public.papelera OWNER TO addison;

--
-- Name: papelera_papelera_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.papelera_papelera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.papelera_papelera_id_seq OWNER TO addison;

--
-- Name: papelera_papelera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.papelera_papelera_id_seq OWNED BY public.papelera.papelera_id;


--
-- Name: preguntas; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.preguntas (
    pregunta_id integer NOT NULL,
    subtema_id integer,
    profesor_id character varying(36),
    institucion_id integer,
    enunciado text NOT NULL,
    tipo_pregunta character varying(20) DEFAULT 'multiple'::character varying,
    opciones jsonb DEFAULT '[]'::jsonb,
    respuesta_correcta integer,
    explicacion text,
    dificultad integer DEFAULT 3,
    estado character varying(20) DEFAULT 'active'::character varying,
    version integer DEFAULT 1,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT preguntas_dificultad_check CHECK (((dificultad >= 1) AND (dificultad <= 5))),
    CONSTRAINT preguntas_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'deleted'::character varying])::text[]))),
    CONSTRAINT preguntas_tipo_pregunta_check CHECK (((tipo_pregunta)::text = ANY ((ARRAY['multiple'::character varying, 'verdadero_falso'::character varying, 'abierta'::character varying])::text[])))
);


ALTER TABLE public.preguntas OWNER TO addison;

--
-- Name: preguntas_pregunta_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.preguntas_pregunta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.preguntas_pregunta_id_seq OWNER TO addison;

--
-- Name: preguntas_pregunta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.preguntas_pregunta_id_seq OWNED BY public.preguntas.pregunta_id;


--
-- Name: progreso_alumno; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.progreso_alumno (
    progreso_id integer NOT NULL,
    alumno_id character varying(36),
    teoria_id integer,
    curso_id integer,
    completado boolean DEFAULT false,
    xp_ganado integer DEFAULT 0,
    completado_en timestamp without time zone
);


ALTER TABLE public.progreso_alumno OWNER TO addison;

--
-- Name: progreso_alumno_progreso_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.progreso_alumno_progreso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progreso_alumno_progreso_id_seq OWNER TO addison;

--
-- Name: progreso_alumno_progreso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.progreso_alumno_progreso_id_seq OWNED BY public.progreso_alumno.progreso_id;


--
-- Name: respuestas_alumno; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.respuestas_alumno (
    respuesta_id integer NOT NULL,
    intento_id integer,
    pregunta_id integer,
    respuesta_seleccionada integer,
    es_correcta boolean,
    tiempo_respuesta_segundos integer,
    creado_en timestamp without time zone DEFAULT now()
);


ALTER TABLE public.respuestas_alumno OWNER TO addison;

--
-- Name: respuestas_alumno_respuesta_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.respuestas_alumno_respuesta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respuestas_alumno_respuesta_id_seq OWNER TO addison;

--
-- Name: respuestas_alumno_respuesta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.respuestas_alumno_respuesta_id_seq OWNED BY public.respuestas_alumno.respuesta_id;


--
-- Name: subtemas; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.subtemas (
    subtema_id integer NOT NULL,
    tema_id integer NOT NULL,
    nombre_subtema character varying(255) NOT NULL,
    orden integer DEFAULT 0,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT subtemas_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.subtemas OWNER TO addison;

--
-- Name: subtemas_subtema_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.subtemas_subtema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subtemas_subtema_id_seq OWNER TO addison;

--
-- Name: subtemas_subtema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.subtemas_subtema_id_seq OWNED BY public.subtemas.subtema_id;


--
-- Name: temas; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.temas (
    tema_id integer NOT NULL,
    curso_id integer NOT NULL,
    nombre_tema character varying(255) NOT NULL,
    orden integer DEFAULT 0,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT temas_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.temas OWNER TO addison;

--
-- Name: temas_tema_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.temas_tema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temas_tema_id_seq OWNER TO addison;

--
-- Name: temas_tema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.temas_tema_id_seq OWNED BY public.temas.tema_id;


--
-- Name: teorias; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.teorias (
    teoria_id integer NOT NULL,
    subtema_id integer,
    titulo_teoria character varying(255) NOT NULL,
    contenido_html text,
    orden integer DEFAULT 0,
    es_obligatoria boolean DEFAULT false,
    estado character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    CONSTRAINT teorias_estado_check CHECK (((estado)::text = ANY ((ARRAY['active'::character varying, 'draft'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.teorias OWNER TO addison;

--
-- Name: teorias_teoria_id_seq; Type: SEQUENCE; Schema: public; Owner: addison
--

CREATE SEQUENCE public.teorias_teoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teorias_teoria_id_seq OWNER TO addison;

--
-- Name: teorias_teoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: addison
--

ALTER SEQUENCE public.teorias_teoria_id_seq OWNED BY public.teorias.teoria_id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: addison
--

CREATE TABLE public.usuarios (
    usuario_id character varying(36) NOT NULL,
    correo_electronico character varying(255) NOT NULL,
    nombre_completo character varying(255) NOT NULL,
    telefono character varying(50),
    avatar_url text,
    auth_provider character varying(20) DEFAULT 'firebase'::character varying,
    estado_usuario character varying(20) DEFAULT 'active'::character varying,
    creado_en timestamp without time zone DEFAULT now(),
    ultimo_login timestamp without time zone,
    CONSTRAINT usuarios_estado_usuario_check CHECK (((estado_usuario)::text = ANY ((ARRAY['active'::character varying, 'banned'::character varying, 'pending_verification'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO addison;

--
-- Name: asistencia_clases asistencia_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.asistencia_clases ALTER COLUMN asistencia_id SET DEFAULT nextval('public.asistencia_clases_asistencia_id_seq'::regclass);


--
-- Name: auditoria auditoria_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN auditoria_id SET DEFAULT nextval('public.auditoria_auditoria_id_seq'::regclass);


--
-- Name: calendario_academico evento_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calendario_academico ALTER COLUMN evento_id SET DEFAULT nextval('public.calendario_academico_evento_id_seq'::regclass);


--
-- Name: calificaciones_clase calificacion_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_clase ALTER COLUMN calificacion_id SET DEFAULT nextval('public.calificaciones_clase_calificacion_id_seq'::regclass);


--
-- Name: calificaciones_dificultad calificacion_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_dificultad ALTER COLUMN calificacion_id SET DEFAULT nextval('public.calificaciones_dificultad_calificacion_id_seq'::regclass);


--
-- Name: cursos curso_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.cursos ALTER COLUMN curso_id SET DEFAULT nextval('public.cursos_curso_id_seq'::regclass);


--
-- Name: examenes examen_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examenes ALTER COLUMN examen_id SET DEFAULT nextval('public.examenes_examen_id_seq'::regclass);


--
-- Name: grabaciones grabacion_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grabaciones ALTER COLUMN grabacion_id SET DEFAULT nextval('public.grabaciones_grabacion_id_seq'::regclass);


--
-- Name: grupos_academicos grupo_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grupos_academicos ALTER COLUMN grupo_id SET DEFAULT nextval('public.grupos_academicos_grupo_id_seq'::regclass);


--
-- Name: horario_semanal horario_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.horario_semanal ALTER COLUMN horario_id SET DEFAULT nextval('public.horario_semanal_horario_id_seq'::regclass);


--
-- Name: instituciones institucion_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.instituciones ALTER COLUMN institucion_id SET DEFAULT nextval('public.instituciones_institucion_id_seq'::regclass);


--
-- Name: intentos_examen intento_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.intentos_examen ALTER COLUMN intento_id SET DEFAULT nextval('public.intentos_examen_intento_id_seq'::regclass);


--
-- Name: materiales material_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.materiales ALTER COLUMN material_id SET DEFAULT nextval('public.materiales_material_id_seq'::regclass);


--
-- Name: membresias membresia_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias ALTER COLUMN membresia_id SET DEFAULT nextval('public.membresias_membresia_id_seq'::regclass);


--
-- Name: notificaciones notificacion_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN notificacion_id SET DEFAULT nextval('public.notificaciones_notificacion_id_seq'::regclass);


--
-- Name: pagos_alumnos pago_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_alumnos ALTER COLUMN pago_id SET DEFAULT nextval('public.pagos_alumnos_pago_id_seq'::regclass);


--
-- Name: pagos_profesores pago_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_profesores ALTER COLUMN pago_id SET DEFAULT nextval('public.pagos_profesores_pago_id_seq'::regclass);


--
-- Name: papelera papelera_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.papelera ALTER COLUMN papelera_id SET DEFAULT nextval('public.papelera_papelera_id_seq'::regclass);


--
-- Name: preguntas pregunta_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.preguntas ALTER COLUMN pregunta_id SET DEFAULT nextval('public.preguntas_pregunta_id_seq'::regclass);


--
-- Name: progreso_alumno progreso_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.progreso_alumno ALTER COLUMN progreso_id SET DEFAULT nextval('public.progreso_alumno_progreso_id_seq'::regclass);


--
-- Name: respuestas_alumno respuesta_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.respuestas_alumno ALTER COLUMN respuesta_id SET DEFAULT nextval('public.respuestas_alumno_respuesta_id_seq'::regclass);


--
-- Name: subtemas subtema_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.subtemas ALTER COLUMN subtema_id SET DEFAULT nextval('public.subtemas_subtema_id_seq'::regclass);


--
-- Name: temas tema_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.temas ALTER COLUMN tema_id SET DEFAULT nextval('public.temas_tema_id_seq'::regclass);


--
-- Name: teorias teoria_id; Type: DEFAULT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.teorias ALTER COLUMN teoria_id SET DEFAULT nextval('public.teorias_teoria_id_seq'::regclass);


--
-- Data for Name: asistencia_clases; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.asistencia_clases (asistencia_id, sala_id, alumno_id, profesor_id, institucion_id, entro_en, salio_en, duracion_minutos, calificacion_post_clase) FROM stdin;
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.auditoria (auditoria_id, actor_id, actor_rol, accion, entidad_tipo, entidad_id, institucion_id, ip_address, antes_estado, despues_estado, justificacion, creado_en) FROM stdin;
\.


--
-- Data for Name: calendario_academico; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.calendario_academico (evento_id, institucion_id, titulo_evento, tipo_evento, fecha_inicio, fecha_fin, es_nacional, creado_en) FROM stdin;
\.


--
-- Data for Name: calificaciones_clase; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.calificaciones_clase (calificacion_id, alumno_id, sala_id, estrellas, comentario, creado_en) FROM stdin;
\.


--
-- Data for Name: calificaciones_dificultad; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.calificaciones_dificultad (calificacion_id, alumno_id, pregunta_id, estrellas, creado_en) FROM stdin;
\.


--
-- Data for Name: cursos; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.cursos (curso_id, institucion_id, grupo_id, nombre_curso, descripcion, orden, estado, creado_en) FROM stdin;
2	2	2	Aritmética	Números, fracciones, porcentajes	1	active	2026-06-16 17:25:43.310707
3	2	2	Álgebra	Ecuaciones, polinomios, factorización	2	active	2026-06-16 17:25:43.312258
4	2	2	Geometría	Figuras, áreas, volúmenes	3	active	2026-06-16 17:25:43.3133
5	2	2	Trigonometría	Razones trigonométricas, identidades	4	active	2026-06-16 17:25:43.314313
6	2	3	Aritmética Avanzada	Proporciones, regla de tres, interés	1	active	2026-06-16 17:25:43.315473
7	2	3	Álgebra Superior	Sistemas de ecuaciones, matrices	2	active	2026-06-16 17:25:43.316466
8	2	3	Geometría Analítica	Recta, circunferencia, cónica	3	active	2026-06-16 17:25:43.317473
9	2	4	Razonamiento Matemático	Series, analogías, problemas	1	active	2026-06-16 17:25:43.318403
10	2	4	Razonamiento Verbal	Sinónimos, antónimos, comprensión	2	active	2026-06-16 17:25:43.319346
11	2	5	Matemática Básica	Repaso fundamental pre-academia	1	active	2026-06-16 17:25:43.320516
12	2	5	Lenguaje	Gramática, ortografía, redacción	2	active	2026-06-16 17:25:43.321516
13	2	2	geometria	\N	1	active	2026-06-16 18:24:23.048883
\.


--
-- Data for Name: examen_preguntas; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.examen_preguntas (examen_id, pregunta_id, orden, puntaje) FROM stdin;
\.


--
-- Data for Name: examenes; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.examenes (examen_id, subtema_id, profesor_id, institucion_id, titulo_examen, descripcion, tiempo_minutos, num_preguntas, puntaje_aprobacion, estado, creado_en, abierto_en, cerrado_en) FROM stdin;
\.


--
-- Data for Name: grabaciones; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.grabaciones (grabacion_id, sala_id, nombre_sala, profesor_id, institucion_id, egress_id, archivo_path, estado, duracion_segundos, tamano_bytes, creado_en, finalizado_en, expira_en) FROM stdin;
\.


--
-- Data for Name: grupos_academicos; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.grupos_academicos (grupo_id, institucion_id, nombre_grupo, descripcion, orden, estado, creado_en) FROM stdin;
2	2	Grupo A	Grupo A - Ciclo regular	1	active	2026-06-16 17:25:43.306235
3	2	Grupo B	Grupo B - Ciclo regular	2	active	2026-06-16 17:25:43.307705
4	2	Grupo C	Grupo C - Ciclo intensivo	3	active	2026-06-16 17:25:43.30865
5	2	Grupo D	Grupo D - Preparación pre	4	active	2026-06-16 17:25:43.30964
\.


--
-- Data for Name: horario_semanal; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.horario_semanal (horario_id, institucion_id, curso_id, profesor_id, dia_semana, hora_inicio, hora_fin, sala_programada, es_recurrente, creado_en) FROM stdin;
\.


--
-- Data for Name: instituciones; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.instituciones (institucion_id, nombre_institucion, institucion_slug, pais_codigo, superadmin_id, institucion_status, settings, creado_en, actualizado_en) FROM stdin;
2	Sistema Addison	sistema	PE	fs0eiP2Uk3ezZVDTfNjHU6PtPUh2	active	{}	2026-06-16 06:31:55.536219	2026-06-16 06:31:55.536219
\.


--
-- Data for Name: intentos_examen; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.intentos_examen (intento_id, examen_id, alumno_id, puntaje_obtenido, total_preguntas, estado, iniciado_en, finalizado_en, tiempo_usado_segundos) FROM stdin;
\.


--
-- Data for Name: materiales; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.materiales (material_id, curso_id, tema_id, subtema_id, nombre_material, tipo_material, url_archivo, es_obligatorio, estado, creado_en) FROM stdin;
\.


--
-- Data for Name: membresias; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.membresias (membresia_id, usuario_id, institucion_id, tipo_rol, estado_membresia, invitado_por, aceptado_en, creado_en, metadata_rol) FROM stdin;
1	fs0eiP2Uk3ezZVDTfNjHU6PtPUh2	2	superadmin	active	fs0eiP2Uk3ezZVDTfNjHU6PtPUh2	\N	2026-06-16 06:31:55.538077	{}
3	temp_1781635487766_ucnie2wr2	2	superadmin	active	fs0eiP2Uk3ezZVDTfNjHU6PtPUh2	\N	2026-06-16 18:44:47.766603	{}
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.notificaciones (notificacion_id, usuario_id, institucion_id, tipo_notificacion, titulo, mensaje, leida, canal, creado_en) FROM stdin;
\.


--
-- Data for Name: pagos_alumnos; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.pagos_alumnos (pago_id, alumno_id, institucion_id, monto, descuento_porcentaje, descuento_motivo, monto_final, metodo_pago, estado_pago, voucher_url, recibo_numero, vencimiento_en, creado_en) FROM stdin;
\.


--
-- Data for Name: pagos_profesores; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.pagos_profesores (pago_id, profesor_id, institucion_id, horas_dictadas, tarifa_hora, monto_total, periodo_inicio, periodo_fin, estado_pago, creado_en) FROM stdin;
\.


--
-- Data for Name: papelera; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.papelera (papelera_id, entidad_tipo, entidad_id, entidad_datos, padre_id, padre_tipo, eliminado_por, institucion_id, motivo_eliminacion, eliminado_en, expira_en, restaurado, restaurado_en) FROM stdin;
\.


--
-- Data for Name: preguntas; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.preguntas (pregunta_id, subtema_id, profesor_id, institucion_id, enunciado, tipo_pregunta, opciones, respuesta_correcta, explicacion, dificultad, estado, version, creado_en) FROM stdin;
\.


--
-- Data for Name: progreso_alumno; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.progreso_alumno (progreso_id, alumno_id, teoria_id, curso_id, completado, xp_ganado, completado_en) FROM stdin;
\.


--
-- Data for Name: respuestas_alumno; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.respuestas_alumno (respuesta_id, intento_id, pregunta_id, respuesta_seleccionada, es_correcta, tiempo_respuesta_segundos, creado_en) FROM stdin;
\.


--
-- Data for Name: subtemas; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.subtemas (subtema_id, tema_id, nombre_subtema, orden, estado, creado_en) FROM stdin;
2	2	Operaciones básicas	1	active	2026-06-16 17:25:43.325715
3	3	Simplificación	1	active	2026-06-16 17:25:43.32703
4	4	Aumentos y descuentos	1	active	2026-06-16 17:25:43.327979
\.


--
-- Data for Name: temas; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.temas (tema_id, curso_id, nombre_tema, orden, estado, creado_en) FROM stdin;
2	2	Números Enteros	1	active	2026-06-16 17:25:43.322482
3	2	Fracciones	2	active	2026-06-16 17:25:43.323637
4	2	Porcentajes	3	active	2026-06-16 17:25:43.324671
\.


--
-- Data for Name: teorias; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.teorias (teoria_id, subtema_id, titulo_teoria, contenido_html, orden, es_obligatoria, estado, creado_en) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: addison
--

COPY public.usuarios (usuario_id, correo_electronico, nombre_completo, telefono, avatar_url, auth_provider, estado_usuario, creado_en, ultimo_login) FROM stdin;
temp_1781635487766_ucnie2wr2	addisoncusco@gmail.com	Addison	\N	\N	manual	pending_verification	2026-06-16 18:44:47.766603	\N
fs0eiP2Uk3ezZVDTfNjHU6PtPUh2	flores.eduardo.666@gmail.com	EDU	\N	\N	firebase	active	2026-06-16 13:50:27.572195	2026-06-18 01:23:03.063595
\.


--
-- Name: asistencia_clases_asistencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.asistencia_clases_asistencia_id_seq', 1, false);


--
-- Name: auditoria_auditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.auditoria_auditoria_id_seq', 1, false);


--
-- Name: calendario_academico_evento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.calendario_academico_evento_id_seq', 1, false);


--
-- Name: calificaciones_clase_calificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.calificaciones_clase_calificacion_id_seq', 1, false);


--
-- Name: calificaciones_dificultad_calificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.calificaciones_dificultad_calificacion_id_seq', 1, false);


--
-- Name: cursos_curso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.cursos_curso_id_seq', 13, true);


--
-- Name: examenes_examen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.examenes_examen_id_seq', 1, false);


--
-- Name: grabaciones_grabacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.grabaciones_grabacion_id_seq', 1, false);


--
-- Name: grupos_academicos_grupo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.grupos_academicos_grupo_id_seq', 5, true);


--
-- Name: horario_semanal_horario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.horario_semanal_horario_id_seq', 1, false);


--
-- Name: instituciones_institucion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.instituciones_institucion_id_seq', 2, true);


--
-- Name: intentos_examen_intento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.intentos_examen_intento_id_seq', 1, false);


--
-- Name: materiales_material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.materiales_material_id_seq', 1, false);


--
-- Name: membresias_membresia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.membresias_membresia_id_seq', 3, true);


--
-- Name: notificaciones_notificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.notificaciones_notificacion_id_seq', 1, false);


--
-- Name: pagos_alumnos_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.pagos_alumnos_pago_id_seq', 1, false);


--
-- Name: pagos_profesores_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.pagos_profesores_pago_id_seq', 1, false);


--
-- Name: papelera_papelera_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.papelera_papelera_id_seq', 1, false);


--
-- Name: preguntas_pregunta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.preguntas_pregunta_id_seq', 1, false);


--
-- Name: progreso_alumno_progreso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.progreso_alumno_progreso_id_seq', 1, false);


--
-- Name: respuestas_alumno_respuesta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.respuestas_alumno_respuesta_id_seq', 1, false);


--
-- Name: subtemas_subtema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.subtemas_subtema_id_seq', 4, true);


--
-- Name: temas_tema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.temas_tema_id_seq', 4, true);


--
-- Name: teorias_teoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: addison
--

SELECT pg_catalog.setval('public.teorias_teoria_id_seq', 1, false);


--
-- Name: asistencia_clases asistencia_clases_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.asistencia_clases
    ADD CONSTRAINT asistencia_clases_pkey PRIMARY KEY (asistencia_id);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (auditoria_id);


--
-- Name: calendario_academico calendario_academico_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calendario_academico
    ADD CONSTRAINT calendario_academico_pkey PRIMARY KEY (evento_id);


--
-- Name: calificaciones_clase calificaciones_clase_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_clase
    ADD CONSTRAINT calificaciones_clase_pkey PRIMARY KEY (calificacion_id);


--
-- Name: calificaciones_dificultad calificaciones_dificultad_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_dificultad
    ADD CONSTRAINT calificaciones_dificultad_pkey PRIMARY KEY (calificacion_id);


--
-- Name: cursos cursos_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_pkey PRIMARY KEY (curso_id);


--
-- Name: examen_preguntas examen_preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examen_preguntas
    ADD CONSTRAINT examen_preguntas_pkey PRIMARY KEY (examen_id, pregunta_id);


--
-- Name: examenes examenes_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examenes
    ADD CONSTRAINT examenes_pkey PRIMARY KEY (examen_id);


--
-- Name: grabaciones grabaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grabaciones
    ADD CONSTRAINT grabaciones_pkey PRIMARY KEY (grabacion_id);


--
-- Name: grupos_academicos grupos_academicos_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grupos_academicos
    ADD CONSTRAINT grupos_academicos_pkey PRIMARY KEY (grupo_id);


--
-- Name: horario_semanal horario_semanal_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.horario_semanal
    ADD CONSTRAINT horario_semanal_pkey PRIMARY KEY (horario_id);


--
-- Name: instituciones instituciones_institucion_slug_key; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_institucion_slug_key UNIQUE (institucion_slug);


--
-- Name: instituciones instituciones_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_pkey PRIMARY KEY (institucion_id);


--
-- Name: intentos_examen intentos_examen_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.intentos_examen
    ADD CONSTRAINT intentos_examen_pkey PRIMARY KEY (intento_id);


--
-- Name: materiales materiales_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_pkey PRIMARY KEY (material_id);


--
-- Name: membresias membresias_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_pkey PRIMARY KEY (membresia_id);


--
-- Name: membresias membresias_usuario_id_institucion_id_tipo_rol_key; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_usuario_id_institucion_id_tipo_rol_key UNIQUE (usuario_id, institucion_id, tipo_rol);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (notificacion_id);


--
-- Name: pagos_alumnos pagos_alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_alumnos
    ADD CONSTRAINT pagos_alumnos_pkey PRIMARY KEY (pago_id);


--
-- Name: pagos_profesores pagos_profesores_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_profesores
    ADD CONSTRAINT pagos_profesores_pkey PRIMARY KEY (pago_id);


--
-- Name: papelera papelera_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.papelera
    ADD CONSTRAINT papelera_pkey PRIMARY KEY (papelera_id);


--
-- Name: preguntas preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_pkey PRIMARY KEY (pregunta_id);


--
-- Name: progreso_alumno progreso_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.progreso_alumno
    ADD CONSTRAINT progreso_alumno_pkey PRIMARY KEY (progreso_id);


--
-- Name: respuestas_alumno respuestas_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.respuestas_alumno
    ADD CONSTRAINT respuestas_alumno_pkey PRIMARY KEY (respuesta_id);


--
-- Name: subtemas subtemas_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.subtemas
    ADD CONSTRAINT subtemas_pkey PRIMARY KEY (subtema_id);


--
-- Name: temas temas_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.temas
    ADD CONSTRAINT temas_pkey PRIMARY KEY (tema_id);


--
-- Name: teorias teorias_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.teorias
    ADD CONSTRAINT teorias_pkey PRIMARY KEY (teoria_id);


--
-- Name: usuarios usuarios_correo_electronico_key; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_electronico_key UNIQUE (correo_electronico);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (usuario_id);


--
-- Name: idx_cursos_grupo; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_cursos_grupo ON public.cursos USING btree (grupo_id);


--
-- Name: idx_examenes_subtema; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_examenes_subtema ON public.examenes USING btree (subtema_id);


--
-- Name: idx_grabaciones_expira; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_grabaciones_expira ON public.grabaciones USING btree (expira_en);


--
-- Name: idx_grabaciones_institucion; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_grabaciones_institucion ON public.grabaciones USING btree (institucion_id);


--
-- Name: idx_grabaciones_profesor; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_grabaciones_profesor ON public.grabaciones USING btree (profesor_id);


--
-- Name: idx_intentos_alumno; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_intentos_alumno ON public.intentos_examen USING btree (alumno_id);


--
-- Name: idx_membresias_institucion; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_membresias_institucion ON public.membresias USING btree (institucion_id);


--
-- Name: idx_membresias_usuario; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_membresias_usuario ON public.membresias USING btree (usuario_id);


--
-- Name: idx_notificaciones_usuario; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_notificaciones_usuario ON public.notificaciones USING btree (usuario_id, leida);


--
-- Name: idx_pagos_alumno; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_pagos_alumno ON public.pagos_alumnos USING btree (alumno_id);


--
-- Name: idx_papelera_institucion; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_papelera_institucion ON public.papelera USING btree (institucion_id, restaurado);


--
-- Name: idx_preguntas_subtema; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_preguntas_subtema ON public.preguntas USING btree (subtema_id);


--
-- Name: idx_progreso_alumno; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_progreso_alumno ON public.progreso_alumno USING btree (alumno_id);


--
-- Name: idx_subtemas_tema; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_subtemas_tema ON public.subtemas USING btree (tema_id);


--
-- Name: idx_temas_curso; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_temas_curso ON public.temas USING btree (curso_id);


--
-- Name: idx_teorias_subtema; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_teorias_subtema ON public.teorias USING btree (subtema_id);


--
-- Name: idx_usuarios_correo; Type: INDEX; Schema: public; Owner: addison
--

CREATE INDEX idx_usuarios_correo ON public.usuarios USING btree (correo_electronico);


--
-- Name: asistencia_clases asistencia_clases_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.asistencia_clases
    ADD CONSTRAINT asistencia_clases_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: asistencia_clases asistencia_clases_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.asistencia_clases
    ADD CONSTRAINT asistencia_clases_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: asistencia_clases asistencia_clases_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.asistencia_clases
    ADD CONSTRAINT asistencia_clases_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: calendario_academico calendario_academico_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calendario_academico
    ADD CONSTRAINT calendario_academico_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: calificaciones_clase calificaciones_clase_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_clase
    ADD CONSTRAINT calificaciones_clase_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: calificaciones_dificultad calificaciones_dificultad_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_dificultad
    ADD CONSTRAINT calificaciones_dificultad_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: calificaciones_dificultad calificaciones_dificultad_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.calificaciones_dificultad
    ADD CONSTRAINT calificaciones_dificultad_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(pregunta_id);


--
-- Name: cursos cursos_grupo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_grupo_id_fkey FOREIGN KEY (grupo_id) REFERENCES public.grupos_academicos(grupo_id);


--
-- Name: cursos cursos_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.cursos
    ADD CONSTRAINT cursos_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: examen_preguntas examen_preguntas_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examen_preguntas
    ADD CONSTRAINT examen_preguntas_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examenes(examen_id);


--
-- Name: examen_preguntas examen_preguntas_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examen_preguntas
    ADD CONSTRAINT examen_preguntas_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(pregunta_id);


--
-- Name: examenes examenes_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examenes
    ADD CONSTRAINT examenes_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: examenes examenes_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examenes
    ADD CONSTRAINT examenes_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: examenes examenes_subtema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.examenes
    ADD CONSTRAINT examenes_subtema_id_fkey FOREIGN KEY (subtema_id) REFERENCES public.subtemas(subtema_id);


--
-- Name: grabaciones grabaciones_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grabaciones
    ADD CONSTRAINT grabaciones_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: grabaciones grabaciones_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grabaciones
    ADD CONSTRAINT grabaciones_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: grupos_academicos grupos_academicos_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.grupos_academicos
    ADD CONSTRAINT grupos_academicos_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: horario_semanal horario_semanal_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.horario_semanal
    ADD CONSTRAINT horario_semanal_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(curso_id);


--
-- Name: horario_semanal horario_semanal_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.horario_semanal
    ADD CONSTRAINT horario_semanal_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: horario_semanal horario_semanal_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.horario_semanal
    ADD CONSTRAINT horario_semanal_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: instituciones instituciones_superadmin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_superadmin_id_fkey FOREIGN KEY (superadmin_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: intentos_examen intentos_examen_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.intentos_examen
    ADD CONSTRAINT intentos_examen_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: intentos_examen intentos_examen_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.intentos_examen
    ADD CONSTRAINT intentos_examen_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examenes(examen_id);


--
-- Name: materiales materiales_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(curso_id);


--
-- Name: materiales materiales_subtema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_subtema_id_fkey FOREIGN KEY (subtema_id) REFERENCES public.subtemas(subtema_id);


--
-- Name: materiales materiales_tema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.materiales
    ADD CONSTRAINT materiales_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(tema_id);


--
-- Name: membresias membresias_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: membresias membresias_invitado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_invitado_por_fkey FOREIGN KEY (invitado_por) REFERENCES public.usuarios(usuario_id);


--
-- Name: membresias membresias_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.membresias
    ADD CONSTRAINT membresias_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: notificaciones notificaciones_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: notificaciones notificaciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT notificaciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: pagos_alumnos pagos_alumnos_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_alumnos
    ADD CONSTRAINT pagos_alumnos_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: pagos_alumnos pagos_alumnos_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_alumnos
    ADD CONSTRAINT pagos_alumnos_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: pagos_profesores pagos_profesores_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_profesores
    ADD CONSTRAINT pagos_profesores_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: pagos_profesores pagos_profesores_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.pagos_profesores
    ADD CONSTRAINT pagos_profesores_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: papelera papelera_eliminado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.papelera
    ADD CONSTRAINT papelera_eliminado_por_fkey FOREIGN KEY (eliminado_por) REFERENCES public.usuarios(usuario_id);


--
-- Name: papelera papelera_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.papelera
    ADD CONSTRAINT papelera_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: preguntas preguntas_institucion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_institucion_id_fkey FOREIGN KEY (institucion_id) REFERENCES public.instituciones(institucion_id);


--
-- Name: preguntas preguntas_profesor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_profesor_id_fkey FOREIGN KEY (profesor_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: preguntas preguntas_subtema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_subtema_id_fkey FOREIGN KEY (subtema_id) REFERENCES public.subtemas(subtema_id);


--
-- Name: progreso_alumno progreso_alumno_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.progreso_alumno
    ADD CONSTRAINT progreso_alumno_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.usuarios(usuario_id);


--
-- Name: progreso_alumno progreso_alumno_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.progreso_alumno
    ADD CONSTRAINT progreso_alumno_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(curso_id);


--
-- Name: progreso_alumno progreso_alumno_teoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.progreso_alumno
    ADD CONSTRAINT progreso_alumno_teoria_id_fkey FOREIGN KEY (teoria_id) REFERENCES public.teorias(teoria_id);


--
-- Name: respuestas_alumno respuestas_alumno_intento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.respuestas_alumno
    ADD CONSTRAINT respuestas_alumno_intento_id_fkey FOREIGN KEY (intento_id) REFERENCES public.intentos_examen(intento_id);


--
-- Name: respuestas_alumno respuestas_alumno_pregunta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.respuestas_alumno
    ADD CONSTRAINT respuestas_alumno_pregunta_id_fkey FOREIGN KEY (pregunta_id) REFERENCES public.preguntas(pregunta_id);


--
-- Name: subtemas subtemas_tema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.subtemas
    ADD CONSTRAINT subtemas_tema_id_fkey FOREIGN KEY (tema_id) REFERENCES public.temas(tema_id);


--
-- Name: temas temas_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.temas
    ADD CONSTRAINT temas_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(curso_id);


--
-- Name: teorias teorias_subtema_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: addison
--

ALTER TABLE ONLY public.teorias
    ADD CONSTRAINT teorias_subtema_id_fkey FOREIGN KEY (subtema_id) REFERENCES public.subtemas(subtema_id);


--
-- PostgreSQL database dump complete
--

\unrestrict AfJ76Q2tfzUIyenmbIvojFT8bghfXv7qbMkdAAykRA8aTbtiB2q9jZOGWJBc2VO

