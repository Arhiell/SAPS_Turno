import { 
  supabase 
} from "../config/supabase.js";

import { 
  turnoSelect 
} from "./turno-select.js";

import { 
  rethrowTurnoError 
} from "../utils/turno-error.js";

import type { 
  TurnoRow 
} from "../types/turno.types.js";

type TurnoEditable = Pick<TurnoRow, "id_profesional" | "id_especialidad" |
  "id_salita" | "id_horario" | "id_estado" | "fecha_hora_inicio" | "fecha_hora_fin" |
  "motivo_consulta" | "observaciones" | "motivo_cancelacion" | "cancelado_por" | "fecha_cancelacion">;

  export type TurnoPatch = { [K in keyof TurnoEditable]?: TurnoEditable[K] | undefined };

// La versión evita sobrescribir una cancelación o reprogramación concurrente.
export const patchTurno = async (id: string, version: number, input: TurnoPatch) => {
  const { 
    data, 
    error 
  } = await supabase.from("turnos").update(input)
    .eq("id_turno", id).eq("version", version).select(turnoSelect)
    .returns<TurnoRow[]>().maybeSingle();

  if (error) rethrowTurnoError(error);
  
  return data;
};
