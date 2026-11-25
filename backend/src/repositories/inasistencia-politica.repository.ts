import { supabase } from '../config/supabase.js';

export interface AdvertenciaRow {
  id_advertencia: string;
  id_paciente: string;
  id_turno: string;
  nivel: 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL';
  motivo: string;
  anulada: boolean;
  motivo_anulacion?: string | null;
  anulada_por?: string | null;
  fecha_emision: string;
  fecha_anulacion?: string | null;
}

export interface JustificacionRow {
  id_justificacion: string;
  id_turno: string;
  id_paciente: string;
  motivo: string;
  documentacion_ref?: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  presentada_por?: string | null;
  evaluado_por?: string | null;
  fecha_evaluacion?: string | null;
  motivo_resolucion?: string | null;
  fecha_creacion: string;
}

/**
 * Conteo determinístico de inasistencias injustificadas dentro de la ventana móvil
 */
export const countUnjustifiedAbsences = async (
  patientId: string,
  windowDays = 90
): Promise<number> => {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // 1. Obtener los turnos en NO_ASISTIO en la ventana de fechas
  const { data: turnos, error: errTurnos } = await supabase
    .from('turnos')
    .select('id_turno, fecha_hora_inicio, estado:estados_turno!inner(codigo)')
    .eq('id_paciente', patientId)
    .eq('estado.codigo', 'NO_ASISTIO')
    .gte('fecha_hora_inicio', since)
    .lte('fecha_hora_inicio', now);

  if (errTurnos || !turnos || turnos.length === 0) {
    return 0;
  }

  const turnoIds = turnos.map((t) => t.id_turno);

  // 2. Consultar justificaciones aprobadas para esos turnos
  const { data: justificacionesAprobadas } = await supabase
    .from('inasistencias_justificaciones')
    .select('id_turno')
    .in('id_turno', turnoIds)
    .eq('estado', 'APROBADA');

  const turnosJustificados = new Set(
    (justificacionesAprobadas || []).map((j) => j.id_turno)
  );

  // 3. Anular una advertencia NO excluye la falta: solo una justificación aprobada
  // o una rectificación (turno fuera de NO_ASISTIO) la descuenta.

  // 4. Filtrar los turnos que realmente computan como faltas activas
  const faltasComputables = turnos.filter(
    (t) => !turnosJustificados.has(t.id_turno)
  );

  return faltasComputables.length;
};

/**
 * Inserta una advertencia con protección de unicidad (idempotencia)
 */
export const insertAdvertencia = async (data: {
  id_paciente: string;
  id_turno: string;
  nivel: 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL';
  motivo?: string;
}): Promise<AdvertenciaRow | null> => {
  const { data: inserted, error } = await supabase
    .from('advertencias_inasistencia')
    .insert({
      id_paciente: data.id_paciente,
      id_turno: data.id_turno,
      nivel: data.nivel,
      motivo: data.motivo || 'Inasistencia no justificada a turno médico programado.',
    })
    .select()
    .maybeSingle();

  if (error) {
    // Si ya existe por unicidad id_turno, devolver la existente
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('advertencias_inasistencia')
        .select('*')
        .eq('id_turno', data.id_turno)
        .maybeSingle();
      return existing;
    }
    throw error;
  }

  return inserted;
};

/**
 * Consulta las advertencias vigentes de un paciente
 */
export const findAdvertenciasByPatient = async (
  patientId: string,
  includeAnuladas = false
): Promise<AdvertenciaRow[]> => {
  let query = supabase
    .from('advertencias_inasistencia')
    .select('*')
    .eq('id_paciente', patientId)
    .order('fecha_emision', { ascending: false });

  if (!includeAnuladas) {
    query = query.eq('anulada', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Anula una advertencia vinculada a un turno
 */
export const anularAdvertenciaByTurno = async (
  id_turno: string,
  motivo: string,
  anulada_por?: string | null
): Promise<void> => {
  await supabase
    .from('advertencias_inasistencia')
    .update({
      anulada: true,
      motivo_anulacion: motivo,
      anulada_por: anulada_por ?? null,
      fecha_anulacion: new Date().toISOString(),
    })
    .eq('id_turno', id_turno)
    .eq('anulada', false);
};

/**
 * Inserta una justificación para un turno
 */
export const insertJustificacion = async (data: {
  id_turno: string;
  id_paciente: string;
  motivo: string;
  documentacion_ref?: string | null | undefined;
  presentada_por?: string | null | undefined;
}): Promise<JustificacionRow> => {
  const { data: inserted, error } = await supabase
    .from('inasistencias_justificaciones')
    .insert({
      id_turno: data.id_turno,
      id_paciente: data.id_paciente,
      motivo: data.motivo,
      documentacion_ref: data.documentacion_ref ?? null,
      presentada_por: data.presentada_por ?? null,
      estado: 'PENDIENTE',
    })
    .select()
    .single();

  if (error) throw error;
  return inserted;
};

/**
 * Busca una justificación por su ID
 */
export const findJustificacionById = async (
  id_justificacion: string
): Promise<JustificacionRow | null> => {
  const { data, error } = await supabase
    .from('inasistencias_justificaciones')
    .select('*')
    .eq('id_justificacion', id_justificacion)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Busca la justificación de un turno específico
 */
export const findJustificacionByTurno = async (
  id_turno: string
): Promise<JustificacionRow | null> => {
  const { data, error } = await supabase
    .from('inasistencias_justificaciones')
    .select('*')
    .eq('id_turno', id_turno)
    .maybeSingle();

  if (error) throw error;
  return data;
};

/**
 * Cuenta las justificaciones pendientes de un paciente para control anti-abuso
 */
export const countPendingJustificacionesByPatient = async (
  patientId: string
): Promise<number> => {
  const { count, error } = await supabase
    .from('inasistencias_justificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('id_paciente', patientId)
    .eq('estado', 'PENDIENTE');

  if (error) throw error;
  return count ?? 0;
};

/**
 * Lista justificaciones con filtros administrativos
 */
export const findJustificaciones = async (filters: {
  id_paciente?: string | undefined;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('inasistencias_justificaciones')
    .select(
      `
      id_justificacion,
      id_turno,
      id_paciente,
      motivo,
      documentacion_ref,
      estado,
      presentada_por,
      evaluado_por,
      fecha_evaluacion,
      motivo_resolucion,
      fecha_creacion,
      turno:turnos!inner(
        fecha_hora_inicio,
        especialidad:especialidades(nombre),
        salita:salitas(nombre)
      ),
      paciente:pacientes!inner(
        id_paciente,
        persona:personas(nombres, apellidos, dni)
      )
    `,
      { count: 'exact' }
    )
    .order('fecha_creacion', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.id_paciente) {
    query = query.eq('id_paciente', filters.id_paciente);
  }
  if (filters.estado) {
    query = query.eq('estado', filters.estado);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    data: data || [],
    pagination: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

/**
 * Dictamina una justificación (APROBADA o RECHAZADA)
 */
export const updateJustificacionDecision = async (
  id_justificacion: string,
  data: {
    estado: 'APROBADA' | 'RECHAZADA';
    evaluado_por: string;
    motivo_resolucion?: string | null | undefined;
  }
): Promise<JustificacionRow> => {
  const { data: updated, error } = await supabase
    .from('inasistencias_justificaciones')
    .update({
      estado: data.estado,
      evaluado_por: data.evaluado_por,
      motivo_resolucion: data.motivo_resolucion ?? null,
      fecha_evaluacion: new Date().toISOString(),
    })
    .eq('id_justificacion', id_justificacion)
    .select()
    .single();

  if (error) throw error;
  return updated;
};
