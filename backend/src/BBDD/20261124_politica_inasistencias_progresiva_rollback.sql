-- ============================================================================
-- CORA - ROLLBACK DE LA POLITICA PROGRESIVA DE INASISTENCIAS
-- Archivo: backend/src/BBDD/20261124_politica_inasistencias_progresiva_rollback.sql
--
-- Revierte 20261124_politica_inasistencias_progresiva.sql usando EXCLUSIVAMENTE el
-- respaldo public._backup_politica_inasistencias_20261124 (definiciones exactas
-- obtenidas con pg_get_functiondef / pg_get_triggerdef antes de la migracion).
--
-- Si falta la tabla de respaldo o cualquiera de sus filas necesarias, el script
-- ABORTA antes de modificar nada (todo ocurre en una sola transaccion).
--
-- Por defecto NO es destructivo sobre tablas ni columnas:
--   * Restaura funciones, triggers (definicion y estado habilitado), configuracion
--     y la sancion anulada por la migracion.
--   * Elimina unicamente las advertencias creadas por la migracion (registradas en
--     el respaldo) y las funciones fn_* creadas por la migracion.
--   * Conserva tablas y columnas creadas por la migracion (no contienen datos
--     preexistentes y el backend nuevo puede seguir leyendolas).
--
-- Para ELIMINAR ademas las tablas/columnas que creo la migracion (solo si estan
-- vacias; nunca CASCADE) ejecutar con:
--     PGOPTIONS="-c app.rollback_eliminar_objetos=CONFIRMAR" psql ... -f <este archivo>
--   o agregar, justo despues de BEGIN:  SET LOCAL app.rollback_eliminar_objetos = 'CONFIRMAR';
--
-- Los objetos preexistentes (tablas, columnas, indices, constraints, triggers,
-- funciones) nunca se eliminan. NO ejecutar en produccion sin aprobacion.
-- IMPORTANTE: revertir tambien el backend (usa fn_procesar_inasistencia_turno,
-- fn_contar_inasistencias_injustificadas y las tablas nuevas).
-- ============================================================================
BEGIN;

SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '5min';
SELECT pg_advisory_xact_lock(20261124, 1);

-- ----------------------------------------------------------------------------
-- 0. VERIFICACION DE RESPALDOS (aborta sin modificar nada)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_n     integer;
    v_op    CONSTANT uuid := '99ad1de6-1ee3-448a-b20c-e0473ef55da0';
    v_sanc  CONSTANT uuid := '474c2753-2052-42c6-a2f0-ab88c8d1a6a9';
BEGIN
    IF to_regclass('public._backup_politica_inasistencias_20261124') IS NULL THEN
        RAISE EXCEPTION 'ABORTADO: no existe public._backup_politica_inasistencias_20261124. No se modifica nada.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                    WHERE tipo = 'MARCA' AND nombre = 'migracion_completa') THEN
        RAISE EXCEPTION 'ABORTADO: el respaldo no corresponde a una migración completa.';
    END IF;

    SELECT count(*) INTO v_n FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'FUNCION';
    IF v_n <> 4 THEN RAISE EXCEPTION 'ABORTADO: respaldo de funciones incompleto (%/4).', v_n; END IF;

    SELECT count(*) INTO v_n FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'TRIGGER';
    IF v_n <> 2 THEN RAISE EXCEPTION 'ABORTADO: respaldo de triggers incompleto (%/2).', v_n; END IF;

    SELECT count(*) INTO v_n FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'CONFIG';
    IF v_n <> 6 THEN RAISE EXCEPTION 'ABORTADO: respaldo de configuración incompleto (%/6).', v_n; END IF;

    SELECT count(*) INTO v_n FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'COLUMNA';
    IF v_n <> 5 THEN RAISE EXCEPTION 'ABORTADO: respaldo de columnas incompleto (%/5).', v_n; END IF;

    SELECT count(*) INTO v_n FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'TABLA';
    IF v_n <> 2 THEN RAISE EXCEPTION 'ABORTADO: respaldo de tablas incompleto (%/2).', v_n; END IF;

    -- Las funciones y triggers originales deben tener definicion guardada.
    IF EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                WHERE tipo = 'FUNCION' AND existia AND (definicion->>'def') IS NULL)
       OR EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                   WHERE tipo = 'TRIGGER' AND existia AND (definicion->>'def') IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: hay definiciones originales vacías en el respaldo.';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                    WHERE tipo = 'FUNCION' AND nombre = 'public.validar_sancion_turno()' AND existia)
       OR NOT EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                       WHERE tipo = 'TRIGGER' AND nombre = 'turnos.tr_turnos_validar_sancion' AND existia) THEN
        RAISE EXCEPTION 'ABORTADO: falta el respaldo de validar_sancion_turno / su trigger.';
    END IF;
    IF EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                WHERE tipo = 'CONFIG' AND existia AND definicion IS NULL) THEN
        RAISE EXCEPTION 'ABORTADO: hay filas de configuración originales vacías en el respaldo.';
    END IF;

    -- Si la sancion quedo anulada por esta migracion, debe existir su respaldo.
    IF EXISTS (SELECT 1 FROM public.sanciones
                WHERE id_sancion = v_sanc AND anulada AND anulada_por = v_op)
       AND NOT EXISTS (SELECT 1 FROM public._backup_politica_inasistencias_20261124
                        WHERE tipo = 'SANCION' AND nombre = v_sanc::text) THEN
        RAISE EXCEPTION 'ABORTADO: falta el respaldo de la sanción % anulada por la migración.', v_sanc;
    END IF;
    IF (SELECT count(*) FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'SANCION') > 1 THEN
        RAISE EXCEPTION 'ABORTADO: el respaldo contiene más de una sanción; revisar manualmente.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. FUNCIONES Y TRIGGERS ORIGINALES (definicion exacta + estado habilitado)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r        record;
    v_tabla  text;
    v_nombre text;
BEGIN
    -- Se quitan primero los triggers actuales que dependen de las funciones.
    DROP TRIGGER IF EXISTS tr_turnos_validar_sancion ON public.turnos;

    -- Funciones: restaurar definicion original o eliminar las creadas por la migracion.
    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124
              WHERE tipo = 'FUNCION' ORDER BY nombre
    LOOP
        IF r.existia THEN
            EXECUTE r.definicion->>'def';
        ELSE
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.nombre;   -- sin CASCADE
        END IF;
    END LOOP;

    -- Triggers: recrear desde su definicion original y restaurar el estado.
    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124
              WHERE tipo = 'TRIGGER' ORDER BY nombre
    LOOP
        v_tabla  := split_part(r.nombre, '.', 1);
        v_nombre := split_part(r.nombre, '.', 2);
        IF r.existia THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_nombre, v_tabla);
            EXECUTE r.definicion->>'def';
            CASE r.definicion->>'enabled'
                WHEN 'D' THEN EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER %I', v_tabla, v_nombre);
                WHEN 'R' THEN EXECUTE format('ALTER TABLE public.%I ENABLE REPLICA TRIGGER %I', v_tabla, v_nombre);
                WHEN 'A' THEN EXECUTE format('ALTER TABLE public.%I ENABLE ALWAYS TRIGGER %I', v_tabla, v_nombre);
                ELSE EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER %I', v_tabla, v_nombre);
            END CASE;
        ELSE
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_nombre, v_tabla);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. CONFIGURACION: restaurar valores previos o quitar claves creadas
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'CONFIG'
    LOOP
        IF r.existia THEN
            -- Se reinserta la fila original completa (id, fechas, actualizado_por) para que el
            -- trigger de fecha de actualizacion no altere el valor restaurado.
            DELETE FROM public.configuracion WHERE id_salita IS NULL AND clave = r.nombre;
            INSERT INTO public.configuracion
            SELECT * FROM jsonb_populate_record(NULL::public.configuracion, r.definicion);
        ELSE
            DELETE FROM public.configuracion WHERE id_salita IS NULL AND clave = r.nombre;
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 3. SANCION: recuperar el estado original de la unica sancion modificada
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'SANCION'
    LOOP
        UPDATE public.sanciones
           SET anulada = (r.definicion->>'anulada')::boolean,
               motivo_anulacion = r.definicion->>'motivo_anulacion',
               anulada_por = NULLIF(r.definicion->>'anulada_por','')::uuid
         WHERE id_sancion = r.nombre::uuid;

        IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name='sanciones' AND column_name='fecha_anulacion') THEN
            EXECUTE 'UPDATE public.sanciones SET fecha_anulacion = $1 WHERE id_sancion = $2'
               USING NULLIF(r.definicion->>'fecha_anulacion','')::timestamptz, r.nombre::uuid;
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 4. ADVERTENCIAS: eliminar solo las creadas por la migracion
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.advertencias_inasistencia') IS NOT NULL THEN
        DELETE FROM public.advertencias_inasistencia a
         USING public._backup_politica_inasistencias_20261124 b
         WHERE b.tipo = 'ADVERTENCIA' AND a.id_advertencia = b.nombre::uuid;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. OBJETOS CREADOS POR LA MIGRACION: solo con confirmacion explicita
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r       record;
    v_conf  boolean := COALESCE(current_setting('app.rollback_eliminar_objetos', true), '') = 'CONFIRMAR';
    v_tabla text;
    v_col   text;
    v_n     bigint;
BEGIN
    IF NOT v_conf THEN
        RAISE NOTICE 'Tablas y columnas creadas por la migración CONSERVADAS (sin confirmación de borrado).';
        RETURN;
    END IF;

    -- Tablas creadas por la migracion: solo si estan vacias; sin CASCADE.
    FOR r IN SELECT nombre FROM public._backup_politica_inasistencias_20261124
              WHERE tipo = 'TABLA' AND NOT existia
    LOOP
        IF to_regclass('public.' || r.nombre) IS NOT NULL THEN
            EXECUTE format('SELECT count(*) FROM public.%I', r.nombre) INTO v_n;
            IF v_n > 0 THEN
                RAISE EXCEPTION 'ABORTADO: public.% tiene % filas; vaciar/archivar manualmente antes de eliminarla.', r.nombre, v_n;
            END IF;
            EXECUTE format('DROP TABLE public.%I', r.nombre);
        END IF;
    END LOOP;

    -- Columnas creadas por la migracion: solo si no contienen datos; sin CASCADE.
    FOR r IN SELECT nombre FROM public._backup_politica_inasistencias_20261124
              WHERE tipo = 'COLUMNA' AND NOT existia ORDER BY nombre
    LOOP
        v_tabla := split_part(r.nombre, '.', 1);
        v_col   := split_part(r.nombre, '.', 2);
        IF EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_schema='public' AND table_name=v_tabla AND column_name=v_col) THEN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %I IS NOT NULL', v_tabla, v_col) INTO v_n;
            IF v_n > 0 THEN
                RAISE EXCEPTION 'ABORTADO: la columna %.% contiene % datos; no se elimina.', v_tabla, v_col, v_n;
            END IF;
            EXECUTE format('ALTER TABLE public.%I DROP COLUMN %I', v_tabla, v_col);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 6. VERIFICACION POSTERIOR: coincidencia exacta con el respaldo
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'FUNCION'
    LOOP
        IF r.existia THEN
            IF pg_get_functiondef(to_regprocedure(r.nombre)) IS DISTINCT FROM (r.definicion->>'def') THEN
                RAISE EXCEPTION 'POST-CHECK: la función % no coincide con su definición original.', r.nombre;
            END IF;
        ELSIF to_regprocedure(r.nombre) IS NOT NULL THEN
            RAISE EXCEPTION 'POST-CHECK: la función % debía eliminarse.', r.nombre;
        END IF;
    END LOOP;

    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'TRIGGER'
    LOOP
        IF r.existia THEN
            IF NOT EXISTS (SELECT 1 FROM pg_trigger g
                            WHERE g.tgrelid = ('public.' || split_part(r.nombre,'.',1))::regclass
                              AND g.tgname = split_part(r.nombre,'.',2)
                              AND pg_get_triggerdef(g.oid) = (r.definicion->>'def')
                              AND g.tgenabled::text = (r.definicion->>'enabled')) THEN
                RAISE EXCEPTION 'POST-CHECK: el trigger % no coincide con el original (definición/estado).', r.nombre;
            END IF;
        ELSIF EXISTS (SELECT 1 FROM pg_trigger g
                       WHERE g.tgrelid = ('public.' || split_part(r.nombre,'.',1))::regclass
                         AND g.tgname = split_part(r.nombre,'.',2)) THEN
            RAISE EXCEPTION 'POST-CHECK: el trigger % debía eliminarse.', r.nombre;
        END IF;
    END LOOP;

    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'CONFIG'
    LOOP
        IF r.existia THEN
            IF NOT EXISTS (SELECT 1 FROM public.configuracion c
                            WHERE c.id_salita IS NULL AND c.clave = r.nombre
                              AND c.valor = (r.definicion->'valor')) THEN
                RAISE EXCEPTION 'POST-CHECK: configuración % no restaurada.', r.nombre;
            END IF;
        ELSIF EXISTS (SELECT 1 FROM public.configuracion WHERE id_salita IS NULL AND clave = r.nombre) THEN
            RAISE EXCEPTION 'POST-CHECK: configuración % debía eliminarse.', r.nombre;
        END IF;
    END LOOP;

    FOR r IN SELECT * FROM public._backup_politica_inasistencias_20261124 WHERE tipo = 'SANCION'
    LOOP
        IF NOT EXISTS (SELECT 1 FROM public.sanciones s
                        WHERE s.id_sancion = r.nombre::uuid
                          AND s.anulada = (r.definicion->>'anulada')::boolean
                          AND s.motivo_anulacion IS NOT DISTINCT FROM (r.definicion->>'motivo_anulacion')
                          AND s.anulada_por IS NOT DISTINCT FROM NULLIF(r.definicion->>'anulada_por','')::uuid) THEN
            RAISE EXCEPTION 'POST-CHECK: la sanción % no volvió a su estado original.', r.nombre;
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 7. El respaldo se CONSERVA renombrado (no se borra) para auditoria y para que
--    una futura re-aplicacion de la migracion tome un respaldo nuevo.
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    EXECUTE format('ALTER TABLE public._backup_politica_inasistencias_20261124 RENAME TO %I',
                   '_backup_politica_inasistencias_20261124_rb_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'));
END $$;

COMMIT;
NOTIFY pgrst, 'reload schema';
