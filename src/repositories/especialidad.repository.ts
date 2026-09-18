import { supabase } from "../config/supabase.js";

export const getAllEspecialidades = async () => {
  const { data, error } = await supabase
    .from("especialidades")
    .select(`
      id_especialidad,
      codigo,
      nombre,
      descripcion,
      requiere_profesional,
      activo,
      fecha_creacion,
      fecha_actualizacion
    `)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(
      `Error consultando especialidades: ${error.message}`
    );
  }

  return data;
};