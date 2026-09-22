import { supabase } from "../config/supabase.js";

const horarioSelect = `
  id_horario,
  id_profesional,
  id_especialidad,
  id_salita,
  dia_semana,
  hora_inicio,
  hora_fin,
  duracion_turno_minutos,
  cupo_maximo_diario,
  vigencia_desde,
  vigencia_hasta,
  activo,
  fecha_creacion,
  fecha_actualizacion
`;

export const getAllHorarios = async () => {
  const { data, error } = await supabase
    .from("horarios_atencion")
    .select(horarioSelect)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) throw error;

  return data;
};

export const getHorarioById = async (id: string) => {
  const { data, error } = await supabase
    .from("horarios_atencion")
    .select(horarioSelect)
    .eq("id_horario", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

// Busca solo los horarios candidatos; Turnos valida la franja y su duración.
export const findHorariosParaTurno = async (
  profesional: string, especialidad: string, salita: string, dia: number, fecha: string
) => {
  const { data, error } = await supabase.from("horarios_atencion").select(horarioSelect)
    .eq("id_profesional", profesional).eq("id_especialidad", especialidad)
    .eq("id_salita", salita).eq("dia_semana", dia).eq("activo", true)
    .lte("vigencia_desde", fecha).or(`vigencia_hasta.is.null,vigencia_hasta.gte.${fecha}`);
  if (error) throw error;
  return data ?? [];
};

export const createHorario = async (
  input: {
    id_profesional: string;
    id_especialidad: string;
    id_salita: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    duracion_turno_minutos?: number;
    cupo_maximo_diario?: number | null;
    vigencia_desde?: string;
    vigencia_hasta?: string | null;
    activo?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("horarios_atencion")
    .insert(input)
    .select(horarioSelect)
    .single();

  if (error) throw error;

  return data;
};

export const updateHorario = async (
  id: string,
  input: {
    id_profesional?: string;
    id_especialidad?: string;
    id_salita?: string;
    dia_semana?: number;
    hora_inicio?: string;
    hora_fin?: string;
    duracion_turno_minutos?: number;
    cupo_maximo_diario?: number | null;
    vigencia_desde?: string;
    vigencia_hasta?: string | null;
    activo?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("horarios_atencion")
    .update({
      ...input,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id_horario", id)
    .select(horarioSelect)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const deleteHorario = async (id: string) => {
  const { data, error } = await supabase
    .from("horarios_atencion")
    .update({
      activo: false,
      fecha_actualizacion: new Date().toISOString(),
    })
    .eq("id_horario", id)
    .select(horarioSelect)
    .maybeSingle();

  if (error) throw error;

  return data;
};
