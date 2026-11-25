-- ============================================================================
-- CORA - POLITICA PROGRESIVA DE INASISTENCIAS
-- Archivo: backend/src/BBDD/20261124_politica_inasistencias_progresiva.sql
-- Rollback: backend/src/BBDD/20261124_politica_inasistencias_progresiva_rollback.sql
--
-- Aplicar DESPUES de 20261122_completar_perfil_recepcion.sql y ANTES de desplegar
-- el backend que usa fn_procesar_inasistencia_turno / fn_contar_inasistencias_injustificadas.
--
-- Diseno:
--  * Una sola transaccion: ante cualquier error no queda nada aplicado.
--  * Antes de tocar un objeto preexistente se guarda su estado original en
--    public._backup_politica_inasistencias_20261124 (definicion exacta de funciones
--    y triggers con pg_get_functiondef/pg_get_triggerdef, estado habilitado del
--    trigger, filas de configuracion, fila de sancion). El backup se escribe con
--    ON CONFLICT DO NOTHING: re-ejecutar la migracion NUNCA pisa el original.
--  * Se registra tambien que objetos CREA esta migracion (existia = false), de modo
--    que el rollback elimine unicamente esos y nunca objetos preexistentes.
--  * No se crean indices sobre public.turnos: la consulta de conteo usa el indice
--    preexistente ix_turnos_paciente_fecha (id_paciente, fecha_hora_inicio DESC).
--    (El indice parcial de versiones anteriores no coincidia con la consulta.)
--  * Unica sancion modificada: 474c2753-2052-42c6-a2f0-ab88c8d1a6a9, anulada por
--    99ad1de6-1ee3-448a-b20c-e0473ef55da0 (debe ser SUPER_ADMIN activo).
--
-- NO ejecutar en produccion sin revision y aprobacion previa.
-- ============================================================================
BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';

-- Impide ejecuciones concurrentes de migracion/rollback.
SELECT pg_advisory_xact_lock(20261124, 1);

-- ----------------------------------------------------------------------------
-- 0. COMPROBACIONES PREVIAS
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_tabla text;
    v_col   text;
BEGIN
    FOREACH v_tabla IN ARRAY ARRAY['turnos','sanciones','configuracion','pacientes','usuarios',
                                   'roles','estados_turno','auditoria'] LOOP
        IF to_regclass('public.' || v_tabla) IS NULL THEN
            RAISE EXCEPTION 'PRE-CHECK: no existe la tabla public.%', v_tabla;
        END IF;
    END LOOP;

    FOREACH v_col IN ARRAY ARRAY['id_turno','id_paciente','id_especialidad','id_estado','fecha_hora_inicio',
                                 'fecha_hora_fin','ocupa_agenda','creado_por','id_profesional','id_salita',
                                 'id_horario'] LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema='public' AND table_name='turnos' AND column_name=v_col) THEN
            RAISE EXCEPTION 'PRE-CHECK: falta public.turnos.%', v_col;
        END IF;
    END LOOP;

    FOREACH v_col IN ARRAY ARRAY['id_sancion','id_paciente','id_especialidad','id_turno','motivo','fecha_inicio',
                                 'fecha_fin','anulada','motivo_anulacion','anulada_por','creado_por'] LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema='public' AND table_name='sanciones' AND column_name=v_col) THEN
            RAISE EXCEPTION 'PRE-CHECK: falta public.sanciones.%', v_col;
        END IF;
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='configuracion'
                   AND indexname='uq_configuracion_global') THEN
        RAISE EXCEPTION 'PRE-CHECK: falta el indice unico parcial uq_configuracion_global';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.estados_turno WHERE codigo = 'NO_ASISTIO') THEN
        RAISE EXCEPTION 'PRE-CHECK: no existe el estado NO_ASISTIO';
    END IF;
    IF to_regprocedure('public.auditar_cambios()') IS NULL THEN
        RAISE EXCEPTION 'PRE-CHECK: no existe public.auditar_cambios()';
    END IF;
    IF to_regprocedure('public.validar_sancion_turno()') IS NULL THEN
        RAISE EXCEPTION 'PRE-CHECK: no existe public.validar_sancion_turno()';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.turnos'::regclass
                   AND tgname='tr_turnos_validar_sancion' AND NOT tgisinternal) THEN
        RAISE EXCEPTION 'PRE-CHECK: no existe el trigger tr_turnos_validar_sancion';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. REGISTRO DE RESPALDO (estado original + objetos creados por esta migracion)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._backup_politica_inasistencias_20261124 (
    tipo         text        NOT NULL
                 CHECK (tipo IN ('FUNCION','TRIGGER','CONFIG','SANCION','COLUMNA','TABLA','ADVERTENCIA','MARCA')),
    nombre       text        NOT NULL,
    existia      boolean     NOT NULL,
    definicion   jsonb,
    fecha_backup timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tipo, nombre)
);
ALTER TABLE public._backup_politica_inasistencias_20261124 ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    v_fn  text;
    v_tg  record;
    v_col record;
    v_tbl text;
BEGIN
    -- 1.1 Funciones (originales y las que crea esta migracion)
    FOREACH v_fn IN ARRAY ARRAY[
        'public.validar_sancion_turno()',
        'public.sancionar_inasistencia_turno()',
        'public.fn_contar_inasistencias_injustificadas(uuid,integer)',
        'public.fn_procesar_inasistencia_turno(uuid,uuid)'] LOOP
        INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia, definicion)
        SELECT 'FUNCION', v_fn,
               to_regprocedure(v_fn) IS NOT NULL,
               CASE WHEN to_regprocedure(v_fn) IS NOT NULL
                    THEN jsonb_build_object('def', pg_get_functiondef(to_regprocedure(v_fn)))
               END
        ON CONFLICT (tipo, nombre) DO NOTHING;
    END LOOP;

    -- 1.2 Triggers de turnos que la migracion reemplaza o elimina
    FOR v_tg IN
        SELECT t.tgname FROM (VALUES ('tr_turnos_validar_sancion'), ('tr_turnos_sancionar_inasistencia')) t(tgname)
    LOOP
        INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia, definicion)
        SELECT 'TRIGGER', 'turnos.' || v_tg.tgname,
               g.oid IS NOT NULL,
               CASE WHEN g.oid IS NOT NULL
                    THEN jsonb_build_object('def', pg_get_triggerdef(g.oid), 'enabled', g.tgenabled::text)
               END
        FROM (SELECT 1) d
        LEFT JOIN pg_trigger g ON g.tgrelid = 'public.turnos'::regclass
                              AND g.tgname = v_tg.tgname AND NOT g.tgisinternal
        ON CONFLICT (tipo, nombre) DO NOTHING;
    END LOOP;

    -- 1.3 Columnas que se agregan
    FOR v_col IN
        SELECT * FROM (VALUES
            ('turnos','tipo_cancelacion'), ('turnos','rectificado_por'),
            ('turnos','motivo_rectificacion'), ('turnos','fecha_rectificacion'),
            ('sanciones','fecha_anulacion')) c(tabla, columna)
    LOOP
        INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia)
        SELECT 'COLUMNA', v_col.tabla || '.' || v_col.columna,
               EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_schema='public' AND table_name=v_col.tabla AND column_name=v_col.columna)
        ON CONFLICT (tipo, nombre) DO NOTHING;
    END LOOP;

    -- 1.4 Tablas que se crean
    FOREACH v_tbl IN ARRAY ARRAY['inasistencias_justificaciones','advertencias_inasistencia'] LOOP
        INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia)
        SELECT 'TABLA', v_tbl, to_regclass('public.' || v_tbl) IS NOT NULL
        ON CONFLICT (tipo, nombre) DO NOTHING;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. CONFIGURACION INSTITUCIONAL (respaldo del valor previo antes de escribir)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    k record;
BEGIN
    FOR k IN
        SELECT * FROM (VALUES
            ('inasistencias.ventana_dias',            '90'::jsonb, 'Ventana móvil de evaluación de inasistencias injustificadas (días).', FALSE),
            ('inasistencias.umbral_advertencia_1',    '1'::jsonb,  'Inasistencias que originan la primera advertencia informativa.', FALSE),
            ('inasistencias.umbral_advertencia_2',    '2'::jsonb,  'Inasistencias que originan la advertencia formal.', FALSE),
            ('inasistencias.umbral_restriccion',      '3'::jsonb,  'Inasistencias que activan la restricción de reservas online.', FALSE),
            ('inasistencias.duracion_restriccion_dias','7'::jsonb, 'Duración de la restricción de reservas online (días corridos).', FALSE),
            ('turnos.cancelacion_minima_horas',       '24'::jsonb, 'Anticipación mínima (horas) para que una cancelación sea anticipada.', TRUE)
        ) v(clave, valor, descripcion, es_publica)
    LOOP
        INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia, definicion)
        SELECT 'CONFIG', k.clave, c.id_configuracion IS NOT NULL, to_jsonb(c)
        FROM (SELECT 1) d
        LEFT JOIN public.configuracion c ON c.id_salita IS NULL AND c.clave = k.clave
        ON CONFLICT (tipo, nombre) DO NOTHING;

        INSERT INTO public.configuracion (id_salita, clave, valor, descripcion, es_publica)
        VALUES (NULL, k.clave, k.valor, k.descripcion, k.es_publica)
        ON CONFLICT (clave) WHERE id_salita IS NULL DO UPDATE
           SET valor = EXCLUDED.valor,
               descripcion = EXCLUDED.descripcion,
               es_publica = EXCLUDED.es_publica,
               fecha_actualizacion = now()
         WHERE public.configuracion.valor IS DISTINCT FROM EXCLUDED.valor
            OR public.configuracion.descripcion IS DISTINCT FROM EXCLUDED.descripcion
            OR public.configuracion.es_publica IS DISTINCT FROM EXCLUDED.es_publica;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. COLUMNAS AUDITABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.turnos
    ADD COLUMN IF NOT EXISTS tipo_cancelacion VARCHAR(20)
        CHECK (tipo_cancelacion IS NULL OR tipo_cancelacion IN ('ANTICIPADA','TARDIA','ADMINISTRATIVA')),
    ADD COLUMN IF NOT EXISTS rectificado_por UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS motivo_rectificacion TEXT,
    ADD COLUMN IF NOT EXISTS fecha_rectificacion TIMESTAMPTZ;

ALTER TABLE public.sanciones
    ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMPTZ;

-- ----------------------------------------------------------------------------
-- 4. TABLAS DE JUSTIFICACIONES Y ADVERTENCIAS
--    RLS activado sin politicas (igual que el resto del esquema): solo service_role.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inasistencias_justificaciones (
    id_justificacion  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_turno          UUID NOT NULL UNIQUE REFERENCES public.turnos(id_turno) ON DELETE RESTRICT,
    id_paciente       UUID NOT NULL REFERENCES public.pacientes(id_paciente) ON DELETE RESTRICT,
    motivo            TEXT NOT NULL CHECK (char_length(trim(motivo)) >= 5),
    documentacion_ref TEXT,
    estado            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                      CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
    presentada_por    UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    evaluado_por      UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    fecha_evaluacion  TIMESTAMPTZ,
    motivo_resolucion TEXT,
    fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_justificacion_evaluacion CHECK (
        estado = 'PENDIENTE' OR (evaluado_por IS NOT NULL AND fecha_evaluacion IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS ix_justificaciones_paciente_estado
    ON public.inasistencias_justificaciones (id_paciente, estado);

CREATE TABLE IF NOT EXISTS public.advertencias_inasistencia (
    id_advertencia   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_paciente      UUID NOT NULL REFERENCES public.pacientes(id_paciente) ON DELETE RESTRICT,
    id_turno         UUID NOT NULL UNIQUE REFERENCES public.turnos(id_turno) ON DELETE RESTRICT,
    nivel            VARCHAR(30) NOT NULL CHECK (nivel IN ('PRIMERA_ADVERTENCIA','ADVERTENCIA_FORMAL')),
    motivo           TEXT NOT NULL DEFAULT 'Inasistencia no justificada a turno médico programado.',
    anulada          BOOLEAN NOT NULL DEFAULT FALSE,
    motivo_anulacion TEXT,
    anulada_por      UUID REFERENCES public.usuarios(id_usuario) ON DELETE SET NULL,
    fecha_emision    TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_anulacion  TIMESTAMPTZ,
    CONSTRAINT ck_advertencia_anulacion CHECK (
        (NOT anulada AND motivo_anulacion IS NULL AND anulada_por IS NULL) OR anulada)
);
CREATE INDEX IF NOT EXISTS ix_advertencias_paciente_vigentes
    ON public.advertencias_inasistencia (id_paciente, fecha_emision DESC) WHERE NOT anulada;

ALTER TABLE public.inasistencias_justificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertencias_inasistencia     ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tr_auditar_inasistencias_justificaciones ON public.inasistencias_justificaciones;
CREATE TRIGGER tr_auditar_inasistencias_justificaciones
AFTER INSERT OR UPDATE OR DELETE ON public.inasistencias_justificaciones
FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios('id_justificacion');

DROP TRIGGER IF EXISTS tr_auditar_advertencias_inasistencia ON public.advertencias_inasistencia;
CREATE TRIGGER tr_auditar_advertencias_inasistencia
AFTER INSERT OR UPDATE OR DELETE ON public.advertencias_inasistencia
FOR EACH ROW EXECUTE FUNCTION public.auditar_cambios('id_advertencia');

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON public.inasistencias_justificaciones, public.advertencias_inasistencia,
                      public._backup_politica_inasistencias_20261124 FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON public.inasistencias_justificaciones, public.advertencias_inasistencia,
                      public._backup_politica_inasistencias_20261124 FROM authenticated;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. CONTEO DE INASISTENCIAS INJUSTIFICADAS (fuente unica para backend y SQL)
--    Cuenta turnos NO_ASISTIO del paciente dentro de la ventana movil, excluyendo
--    unicamente los que tienen justificacion APROBADA. Una rectificacion saca al
--    turno del estado NO_ASISTIO. Anular una advertencia NO excluye la falta.
--    Usa el indice preexistente ix_turnos_paciente_fecha.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_contar_inasistencias_injustificadas(
    p_id_paciente  uuid,
    p_ventana_dias integer DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql STABLE SET search_path = public, pg_temp AS $$
DECLARE
    v_ventana integer;
    v_total   integer;
BEGIN
    v_ventana := COALESCE(
        p_ventana_dias,
        (SELECT (c.valor #>> '{}')::integer FROM public.configuracion c
          WHERE c.id_salita IS NULL AND c.clave = 'inasistencias.ventana_dias'),
        90);

    SELECT count(*)::integer INTO v_total
      FROM public.turnos t
      JOIN public.estados_turno e ON e.id_estado = t.id_estado
     WHERE t.id_paciente = p_id_paciente
       AND e.codigo = 'NO_ASISTIO'
       AND t.fecha_hora_inicio >= now() - make_interval(days => v_ventana)
       AND t.fecha_hora_inicio <= now()
       AND NOT EXISTS (SELECT 1 FROM public.inasistencias_justificaciones j
                        WHERE j.id_turno = t.id_turno AND j.estado = 'APROBADA');
    RETURN v_total;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. PROCESAMIENTO ATOMICO E IDEMPOTENTE DE UNA INASISTENCIA
--    Se invoca desde el backend (service_role) tras marcar NO_ASISTIO.
--    El usuario operador se valida contra public.usuarios/roles (no se confia en
--    datos del turno) y se fija app.current_user_id para la auditoria.
--    Serializa por paciente con FOR UPDATE: dos inasistencias simultaneas no
--    pueden duplicar advertencias ni saltear el umbral.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_procesar_inasistencia_turno(
    p_id_turno uuid,
    p_usuario  uuid
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
DECLARE
    v_rol      text;
    v_turno    record;
    v_estado   text;
    v_faltas   integer;
    v_u1       integer;
    v_u2       integer;
    v_ur       integer;
    v_dias     integer;
    v_id       uuid;
BEGIN
    IF p_id_turno IS NULL OR p_usuario IS NULL THEN
        RAISE EXCEPTION 'Turno y usuario son obligatorios';
    END IF;

    SELECT r.codigo INTO v_rol
      FROM public.usuarios u JOIN public.roles r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = p_usuario AND u.activo AND r.activo;
    IF v_rol IS NULL OR v_rol NOT IN ('SUPER_ADMIN','ADMIN_SALITA','RECEPCION','PROFESIONAL') THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Operador no autorizado para registrar inasistencias';
    END IF;

    SELECT t.id_turno, t.id_paciente, t.id_especialidad, t.fecha_hora_inicio
      INTO v_turno FROM public.turnos t WHERE t.id_turno = p_id_turno;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno inexistente';
    END IF;

    -- Serializa por paciente antes de leer el estado y contar.
    PERFORM 1 FROM public.pacientes WHERE id_paciente = v_turno.id_paciente FOR UPDATE;

    SELECT e.codigo INTO v_estado
      FROM public.turnos t JOIN public.estados_turno e ON e.id_estado = t.id_estado
     WHERE t.id_turno = p_id_turno;
    IF v_estado IS DISTINCT FROM 'NO_ASISTIO' THEN
        RETURN jsonb_build_object('accion','NINGUNA','motivo','El turno no está en estado NO_ASISTIO');
    END IF;
    IF v_turno.fecha_hora_inicio > now() THEN
        RAISE EXCEPTION 'No se puede registrar una inasistencia antes del inicio del turno';
    END IF;

    PERFORM set_config('app.current_user_id', p_usuario::text, true);

    -- Idempotencia: el turno ya originó una advertencia o una sanción.
    IF EXISTS (SELECT 1 FROM public.advertencias_inasistencia WHERE id_turno = p_id_turno)
       OR EXISTS (SELECT 1 FROM public.sanciones WHERE id_turno = p_id_turno) THEN
        RETURN jsonb_build_object('accion','YA_PROCESADA',
            'faltas', public.fn_contar_inasistencias_injustificadas(v_turno.id_paciente));
    END IF;

    -- Falta justificada y aprobada: no computa.
    IF EXISTS (SELECT 1 FROM public.inasistencias_justificaciones
                WHERE id_turno = p_id_turno AND estado = 'APROBADA') THEN
        RETURN jsonb_build_object('accion','NINGUNA','motivo','Inasistencia justificada');
    END IF;

    v_faltas := public.fn_contar_inasistencias_injustificadas(v_turno.id_paciente);

    SELECT COALESCE(max((valor #>> '{}')::integer) FILTER (WHERE clave='inasistencias.umbral_advertencia_1'), 1),
           COALESCE(max((valor #>> '{}')::integer) FILTER (WHERE clave='inasistencias.umbral_advertencia_2'), 2),
           COALESCE(max((valor #>> '{}')::integer) FILTER (WHERE clave='inasistencias.umbral_restriccion'), 3),
           COALESCE(max((valor #>> '{}')::integer) FILTER (WHERE clave='inasistencias.duracion_restriccion_dias'), 7)
      INTO v_u1, v_u2, v_ur, v_dias
      FROM public.configuracion WHERE id_salita IS NULL;

    IF v_faltas >= v_ur THEN
        -- Restricción individual de reservas online (por paciente, no por titular).
        IF NOT EXISTS (SELECT 1 FROM public.sanciones s
                        WHERE s.id_paciente = v_turno.id_paciente AND NOT s.anulada
                          AND s.fecha_inicio <= now() AND s.fecha_fin > now()) THEN
            INSERT INTO public.sanciones
                (id_paciente, id_especialidad, id_turno, motivo, fecha_inicio, fecha_fin, creado_por)
            VALUES (v_turno.id_paciente, v_turno.id_especialidad, p_id_turno,
                    format('Acumulación de %s inasistencias injustificadas dentro de la ventana móvil. '
                           'Restricción de reservas online por %s días corridos. No afecta la atención presencial ni de urgencia.',
                           v_faltas, v_dias),
                    now(), now() + make_interval(days => v_dias), p_usuario)
            RETURNING id_sancion INTO v_id;
        END IF;
        RETURN jsonb_build_object('accion','RESTRICCION','faltas',v_faltas,'id_sancion',v_id);
    ELSIF v_faltas >= v_u2 THEN
        INSERT INTO public.advertencias_inasistencia (id_paciente, id_turno, nivel, motivo)
        VALUES (v_turno.id_paciente, p_id_turno, 'ADVERTENCIA_FORMAL',
                'Segunda inasistencia injustificada dentro de la ventana móvil: advertencia formal.')
        ON CONFLICT (id_turno) DO NOTHING RETURNING id_advertencia INTO v_id;
        RETURN jsonb_build_object('accion','ADVERTENCIA_FORMAL','faltas',v_faltas,'id_advertencia',v_id);
    ELSIF v_faltas >= v_u1 THEN
        INSERT INTO public.advertencias_inasistencia (id_paciente, id_turno, nivel, motivo)
        VALUES (v_turno.id_paciente, p_id_turno, 'PRIMERA_ADVERTENCIA',
                'Primera inasistencia injustificada dentro de la ventana móvil: advertencia informativa.')
        ON CONFLICT (id_turno) DO NOTHING RETURNING id_advertencia INTO v_id;
        RETURN jsonb_build_object('accion','PRIMERA_ADVERTENCIA','faltas',v_faltas,'id_advertencia',v_id);
    END IF;
    RETURN jsonb_build_object('accion','NINGUNA','faltas',v_faltas);
END;
$$;

DO $$
BEGIN
    REVOKE ALL ON FUNCTION public.fn_contar_inasistencias_injustificadas(uuid,integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.fn_procesar_inasistencia_turno(uuid,uuid) FROM PUBLIC;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON FUNCTION public.fn_contar_inasistencias_injustificadas(uuid,integer) FROM anon;
        REVOKE ALL ON FUNCTION public.fn_procesar_inasistencia_turno(uuid,uuid) FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON FUNCTION public.fn_contar_inasistencias_injustificadas(uuid,integer) FROM authenticated;
        REVOKE ALL ON FUNCTION public.fn_procesar_inasistencia_turno(uuid,uuid) FROM authenticated;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION public.fn_contar_inasistencias_injustificadas(uuid,integer) TO service_role;
        GRANT EXECUTE ON FUNCTION public.fn_procesar_inasistencia_turno(uuid,uuid) TO service_role;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. TRIGGERS DE TURNOS
--    Orden de disparo (alfabetico por nombre, mismo evento BEFORE):
--      tr_agenda_serializar (statement) -> tr_turnos_sincronizar_estado (fija
--      ocupa_agenda segun el estado) -> tr_turnos_validar -> tr_turnos_validar_cierre
--      -> tr_turnos_validar_sancion (este, ya con ocupa_agenda correcto).
--    AFTER: tr_auditar_turnos, tr_turnos_historial. La sancion por inasistencia ya
--    no es un trigger AFTER automatico: la aplica fn_procesar_inasistencia_turno.
-- ----------------------------------------------------------------------------

-- 7.1 La sancion inmediata de 168 horas es incompatible con la politica progresiva.
--     (La funcion sancionar_inasistencia_turno se conserva sin cambios; solo se
--     quita el trigger. Definicion y estado quedan respaldados para el rollback.)
DROP TRIGGER IF EXISTS tr_turnos_sancionar_inasistencia ON public.turnos;

-- 7.2 Bloqueo de reservas ONLINE de pacientes con restriccion vigente.
--     Personal autorizado (reserva presencial, mostrador, urgencia, carga
--     administrativa) nunca es bloqueado. La restriccion es individual por paciente.
--     Identidad del operador:
--      * app.current_user_id (fijado por guardar_agenda y RPC del backend) si existe;
--      * en INSERT directo desde el backend, NEW.creado_por, que el backend toma del
--        usuario autenticado. Siempre se valida contra usuarios/roles activos y solo
--        sirve para EXIMAR si el rol es de personal; nunca para sancionar ni para
--        otorgar permisos distintos. Sin identidad valida se aplica la restriccion.
CREATE OR REPLACE FUNCTION public.validar_sancion_turno()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_operador uuid;
    v_rol      text;
BEGIN
    -- Un turno que no ocupa agenda (cancelado, no asistio, etc.) no es una reserva.
    IF NOT NEW.ocupa_agenda THEN
        RETURN NEW;
    END IF;

    -- Cambios que no alteran la asignacion de una reserva ya vigente.
    IF TG_OP = 'UPDATE' THEN
        IF OLD.ocupa_agenda
           AND NEW.id_paciente = OLD.id_paciente
           AND NEW.id_especialidad = OLD.id_especialidad
           AND NEW.id_profesional = OLD.id_profesional
           AND NEW.id_salita = OLD.id_salita
           AND NEW.id_horario IS NOT DISTINCT FROM OLD.id_horario
           AND NEW.fecha_hora_inicio = OLD.fecha_hora_inicio
           AND NEW.fecha_hora_fin = OLD.fecha_hora_fin THEN
            RETURN NEW;
        END IF;
    END IF;

    BEGIN
        v_operador := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
        v_operador := NULL;
    END;
    IF v_operador IS NULL AND TG_OP = 'INSERT' THEN
        v_operador := NEW.creado_por;
    END IF;

    IF v_operador IS NOT NULL THEN
        SELECT r.codigo INTO v_rol
          FROM public.usuarios u JOIN public.roles r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = v_operador AND u.activo AND r.activo;
        IF v_rol IN ('SUPER_ADMIN','ADMIN_SALITA','RECEPCION','PROFESIONAL') THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Reserva online/autogestionada: serializa por paciente y verifica restriccion.
    PERFORM 1 FROM public.pacientes WHERE id_paciente = NEW.id_paciente FOR UPDATE;
    IF EXISTS (
        SELECT 1 FROM public.sanciones s
         WHERE s.id_paciente = NEW.id_paciente
           AND NOT s.anulada
           AND s.fecha_inicio <= CURRENT_TIMESTAMP
           AND s.fecha_fin > CURRENT_TIMESTAMP
    ) THEN
        RAISE EXCEPTION 'PATIENT_SANCTIONED'
            USING HINT = 'El paciente tiene una restricción vigente para reservas online.';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    v_enabled text;
BEGIN
    SELECT definicion->>'enabled' INTO v_enabled
      FROM public._backup_politica_inasistencias_20261124
     WHERE tipo = 'TRIGGER' AND nombre = 'turnos.tr_turnos_validar_sancion';

    DROP TRIGGER IF EXISTS tr_turnos_validar_sancion ON public.turnos;
    CREATE TRIGGER tr_turnos_validar_sancion
    BEFORE INSERT OR UPDATE OF id_paciente, id_especialidad, id_profesional, id_salita, id_horario,
        fecha_hora_inicio, fecha_hora_fin, id_estado
    ON public.turnos
    FOR EACH ROW EXECUTE FUNCTION public.validar_sancion_turno();

    -- Conserva el estado habilitado original del trigger.
    IF v_enabled = 'D' THEN
        ALTER TABLE public.turnos DISABLE TRIGGER tr_turnos_validar_sancion;
    ELSIF v_enabled = 'R' THEN
        ALTER TABLE public.turnos ENABLE REPLICA TRIGGER tr_turnos_validar_sancion;
    ELSIF v_enabled = 'A' THEN
        ALTER TABLE public.turnos ENABLE ALWAYS TRIGGER tr_turnos_validar_sancion;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. ADECUACION ADMINISTRATIVA DE LA UNICA SANCION AUTORIZADA
--    Sancion 474c2753-2052-42c6-a2f0-ab88c8d1a6a9 (politica anterior incompatible).
--    Responsable: 99ad1de6-1ee3-448a-b20c-e0473ef55da0 (SUPER_ADMIN activo).
--    Se conserva el historial: anulacion logica con responsable, fecha y motivo.
--    Ninguna otra sancion es leida para modificarse ni modificada.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    c_sancion   CONSTANT uuid := '474c2753-2052-42c6-a2f0-ab88c8d1a6a9';
    c_operador  CONSTANT uuid := '99ad1de6-1ee3-448a-b20c-e0473ef55da0';
    v_s         public.sanciones%ROWTYPE;
    v_rol       text;
    v_estado    text;
    v_adv       uuid;
    v_filas     integer;
BEGIN
    SELECT * INTO v_s FROM public.sanciones WHERE id_sancion = c_sancion FOR UPDATE;
    IF NOT FOUND THEN
        RAISE WARNING 'Sancion % no encontrada en esta base: no se adecua nada.', c_sancion;
        RETURN;
    END IF;
    IF v_s.anulada THEN
        RAISE NOTICE 'Sancion % ya estaba anulada: no se modifica.', c_sancion;
        RETURN;
    END IF;

    SELECT r.codigo INTO v_rol
      FROM public.usuarios u JOIN public.roles r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = c_operador AND u.activo AND r.activo;
    IF v_rol IS DISTINCT FROM 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'El responsable % no es un SUPER_ADMIN activo; se aborta la migración.', c_operador;
    END IF;

    -- Respaldo del estado original (solo la primera vez).
    INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia, definicion)
    VALUES ('SANCION', c_sancion::text, true, to_jsonb(v_s))
    ON CONFLICT (tipo, nombre) DO NOTHING;

    PERFORM set_config('app.current_user_id', c_operador::text, true);

    UPDATE public.sanciones
       SET anulada = TRUE,
           motivo_anulacion = 'Anulación administrativa: corresponde a la política anterior de suspensión inmediata '
                              '(7 días por una inasistencia), incompatible con la política progresiva vigente.',
           anulada_por = c_operador,
           fecha_anulacion = now()
     WHERE id_sancion = c_sancion AND NOT anulada;
    GET DIAGNOSTICS v_filas = ROW_COUNT;
    IF v_filas <> 1 THEN
        RAISE EXCEPTION 'No se pudo anular exactamente la sancion % (filas=%)', c_sancion, v_filas;
    END IF;

    -- Primera advertencia solo si el turno vinculado es del mismo paciente y esta NO_ASISTIO.
    SELECT e.codigo INTO v_estado
      FROM public.turnos t JOIN public.estados_turno e ON e.id_estado = t.id_estado
     WHERE t.id_turno = v_s.id_turno AND t.id_paciente = v_s.id_paciente;

    IF v_estado = 'NO_ASISTIO'
       AND NOT EXISTS (SELECT 1 FROM public.inasistencias_justificaciones
                        WHERE id_turno = v_s.id_turno AND estado = 'APROBADA') THEN
        INSERT INTO public.advertencias_inasistencia (id_paciente, id_turno, nivel, motivo)
        VALUES (v_s.id_paciente, v_s.id_turno, 'PRIMERA_ADVERTENCIA',
                'Primera inasistencia injustificada: advertencia informativa (reemplaza la sanción de la política anterior).')
        ON CONFLICT (id_turno) DO NOTHING
        RETURNING id_advertencia INTO v_adv;

        IF v_adv IS NOT NULL THEN
            INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia)
            VALUES ('ADVERTENCIA', v_adv::text, false)
            ON CONFLICT (tipo, nombre) DO NOTHING;
        END IF;
    ELSE
        RAISE NOTICE 'Turno % no corresponde al paciente o no esta NO_ASISTIO (estado=%): sin advertencia.',
                     v_s.id_turno, COALESCE(v_estado, 'n/d');
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 9. COMPROBACIONES POSTERIORES Y MARCA DE MIGRACION COMPLETA
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.turnos'::regclass
               AND tgname='tr_turnos_sancionar_inasistencia' AND NOT tgisinternal) THEN
        RAISE EXCEPTION 'POST-CHECK: sigue existiendo tr_turnos_sancionar_inasistencia';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.turnos'::regclass
                   AND tgname='tr_turnos_validar_sancion' AND NOT tgisinternal) THEN
        RAISE EXCEPTION 'POST-CHECK: falta tr_turnos_validar_sancion';
    END IF;
    IF to_regprocedure('public.fn_contar_inasistencias_injustificadas(uuid,integer)') IS NULL
       OR to_regprocedure('public.fn_procesar_inasistencia_turno(uuid,uuid)') IS NULL THEN
        RAISE EXCEPTION 'POST-CHECK: faltan funciones de la politica';
    END IF;
    IF (SELECT count(*) FROM public.configuracion WHERE id_salita IS NULL AND clave IN (
            'inasistencias.ventana_dias','inasistencias.umbral_advertencia_1','inasistencias.umbral_advertencia_2',
            'inasistencias.umbral_restriccion','inasistencias.duracion_restriccion_dias',
            'turnos.cancelacion_minima_horas')) <> 6 THEN
        RAISE EXCEPTION 'POST-CHECK: configuracion incompleta';
    END IF;
    IF (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'CONFIG') <> 6
       OR (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'COLUMNA') <> 5
       OR (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'TABLA') <> 2
       OR (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'FUNCION') <> 4
       OR (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'TRIGGER') <> 2 THEN
        RAISE EXCEPTION 'POST-CHECK: respaldo incompleto';
    END IF;
    IF (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'SANCION') > 1 THEN
        RAISE EXCEPTION 'POST-CHECK: se respaldo mas de una sancion';
    END IF;

    INSERT INTO public._backup_politica_inasistencias_20261124 (tipo, nombre, existia)
    VALUES ('MARCA', 'migracion_completa', true)
    ON CONFLICT (tipo, nombre) DO NOTHING;
END $$;

COMMIT;
NOTIFY pgrst, 'reload schema';
