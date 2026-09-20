import { supabase } from "../config/supabase.js";

const bloqueoSelect = `
  id_bloqueo,
  id_profesional,
  id_salita,
  id_especialidad,
  fecha,
  hora_inicio,
  hora_fin,
  dia_completo,
  motivo,
  creado_por,
  activo,
  fecha_creacion
`;

export const getAllBloqueos = async () => {
  const { data, error } = await supabase
    .from("bloqueos_agenda")
    .select(bloqueoSelect)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true, nullsFirst: true });

  if (error) throw error;

  return data;
};

export const getBloqueoById = async (id: string) => {
  const { data, error } = await supabase
    .from("bloqueos_agenda")
    .select(bloqueoSelect)
    .eq("id_bloqueo", id)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const createBloqueo = async (input: {
  id_profesional?: string | null;
  id_salita: string;
  id_especialidad?: string | null;
  fecha: string;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  dia_completo: boolean;
  motivo: string;
  activo?: boolean;
}) => {
  const { data, error } = await supabase
    .from("bloqueos_agenda")
    .insert(input)
    .select(bloqueoSelect)
    .single();

  if (error) throw error;

  return data;
};

export const updateBloqueo = async (
  id: string,
  input: {
    id_profesional?: string | null;
    id_salita?: string;
    id_especialidad?: string | null;
    fecha?: string;
    hora_inicio?: string | null;
    hora_fin?: string | null;
    dia_completo?: boolean;
    motivo?: string;
    activo?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("bloqueos_agenda")
    .update(input)
    .eq("id_bloqueo", id)
    .select(bloqueoSelect)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const deleteBloqueo = async (id: string) => {
  const { data, error } = await supabase
    .from("bloqueos_agenda")
    .update({
      activo: false,
    })
    .eq("id_bloqueo", id)
    .select(bloqueoSelect)
    .maybeSingle();

  if (error) throw error;

  return data;
};