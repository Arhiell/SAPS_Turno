-- ============================================================================
-- CORA — DIAGNÓSTICO DE SOLO LECTURA PREVIO A MIGRACIÓN EN SUPABASE
-- Archivo: backend/src/BBDD/diagnostico_inasistencias_supabase.sql
-- SEGURIDAD: Este script es EXCLUSIVAMENTE de consulta (SELECT).
-- NO realiza INSERT, UPDATE, DELETE, ALTER ni DROP en tablas del sistema.
-- Es seguro ejecutarlo tanto ANTES como DESPUÉS de la migración SQL.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. FUNCIÓN DE CONTEO TEMPORAL DE SESIÓN (pg_temp)
-- Evalúa las inasistencias computables según las reglas exactas de la política:
-- - Excluye justificaciones APROBADAS (si la tabla existe).
-- - Excluye advertencias rectificadas/anuladas (si la tabla existe).
-- - Excluye turnos con rectificación administrativa formal (si la columna existe).
-- No crea ningún objeto permanente en la base de datos.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.fn_contar_inasistencias_computables_diag(
    p_id_paciente UUID,
    p_ventana_dias INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_total INTEGER;
    v_has_just BOOLEAN;
    v_has_adv BOOLEAN;
    v_has_rectCol BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'inasistencias_justificaciones'
    ) INTO v_has_just;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'advertencias_inasistencia'
    ) INTO v_has_adv;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'turnos' AND column_name = 'rectificado_por'
    ) INTO v_has_rectCol;

    EXECUTE format('
        SELECT COUNT(t.id_turno)
        FROM public.turnos t
        JOIN public.estados_turno et ON t.id_estado = et.id_estado
        WHERE t.id_paciente = $1
          AND et.codigo = ''NO_ASISTIO''
          AND t.fecha_hora_inicio >= CURRENT_TIMESTAMP - ($2 || '' days'')::INTERVAL
          AND t.fecha_hora_inicio <= CURRENT_TIMESTAMP
          %s
          %s
          %s
    ',
    CASE WHEN v_has_just THEN 'AND NOT EXISTS (SELECT 1 FROM public.inasistencias_justificaciones j WHERE j.id_turno = t.id_turno AND j.estado = ''APROBADA'')' ELSE '' END,
    CASE WHEN v_has_adv THEN 'AND NOT EXISTS (SELECT 1 FROM public.advertencias_inasistencia a WHERE a.id_turno = t.id_turno AND a.anulada = TRUE)' ELSE '' END,
    CASE WHEN v_has_rectCol THEN 'AND t.rectificado_por IS NULL' ELSE '' END
    ) INTO v_total USING p_id_paciente, p_ventana_dias;

    RETURN COALESCE(v_total, 0);
END;
$$;

-- ----------------------------------------------------------------------------
-- 1. TRIGGERS INSTALADOS EN public.turnos Y SUS FUNCIONES ASOCIADAS
-- Permite verificar si existe el trigger previo 'tr_turnos_sancionar_inasistencia'
-- u otros triggers activos que alteren sanciones o estados.
-- ----------------------------------------------------------------------------
SELECT
    tg.tgname AS trigger_name,
    p.proname AS function_name,
    CASE tg.tgtype::integer & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS trigger_timing,
    CASE tg.tgtype::integer & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 20 THEN 'INSERT/UPDATE'
        ELSE 'OTHER'
    END AS trigger_event,
    pg_get_triggerdef(tg.oid) AS definicion_completa
FROM pg_trigger tg
JOIN pg_class c ON tg.tgrelid = c.oid
JOIN pg_proc p ON tg.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'turnos'
  AND NOT tg.tgisinternal
ORDER BY tg.tgname;

-- ----------------------------------------------------------------------------
-- 2. SANCIONES ACTIVAS EN EL SISTEMA
-- Muestra todas las restricciones vigentes al día de hoy en public.sanciones.
-- ----------------------------------------------------------------------------
SELECT
    s.id_sancion,
    s.id_paciente,
    p.dni,
    p.apellidos || ', ' || p.nombres AS paciente_nombre,
    s.motivo,
    s.fecha_inicio,
    s.fecha_fin,
    ROUND(EXTRACT(EPOCH FROM (s.fecha_fin - CURRENT_TIMESTAMP)) / 86400.0, 1) AS dias_restantes,
    s.anulada
FROM public.sanciones s
JOIN public.pacientes pac ON s.id_paciente = pac.id_paciente
JOIN public.personas p ON pac.id_persona = p.id_persona
WHERE NOT s.anulada
  AND s.fecha_inicio <= CURRENT_TIMESTAMP
  AND s.fecha_fin > CURRENT_TIMESTAMP
ORDER BY s.fecha_fin DESC;

-- ----------------------------------------------------------------------------
-- 3. INASISTENCIAS COMPUTABLES EN LOS ÚLTIMOS 90 DÍAS (POR PACIENTE Y SALITA)
-- Aplica el mismo criterio estricto de exclusión que fn_contar_inasistencias_injustificadas.
-- ----------------------------------------------------------------------------
SELECT
    t.id_paciente,
    p.dni,
    p.apellidos || ', ' || p.nombres AS paciente_nombre,
    s.nombre AS salita_nombre,
    pg_temp.fn_contar_inasistencias_computables_diag(t.id_paciente, 90) AS inasistencias_computables_90d,
    MIN(t.fecha_hora_inicio) AS primera_inasistencia_periodo,
    MAX(t.fecha_hora_inicio) AS ultima_inasistencia_periodo
FROM public.turnos t
JOIN public.estados_turno et ON t.id_estado = et.id_estado
JOIN public.pacientes pac ON t.id_paciente = pac.id_paciente
JOIN public.personas p ON pac.id_persona = p.id_persona
JOIN public.salitas s ON t.id_salita = s.id_salita
WHERE et.codigo = 'NO_ASISTIO'
  AND t.fecha_hora_inicio >= CURRENT_TIMESTAMP - INTERVAL '90 days'
  AND t.fecha_hora_inicio <= CURRENT_TIMESTAMP
GROUP BY t.id_paciente, p.dni, p.apellidos, p.nombres, s.nombre
HAVING pg_temp.fn_contar_inasistencias_computables_diag(t.id_paciente, 90) > 0
ORDER BY inasistencias_computables_90d DESC, ultima_inasistencia_periodo DESC;

-- ----------------------------------------------------------------------------
-- 4. DETECCIÓN DE SANCIONES HISTÓRICAS INCOMPATIBLES CON LA POLÍTICA PROGRESIVA
-- Cruza cada sanción vigente con el conteo computable exacto de inasistencias en 90 días.
-- Identifica a pacientes sancionados por el trigger previo con menos de 3 inasistencias.
-- ----------------------------------------------------------------------------
SELECT
    s.id_sancion,
    s.id_paciente,
    p.dni,
    p.apellidos || ', ' || p.nombres AS paciente_nombre,
    s.motivo,
    s.fecha_inicio,
    s.fecha_fin,
    pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) AS inasistencias_computables_90d,
    CASE
        WHEN pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) = 0 THEN
            'CRÍTICA: 0 inasistencias computables en 90d (posible turno rectificado o error de registro)'
        WHEN pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) < 3 THEN
            'INCOMPATIBLE: ' || pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) || ' inasistencia(s). Sancionado por trigger anterior de 1 falta'
        ELSE
            'COMPATIBLE: ' || pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) || ' inasistencias computables (cumple umbral >= 3)'
    END AS diagnostico_compatibilidad,
    CASE
        WHEN pg_temp.fn_contar_inasistencias_computables_diag(s.id_paciente, 90) < 3 THEN
            'Requiere revisión administrativa: evaluar anulación de sanción y aplicar advertencia correspondiente'
        ELSE
            'Restricción online válida según política progresiva'
    END AS accion_administrativa_sugerida
FROM public.sanciones s
JOIN public.pacientes pac ON s.id_paciente = pac.id_paciente
JOIN public.personas p ON pac.id_persona = p.id_persona
WHERE NOT s.anulada
  AND s.fecha_inicio <= CURRENT_TIMESTAMP
  AND s.fecha_fin > CURRENT_TIMESTAMP
ORDER BY inasistencias_computables_90d ASC, s.fecha_inicio DESC;
