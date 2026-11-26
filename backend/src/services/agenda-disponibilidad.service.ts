import { getAgendaImpact } from './agenda-impacto.service.js';
import { obtenerDisponibilidad } from './disponibilidad.service.js';
import { destinationAllowed } from './agenda-propuesta.service.js';
import { validateTurnoAgenda } from './turno-agenda.service.js';
import { AppError } from '../utils/app-error.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import type { AgendaChange } from '../validators/agenda-impacto.validator.js';
import { agendaDateTime } from '../utils/turno-time.js';
import { supabase } from '../config/supabase.js';

const formatFechaEs = (fechaStr: string) => {
  const parts = fechaStr.split('-');
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0));
  const formatted = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

const formatDiaSemana = (fechaStr: string) => {
  const parts = fechaStr.split('-');
  const d = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0));
  const formatted = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(d);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

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

// Usa la disponibilidad existente, soporta búsqueda en ventana multifecha o fecha puntual,
// y considera el cambio de agenda todavía no guardado.
export const getAgendaAvailability = async (
  cambio: AgendaChange,
  id: string,
  params: { fecha?: string | undefined; dias?: number | undefined },
  user: AuthenticatedUser
) => {
  const { afectados } = await getAgendaImpact(cambio, user);
  const turno = afectados.find((t) => t.id_turno === id);
  if (
    !turno ||
    turno.estado.es_estado_final ||
    Date.parse(turno.fecha_hora_inicio) <= Date.now()
  ) {
    throw new AppError(
      'El turno cambió o ya comenzó. Actualizá los afectados.',
      409
    );
  }

  const todayStr = agendaDateTime(new Date()).date;
  const dias = Math.min(90, Math.max(1, params.dias ?? 30));

  let fechas: string[] = [];

  if (params.fecha) {
    fechas = [params.fecha];
  } else {
    // Obtenemos los días de atención configurados para el profesional en esta salita y especialidad
    const { data: horariosAtencion } = await supabase
      .from('horarios_atencion')
      .select('dia_semana, vigencia_desde, vigencia_hasta')
      .eq('id_profesional', turno.id_profesional)
      .eq('id_especialidad', turno.id_especialidad)
      .eq('id_salita', turno.id_salita)
      .eq('activo', true);

    const activeWeekdays = new Set(
      (horariosAtencion || []).map((h) => h.dia_semana)
    );

    for (let i = 0; i < dias; i++) {
      const d = new Date(Date.parse(`${todayStr}T12:00:00Z`) + i * 86400000);
      const f = d.toISOString().slice(0, 10);
      const weekday = agendaDateTime(d).weekday;

      if (activeWeekdays.size === 0 || activeWeekdays.has(weekday)) {
        fechas.push(f);
      }
    }
  }

  const opciones: SlotDisponibilidadOpcion[] = [];
  const agrupadas_por_fecha: GrupoFechaDisponibilidad[] = [];

  for (const f of fechas) {
    let disponible;
    try {
      disponible = await obtenerDisponibilidad(
        {
          fecha: f,
          id_profesional: turno.id_profesional,
          id_especialidad: turno.id_especialidad,
          id_salita: turno.id_salita,
        },
        id
      );
    } catch {
      continue;
    }

    const daySlots: SlotDisponibilidadOpcion[] = [];

    for (const slot of disponible.slots) {
      if (slot.estado !== 'DISPONIBLE') continue;

      const inicio = `${f}T${slot.hora_inicio}:00-03:00`;
      const fin = `${f}T${slot.hora_fin}:00-03:00`;

      // No permitir horarios en el pasado
      if (Date.parse(inicio) <= Date.now()) continue;

      const horario = disponible.horarios_utilizados.find(
        (h) =>
          h.hora_inicio.slice(0, 5) <= slot.hora_inicio &&
          h.hora_fin.slice(0, 5) >= slot.hora_fin
      );

      // Debe pertenecer a un horario válido y no superponerse con el cambio de agenda
      if (
        !horario ||
        !destinationAllowed(cambio, horario.id_horario, inicio, fin)
      ) {
        continue;
      }

      const slotOpt: SlotDisponibilidadOpcion = {
        id_horario: horario.id_horario,
        fecha_hora_inicio: inicio,
        fecha_hora_fin: fin,
        hora_inicio: slot.hora_inicio.slice(0, 5),
        hora_fin: slot.hora_fin.slice(0, 5),
      };

      daySlots.push(slotOpt);
      opciones.push(slotOpt);
    }

    if (daySlots.length > 0) {
      agrupadas_por_fecha.push({
        fecha: f,
        fecha_formateada: formatFechaEs(f),
        dia_semana: formatDiaSemana(f),
        slots: daySlots,
      });
    }
  }

  return {
    version: turno.version,
    dias: params.dias ?? (params.fecha ? 1 : dias),
    fecha_consultada: params.fecha,
    total_disponibles: opciones.length,
    opciones,
    agrupadas_por_fecha,
  };
};
