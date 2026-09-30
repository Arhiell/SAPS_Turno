import { 
  supabase 
} from "../config/supabase.js";

import { 
  patientSelect, 
  flattenPatient, 
  type PatientRow 
} from "./patient-select.js";

export const findPatients = async (
  from: number, 
  to: number, 
  scope: string[] | null = null,
  search = ""
) => {
  let query = supabase.from("pacientes")
    .select(patientSelect, { count: "exact" }).eq("activo", true)
  
    if (scope !== null) query = query.in("id_salita_asignada", scope);

    // Cada palabra debe aparecer en el DNI, los nombres o los apellidos.
    // El filtro se aplica antes de contar y paginar, en cualquier orden del nombre.
    const text = search.trim();
    const terms = /^[\d.\s-]+$/.test(text)
      ? [text.replace(/\D/g, "")].filter(Boolean)
      : text.match(/[\p{L}\p{M}\p{N}'’-]+/gu) ?? [];
    if (terms.length) {
      const filters = terms.map(term => {
        const pattern = JSON.stringify(`*${term}*`);
        return `or(dni.ilike.${pattern},nombres.ilike.${pattern},apellidos.ilike.${pattern})`;
      });
      query = query.or(`and(${filters.join(",")})`, { referencedTable: "persona" });
    } else if (text) {
      return { patients: [], total: 0 };
    }
  
    const { data, count, error } = await query
    .order("persona(apellidos)", { ascending: true })
    .order("persona(nombres)", { ascending: true })
    .order("id_paciente", { ascending: true })
    .range(from, to).returns<PatientRow[]>();
  
    if (error) throw error;
 
    return { 
      patients: (data ?? []).map(flattenPatient),
      total: count ?? 0 
    };
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
    .select(
      "id_paciente, id_persona, activo"
    ).eq("id_persona", idPerson).maybeSingle();
  
    if (error) throw error;
  return data;
};
