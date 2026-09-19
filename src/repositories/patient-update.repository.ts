import {
  supabase
} from "../config/supabase.js";

import type {
  UpdatePatientInput
} from "../validators/patient-update.validator.js";

/**
 * Actualiza los datos administrativos
 * y personales de un paciente.
 */
export const updatePatient = async (
  idPatient: string,
  input: UpdatePatientInput
) => {
  const { data, error } = await supabase
    .from("pacientes")
    .update(input)
    .eq(
      "id_paciente",
      idPatient
    )
    .select(`
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
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Cambia únicamente el estado activo
 * del paciente.
 */
export const updatePatientStatus =
  async (
    idPatient: string,
    active: boolean
  ) => {
    const { data, error } =
      await supabase
        .from("pacientes")
        .update({
          activo: active
        })
        .eq(
          "id_paciente",
          idPatient
        )
        .select(`
          id_paciente,
          dni,
          nombres,
          apellidos,
          activo,
          fecha_actualizacion
        `)
        .single();

    if (error) {
      throw error;
    }

    return data;
};
