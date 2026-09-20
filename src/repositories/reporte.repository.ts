import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/app-error.js";

import type {
  ReporteQuery,
} from "../validators/reporte.validator.js";

// Trae los turnos necesarios para generar reportes.
export const findTurnosReporte = async (
  filters: ReporteQuery,
) => {
  const desde =
    `${filters.fecha_desde}T00:00:00-03:00`;

  const hasta =
    `${filters.fecha_hasta}T23:59:59.999-03:00`;

  let query = supabase
    .from("turnos")
    .select(`
      id_turno,
      id_paciente,
      id_profesional,
      id_especialidad,
      id_salita,
      fecha_hora_inicio,

      estado:estados_turno!turnos_id_estado_fkey (
        codigo,
        nombre
      ),

      especialidad:especialidades (
        id_especialidad,
        nombre
      ),

      profesional:profesionales (
        id_profesional,
        persona:personas (
          nombres,
          apellidos
        )
      ),

      salita:salitas (
        id_salita,
        nombre
      )
    `)
    .gte("fecha_hora_inicio", desde)
    .lte("fecha_hora_inicio", hasta);

  // Limita el reporte a una salita.
  if (filters.id_salita) {
    query = query.eq(
      "id_salita",
      filters.id_salita,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(
      "No se pudieron obtener los datos del reporte",
      500,
    );
  }

  return data ?? [];
};