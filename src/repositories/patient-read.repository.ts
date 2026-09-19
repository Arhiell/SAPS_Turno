import { supabase } from "../config/supabase.js";
import { patientSelect, flattenPatient, type PatientRow } from "./patient-select.js";

export const findPatients = async (from: number, to: number) => {
  const { data, count, error } = await supabase.from("pacientes")
    .select(patientSelect, { count: "exact" }).eq("activo", true)
    .order("persona(apellidos)", { ascending: true })
    .order("persona(nombres)", { ascending: true })
    .order("id_paciente", { ascending: true })
    .range(from, to).returns<PatientRow[]>();
  if (error) throw error;
  return { patients: (data ?? []).map(flattenPatient), total: count ?? 0 };
};

export const findPatientById = async (idPatient: string) => {
  const { data, error } = await supabase.from("pacientes")
    .select(patientSelect).eq("id_paciente", idPatient)
    .returns<PatientRow[]>().maybeSingle();
  if (error) throw error;
  return data ? flattenPatient(data) : null;
};

export const findPatientDetailsByDni = async (dni: string) => {
  const { data, error } = await supabase.from("pacientes")
    .select(patientSelect).eq("persona.dni", dni)
    .returns<PatientRow[]>().maybeSingle();
  if (error) throw error;
  return data ? flattenPatient(data) : null;
};

export const findPatientByPersonId = async (idPerson: string) => {
  const { data, error } = await supabase.from("pacientes")
    .select("id_paciente, id_persona, activo").eq("id_persona", idPerson).maybeSingle();
  if (error) throw error;
  return data;
};