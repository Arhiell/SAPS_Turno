import {
  supabase
} from "../config/supabase.js";

import type {
  CreatePatientInput
} from "../validators/patient.validator.js";

/**
 * Busca un paciente por DNI.
 *
 * Se usa para evitar duplicados antes
 * de intentar el INSERT.
 */
export const findPatientByDni = async (
  dni: string
) => {
  const { data, error } = await supabase
    .from("pacientes")
    .select(`
      id_paciente,
      dni,
      activo
    `)
    .eq("dni", dni)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error buscando paciente por DNI: ${error.message}`
    );
  }

  return data;
};

/**
 * Inserta un paciente en PostgreSQL.
 *
 * No aplica reglas de negocio.
 */
export const createPatient = async (
  patient: CreatePatientInput
) => {
  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      id_usuario:
        patient.id_usuario ?? null,

      id_barrio:
        patient.id_barrio,

      id_salita_asignada:
        patient.id_salita_asignada,

      dni:
        patient.dni,

      nombres:
        patient.nombres,

      apellidos:
        patient.apellidos,

      fecha_nacimiento:
        patient.fecha_nacimiento,

      sexo:
        patient.sexo,

      telefono:
        patient.telefono ?? null,

      email:
        patient.email ?? null,

      direccion:
        patient.direccion,

      localidad:
        patient.localidad ?? "Goya",

      provincia:
        patient.provincia ?? "Corrientes",

      codigo_postal:
        patient.codigo_postal ?? null,

      obra_social:
        patient.obra_social ?? null,

      numero_afiliado:
        patient.numero_afiliado ?? null,

      contacto_emergencia_nombre:
        patient.contacto_emergencia_nombre ?? null,

      contacto_emergencia_telefono:
        patient.contacto_emergencia_telefono ?? null
    })
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
      fecha_registro
    `)
    .single();

  if (error) {
    throw error;
  }

  return data;
};