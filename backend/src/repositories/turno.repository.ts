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
import { generateTurnoCode, isTurnoCodeConflict } from '../utils/turno-code.js';

export type TurnoInsert = Pick<TurnoRow, "codigo_turno" | "id_paciente" | "id_profesional" |
  "id_especialidad" | "id_salita" | "id_horario" | "id_estado" | "fecha_hora_inicio" | "fecha_hora_fin"> & {
    creado_por: string; motivo_consulta?: string | null | undefined; observaciones?: string | null | undefined;
  };
// Una sola escritura: los triggers crean historial y las exclusiones resuelven carreras.
export const insertTurno = async (input: Omit<TurnoInsert, 'codigo_turno'>) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from("turnos")
      .insert({ ...input, codigo_turno: generateTurnoCode() })
      .select(turnoSelect).returns<TurnoRow[]>().single();
    if (!error) return data!;
    // Solo se reintenta la colisión de código; los conflictos de agenda se propagan.
    if (!isTurnoCodeConflict(error) || attempt === 4) rethrowTurnoError(error);
  }
  throw new Error('No se pudo generar un código de turno único');
};
