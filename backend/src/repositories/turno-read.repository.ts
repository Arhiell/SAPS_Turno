import { 
  supabase 
} from "../config/supabase.js";

import { 
  turnoSelect 
} from "./turno-select.js";

import { 
  agendaDayBounds 
} from "../utils/turno-time.js";

import type { 
  TurnoRow, 
  TurnoState 
} from "../types/turno.types.js";

import type { 
  TurnoQuery 
} from "../validators/turno-query.validator.js";

export const findTurnoById = async (id: string) => {
  const { data, error } = await supabase.from("turnos").select(turnoSelect)
    .eq("id_turno", id).returns<TurnoRow[]>().maybeSingle();
  if (error) throw error;
  return data;
};


export const findTurnoState = async (code: string) => {
  const { data, error } = await supabase.from("estados_turno")
    .select(
      "id_estado,codigo,nombre,ocupa_agenda,impide_otro_misma_especialidad,es_estado_final,activo"
    )
    .eq("codigo", code).eq("activo", true).returns<TurnoState[]>().maybeSingle();
  if (error) throw error;
  return data;
};

// El alcance se aplica en la consulta, antes de contar o paginar.
export const findTurnos = async (filters: TurnoQuery, scope: string[] | null, stateId?: string,
  agenda?: { id_especialidad?: string | undefined }) => {

  let query = supabase.from("turnos").select(
    agenda ? turnoSelect.replace("estado:estados_turno(", "estado:estados_turno!inner(")
      .replace(
        "salita:salitas(id_salita,nombre)",
        "salita:salitas(id_salita,nombre,direccion)"
      ) : turnoSelect,
    { 
      count: "exact" 
    }
  );

  if (scope) query = query.in("id_salita", scope);

  for (const key of ["id_paciente", "id_profesional", "id_salita"] as const) {
    if (filters[key]) query = query.eq(key, filters[key]);
  }

  if (stateId) query = query.eq("id_estado", stateId);

  // La lista de atención incluye solo estados no finales del catálogo.
  if (agenda) {
    query = query.eq("estado.es_estado_final", false)
      .not("estado.codigo", "in", "(CANCELADO,REPROGRAMADO)");
    if (agenda.id_especialidad) query = query.eq("id_especialidad", agenda.id_especialidad);
  }

  if (filters.fecha) {
    const bounds = agendaDayBounds(filters.fecha);
    query = query.gte("fecha_hora_inicio", bounds.start).lt(
      "fecha_hora_inicio", bounds.end
    );
  }

  const from = (filters.page - 1) * filters.limit;

  const { 
    data, 
    count, 
    error 
  } = await query.order("fecha_hora_inicio").order("id_turno")
    .range(from, from + filters.limit - 1).returns<TurnoRow[]>();
    
  if (error) throw error;

  return { turnos: data ?? [], total: count ?? 0 };
};
