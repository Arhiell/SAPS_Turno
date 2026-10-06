import { supabase } from "../config/supabase.js";

const profesionalSelect = `
  id_profesional,
  id_persona,
  matricula,
  activo,
  fecha_alta,
  fecha_baja,
  fecha_actualizacion,
  persona:personas (
    id_persona,
    dni,
    nombres,
    apellidos,
    fecha_nacimiento,
    sexo,
    telefono,
    email,
    direccion,
    localidad,
    provincia,
    codigo_postal,
    activo
  )
`;

// Incluye inactivos: sus identificadores también siguen siendo únicos.
export const findProfesionalIdentity = async (field: "matricula" | "id_persona", value: string) => {
  const { data, error } = await supabase.from("profesionales")
    .select("id_profesional, id_persona").eq(field, value).maybeSingle();
  if (error) throw error;
  return data;
};

// GET todos
export const getAllProfesionales = async (scope: string[] | null = null) => {
  let query = supabase
    .from("profesionales")
    .select(`${profesionalSelect}, salitas:profesional_salita (
      id_salita, activo, fecha_desde, fecha_hasta,
      salita:salitas (id_salita, nombre, activo)
    )`);
  if (scope !== null) query = query.in("id_profesional", scope);
  const { data, error } = await query.order("fecha_alta", { ascending: false });

  if (error) {
    throw new Error(
      `Error consultando profesionales: ${error.message}`
    );
  }

  return data;
};

// GET por ID
export const getProfesionalById = async (id: string) => {
  const { data, error } = await supabase
    .from("profesionales")
    .select(profesionalSelect)
    .eq("id_profesional", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error consultando profesional: ${error.message}`
    );
  }

  return data;
};

// POST
export const createProfesional = async (profesional: {
  id_persona: string;
  matricula: string;
  activo?: boolean;
  fecha_alta?: string;
  fecha_baja?: string | null;
}) => {
  const { data, error } = await supabase
    .from("profesionales")
    .insert(profesional)
    .select(profesionalSelect)
    .single();

  if (error) {
    // Conserva el código UNIQUE para responder con un conflicto amigable.
    throw error;
  }

  return data;
};

// PUT
export const updateProfesional = async (
  id: string,
  profesional: {
    id_persona?: string;
    matricula?: string;
    activo?: boolean;
    fecha_alta?: string;
    fecha_baja?: string | null;
  }
) => {
  const { data, error } = await supabase
    .from("profesionales")
    .update(profesional)
    .eq("id_profesional", id)
    .select(profesionalSelect)
    .maybeSingle();

  if (error) {
    // Conserva el código UNIQUE para responder con un conflicto amigable.
    throw error;
  }

  return data;
};

// DELETE lógico
export const deleteProfesional = async (id: string) => {
  const { data, error } = await supabase
    .from("profesionales")
    .update({
      activo: false,
      fecha_baja: new Date()
        .toISOString()
        .split("T")[0]
    })
    .eq("id_profesional", id)
    .select(profesionalSelect)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error eliminando profesional: ${error.message}`
    );
  }

  return data;
};
