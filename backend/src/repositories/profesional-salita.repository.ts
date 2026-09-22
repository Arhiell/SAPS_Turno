import { supabase } from "../config/supabase.js";

const profesionalSalitaSelect = `
  id_profesional,
  id_salita,
  fecha_desde,
  fecha_hasta,
  activo,
  salita:salitas (
    id_salita,
    codigo,
    nombre,
    direccion,
    id_barrio,
    telefono,
    email,
    latitud,
    longitud,
    horario_apertura,
    horario_cierre,
    activo
  )
`;

export const getSalitasByProfesional = async (
  idProfesional: string
) => {
  const { data, error } = await supabase
    .from("profesional_salita")
    .select(profesionalSalitaSelect)
    .eq("id_profesional", idProfesional)
    .order("fecha_desde", { ascending: false });

  if (error) {
    throw new Error(
      `Error consultando salitas del profesional: ${error.message}`
    );
  }

  return data;
};

export const createProfesionalSalita = async (
  relacion: {
    id_profesional: string;
    id_salita: string;
    fecha_desde?: string;
    fecha_hasta?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from("profesional_salita")
    .insert(relacion)
    .select(profesionalSalitaSelect)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateProfesionalSalita = async (
  idProfesional: string,
  idSalita: string,
  relacion: {
    fecha_desde?: string;
    fecha_hasta?: string | null;
    activo?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("profesional_salita")
    .update(relacion)
    .eq("id_profesional", idProfesional)
    .eq("id_salita", idSalita)
    .select(profesionalSalitaSelect)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteProfesionalSalita = async (
  idProfesional: string,
  idSalita: string
) => {
  const { data, error } = await supabase
    .from("profesional_salita")
    .update({
      activo: false,
      fecha_hasta: new Date()
        .toISOString()
        .split("T")[0]
    })
    .eq("id_profesional", idProfesional)
    .eq("id_salita", idSalita)
    .select(profesionalSalitaSelect)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};