import { supabase } from "../config/supabase.js";

import type {
  CreatePatientTutorInput,
  UpdatePatientTutorInput
} from "../validators/patient-tutor.validator.js";


/**
 * Busca una relación vigente entre un paciente y un tutor.
 */
export const findActivePatientTutorRelation = async (
  patientId: string,
  tutorId: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .select("*")
    .eq("id_paciente", patientId)
    .eq("id_tutor", tutorId)
    .is("fecha_hasta", null)
    .maybeSingle();

  if (error) throw error;

  return data;
};


/**
 * Busca cualquier relación paciente-tutor,
 * incluso si ya fue finalizada.
 */
export const findPatientTutorRelation = async (
  patientId: string,
  tutorId: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .select("*")
    .eq("id_paciente", patientId)
    .eq("id_tutor", tutorId)
    .order("fecha_desde", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
};


/**
 * Busca el tutor principal vigente de un paciente.
 */
export const findCurrentPrincipalTutor = async (
  patientId: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .select("*")
    .eq("id_paciente", patientId)
    .eq("es_principal", true)
    .is("fecha_hasta", null)
    .maybeSingle();

  if (error) throw error;

  return data;
};


/**
 * Crea una nueva relación paciente-tutor.
 */
export const createPatientTutorRelation = async (
  patientId: string,
  input: CreatePatientTutorInput
) => {
  const payload = {
    id_paciente: patientId,
    id_tutor: input.id_tutor,
    parentesco: input.parentesco,
    ...(input.es_principal !== undefined && {
      es_principal: input.es_principal
    }),
    ...(input.puede_gestionar_turnos !== undefined && {
      puede_gestionar_turnos: input.puede_gestionar_turnos
    }),
    ...(input.fecha_desde !== undefined && {
      fecha_desde: input.fecha_desde
    }),
    ...(input.fecha_hasta !== undefined && {
      fecha_hasta: input.fecha_hasta
    })
  };

  const { data, error } = await supabase
    .from("paciente_tutores")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  return data;
};


/**
 * Lista los tutores relacionados actualmente con un paciente.
 */
export const findTutorsByPatientId = async (
  patientId: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .select("*")
    .eq("id_paciente", patientId)
    .is("fecha_hasta", null)
    .order("es_principal", { ascending: false })
    .order("fecha_desde", { ascending: true });

  if (error) throw error;

  return data ?? [];
};


/**
 * Lista los pacientes relacionados actualmente con un tutor.
 */
export const findPatientsByTutorId = async (
  tutorId: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .select("*")
    .eq("id_tutor", tutorId)
    .is("fecha_hasta", null)
    .order("fecha_desde", { ascending: true });

  if (error) throw error;

  return data ?? [];
};


/**
 * Actualiza datos propios de la relación.
 */
export const updatePatientTutorRelation = async (
  patientId: string,
  tutorId: string,
  input: UpdatePatientTutorInput
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .update(input)
    .eq("id_paciente", patientId)
    .eq("id_tutor", tutorId)
    .is("fecha_hasta", null)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data;
};


/**
 * Finaliza la relación sin eliminarla físicamente.
 */
export const endPatientTutorRelation = async (
  patientId: string,
  tutorId: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from("paciente_tutores")
    .update({
      fecha_hasta: endDate
    })
    .eq("id_paciente", patientId)
    .eq("id_tutor", tutorId)
    .is("fecha_hasta", null)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data;
};