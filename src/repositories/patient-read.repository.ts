import {
  supabase
} from "../config/supabase.js";

/**
 * Campos utilizados en las consultas.
 */
const patientSelect = `
  id_paciente,
  id_usuario,
  id_barrio,
  id_salita_asignada,
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
  obra_social,
  numero_afiliado,
  contacto_emergencia_nombre,
  contacto_emergencia_telefono,
  activo,
  fecha_registro,
  fecha_actualizacion
`;

/**
 * Lista pacientes mediante paginación.
 */
export const findPatients = async (
  from: number,
  to: number
) => {
  const { data, count, error } =
    await supabase
      .from("pacientes")
      .select(
        patientSelect,
        {
          count: "exact"
        }
      )
      .eq("activo", true)
      .order("apellidos", {
        ascending: true
      })
      .order("nombres", {
        ascending: true
      })
      .range(from, to);

  if (error) {
    throw new Error(
      `Error listando pacientes: ${error.message}`
    );
  }

  return {
    patients: data ?? [],
    total: count ?? 0
  };
};

/**
 * Busca un paciente mediante UUID.
 */
export const findPatientById = async (
  idPatient: string
) => {
  const { data, error } = await supabase
    .from("pacientes")
    .select(patientSelect)
    .eq(
      "id_paciente",
      idPatient
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando paciente: ${error.message}`
    );
  }

  return data;
};

/**
 * Busca un paciente mediante DNI.
 */
export const findPatientDetailsByDni =
  async (
    dni: string
  ) => {
    const { data, error } =
      await supabase
        .from("pacientes")
        .select(patientSelect)
        .eq("dni", dni)
        .maybeSingle();

    if (error) {
      throw new Error(
        `Error buscando paciente por DNI: ${error.message}`
      );
    }

    return data;
  };