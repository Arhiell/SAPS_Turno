import { 
  getHorarioById, 
  findHorariosParaTurno 
} from "../repositories/horario-atencion.repository.js";

import { 
  findBloqueoParaTurno 
} from "../repositories/bloqueo-agenda.repository.js";

import { 
  findTurnoOverlap, 
  findOpenTurno,
  countTurnosDelHorario, 
  findTurnoSanction 
} from "../repositories/turno-agenda.repository.js";

import { 
  validateTurnoEntities 
} from "./turno-entities.service.js";

import { 
  agendaDateTime 
} from "../utils/turno-time.js";

import { 
  timeToSeconds 
} from "../utils/time.js";

import { 
  AppError 
} from "../utils/app-error.js";

import type { 
  CreateTurnoInput 
} from "../validators/turno.validator.js";

type Horario = NonNullable<Awaited<ReturnType<typeof getHorarioById>>>;
const fits = (horario: Horario, input: CreateTurnoInput) => {
  const start = agendaDateTime(input.fecha_hora_inicio);

  const endInstant = new Date(Date.parse(input.fecha_hora_inicio) + horario.duracion_turno_minutos * 60000);
  
  const end = agendaDateTime(endInstant);
  
  const seconds = timeToSeconds(start.time);
 
  const offset = seconds - timeToSeconds(horario.hora_inicio);
  
  return horario.activo && horario.id_profesional === input.id_profesional &&
    horario.id_salita === input.id_salita && horario.id_especialidad === input.id_especialidad &&
    horario.dia_semana === start.weekday && start.date >= horario.vigencia_desde &&
    (!horario.vigencia_hasta || start.date <= horario.vigencia_hasta) &&
    end.date === start.date && offset >= 0 &&
    timeToSeconds(end.time) <= timeToSeconds(horario.hora_fin) &&
    offset % (horario.duracion_turno_minutos * 60) === 0;
};

// Validación reutilizable de reserva, sin implementar otro CRUD de disponibilidad.
export const validateTurnoAgenda = async (
  input: CreateTurnoInput, exclude?: string, allowPast = false, enforceClinicSpecialty = true
) => {
  const start = new Date(input.fecha_hora_inicio);

  if (!allowPast && start.getTime() <= Date.now()) {
    throw new AppError(
      "La fecha y hora del turno no pueden estar en el pasado", 400
    );
  }

  const local = agendaDateTime(start);

  await validateTurnoEntities(input, local.date, enforceClinicSpecialty);

  const candidates = input.id_horario
    ? [await getHorarioById(input.id_horario)]
    : await findHorariosParaTurno(
      input.id_profesional, 
      input.id_especialidad,
      input.id_salita, 
      local.weekday, 
      local.date
    );

  const horario = candidates.find(
    (row): row is Horario => row !== null && fits(row, input)
  );

  if (!horario) throw new AppError(
    "El profesional no atiende en el horario solicitado o fuera de su vigencia",
     400
    );

  // La finalización proviene del horario, nunca de una duración enviada por el cliente.
  const end = new Date(start.getTime() + horario.duracion_turno_minutos * 60000);
  
  const inicio = start.toISOString();
  
  const fin = end.toISOString();
  
  if (await findBloqueoParaTurno(input.id_profesional, input.id_especialidad, input.id_salita,
    local.date, local.time, agendaDateTime(end).time)) {
    throw new AppError(
      "El horario solicitado se encuentra bloqueado", 
      409
    );
  }
  
  if (await findTurnoOverlap("id_profesional", input.id_profesional, inicio, fin, exclude)) {
    throw new AppError(
      "El profesional ya posee un turno asignado en ese horario", 
      409
    );
  }

  if (await findTurnoOverlap(
    "id_paciente", 
    input.id_paciente, 
    inicio, fin, exclude
  )) {
    throw new AppError(
      "El paciente ya posee un turno en ese horario",
       409
      );
  }

  if (await findOpenTurno(
    input.id_paciente, 
    input.id_especialidad, 
    exclude)
  ) {
    throw new AppError(
      "El paciente ya posee un turno abierto para esa especialidad",
       409
    );
  }


  if (await findTurnoSanction(
    input.id_paciente, 
    input.id_especialidad, 
    inicio
  )) {
    throw new AppError(
      "El paciente posee una restricción vigente para esta especialidad",
      409
    );
  }

  if (horario.cupo_maximo_diario !== null &&
    await countTurnosDelHorario(
      horario.id_horario, 
      local.date, 
      exclude) >= horario.cupo_maximo_diario) {
    throw new AppError(
      "Se alcanzó el cupo máximo diario del horario",
      409
    );
  }

  return { 
    id_horario: horario.id_horario, 
    fecha_hora_inicio: inicio, 
    fecha_hora_fin: fin 
  };
};
