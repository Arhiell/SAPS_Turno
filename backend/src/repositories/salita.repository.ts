import { supabase } from "../config/supabase.js";

// GET todos
export const getAllSalitas = async () => {
  const { data, error } = await supabase
    .from("salitas")
    .select(`
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
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(`Error consultando salitas: ${error.message}`);
  }

  return data;
};

// GET por ID
export const getSalitaById = async (id: string) => {
  const { data, error } = await supabase
    .from("salitas")
    .select(`
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
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .eq("id_salita", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Error consultando salita: ${error.message}`);
  }

  return data;
};

// POST
export const createSalita = async (salita: {
  codigo: string;
  nombre: string;
  direccion: string;
  id_barrio: string;
  telefono?: string | null;
  email?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  activo?: boolean;
}) => {
  const { data, error } = await supabase
    .from("salitas")
    .insert(salita)
    .select(`
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
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .single();

  if (error) {
    throw new Error(`Error creando salita: ${error.message}`);
  }

  return data;
};

// PUT
export const updateSalita = async (
  id: string,
  salita: {
    codigo?: string;
    nombre?: string;
    direccion?: string;
    id_barrio?: string;
    telefono?: string | null;
    email?: string | null;
    latitud?: number | null;
    longitud?: number | null;
    horario_apertura?: string | null;
    horario_cierre?: string | null;
    activo?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("salitas")
    .update(salita)
    .eq("id_salita", id)
    .select(`
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
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .maybeSingle();

  if (error) {
    throw new Error(`Error actualizando salita: ${error.message}`);
  }

  return data;
};

// DELETE lógico
export const deleteSalita = async (id: string) => {
  const { data, error } = await supabase
    .from("salitas")
    .update({ activo: false })
    .eq("id_salita", id)
    .select(`
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
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .maybeSingle();

  if (error) {
    throw new Error(`Error eliminando salita: ${error.message}`);
  }

  return data;
};