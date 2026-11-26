
import api from './api';
import type { CierreInput } from '../types/cierre-calendario.types';
import { isAxiosError } from 'axios';

import type {
  HorarioInput,
  BloqueoInput,
} from '../types/configuracion.types';

import type { Turno } from '../types/turno.types';

// Define los tipos de cambios permitidos en la agenda.
export type AgendaChange =
  | { tipo: 'cierre'; id?: string; datos: CierreInput }
  | {
      tipo: 'horario';
      id: string;
      datos: HorarioInput;
    }
  | {
      tipo: 'bloqueo';
      id?: string;
      datos: BloqueoInput;
    };

// Define los datos necesarios de los turnos afectados.
export type AffectedTurno = Pick<
  Turno,
  | 'id_turno'
  | 'version'
  | 'fecha_hora_inicio'
  | 'fecha_hora_fin'
  | 'paciente'
  | 'profesional'
  | 'especialidad'
  | 'salita'
  | 'estado'
>;

// Representa una propuesta de reprogramación.
export interface AgendaProposal {
  id_turno: string;
  version: number;

  destino: {
    id_horario: string;
    fecha_hora_inicio: string;
    fecha_hora_fin: string;
  } | null;
}

export interface SlotDisponibilidadOpcion {
  id_horario: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface GrupoFechaDisponibilidad {
  fecha: string;
  fecha_formateada: string;
  dia_semana: string;
  slots: SlotDisponibilidadOpcion[];
}

export interface AgendaAvailabilityResponse {
  version: number;
  dias: number;
  fecha_consultada?: string;
  total_disponibles: number;
  opciones: SlotDisponibilidadOpcion[];
  agrupadas_por_fecha: GrupoFechaDisponibilidad[];
}

// Representa el resultado de confirmar una reprogramación.
export interface AgendaResult {
  id_turno: string;
  confirmado: boolean;
  mensaje: string;
}

export const getAgendaAvailability = async (
  cambio: AgendaChange,
  id_turno: string,
  params: { fecha?: string; dias?: number } | string
): Promise<AgendaAvailabilityResponse> => {
  const payload =
    typeof params === 'string'
      ? { cambio, id_turno, fecha: params }
      : { cambio, id_turno, fecha: params.fecha, dias: params.dias };

  const response = await api.post<AgendaAvailabilityResponse>(
    '/turnos/reprogramacion/disponibilidad',
    payload
  );
  return response.data;
};

// Identifica errores de conflicto relacionados con la agenda.
export const isAgendaConflict = (error: unknown) =>
  isAxiosError(error) &&
  error.response?.data?.code === 'AGENDA_CONFLICT';

// Consulta los turnos afectados por un cambio de agenda.
export const getAgendaImpact = async (
  cambio: AgendaChange
) =>
  (
    await api.post<{
      afectados: AffectedTurno[];
    }>(
      '/turnos/reprogramacion/impacto',
      cambio
    )
  ).data;

// Obtiene propuestas de reprogramación dentro del período indicado.
export const getAgendaProposal = async (
  cambio: AgendaChange,
  dias: number
) =>
  (
    await api.post<{
      propuestas: AgendaProposal[];
      pendientes: number;
    }>(
      '/turnos/reprogramacion/propuesta',
      {
        cambio,
        dias,
      }
    )
  ).data;

// Confirma las propuestas que tienen un destino asignado.
export const confirmAgendaProposal = async (
  cambio: AgendaChange,
  motivo: string,
  propuestas: AgendaProposal[]
) =>
  (
    await api.post<{
      resultados: AgendaResult[];
    }>(
      '/turnos/reprogramacion/confirmar',
      {
        cambio,
        motivo,

        // Envía únicamente los turnos con destino propuesto.
        turnos: propuestas
          .filter((p) => p.destino)
          .map((p) => ({
            id_turno: p.id_turno,
            version: p.version,
            id_horario: p.destino!.id_horario,
            fecha_hora_inicio: p.destino!.fecha_hora_inicio,
          })),
      }
    )
  ).data;
