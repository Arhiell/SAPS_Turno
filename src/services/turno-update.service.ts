import { 
  patchTurno 
} from "../repositories/turno-update.repository.js";

import { 
  getTurno, 
  getTurnoState 
} from "./turno-read.service.js";

import { 
  getTurnoScope, 
  assertTurnoScope 
} from "./turno-access.service.js";

import { 
  validateTurnoAgenda 
} from "./turno-agenda.service.js";

import { 
  AppError 
} from "../utils/app-error.js";

import type { 
  TurnoRow 
} from "../types/turno.types.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

import type { 
  UpdateTurnoInput, 
  TurnoStatusInput 
} from "../validators/turno-update.validator.js";

import {
  notifyTurnoReprogramado,
  notifyTurnoCancelado,
  notifyCambioProfesional,
} from "./notificacion-turno.service.js";

const assertEditable = (turno: TurnoRow) => {
  // Respeta el indicador real del catálogo; no se reabren estados finales.
  if (turno.estado.es_estado_final) throw new AppError(
    "El turno tiene un estado final y no admite modificaciones",
    409
  );
};

const requireUpdated = (turno: TurnoRow | null) => {
  if (!turno) throw new AppError(
    "El turno cambió; vuelva a consultar antes de modificarlo",
    409
  );

  return turno;
};

export const updateTurno = async (
  id: string, 
  input: UpdateTurnoInput, 
  user: AuthenticatedUser
) => {
  const current = await getTurno(id, user);

  assertEditable(current);

  const scheduleChanged = [
    "id_profesional", 
    "id_especialidad", 
    "id_salita", 
    "id_horario", 
    "fecha_hora_inicio"
  ]
    .some(key => key in input);

  if (!scheduleChanged) return requireUpdated(
    await patchTurno(id, current.version, input)
  );

  const candidate = { 
    id_paciente: current.id_paciente,
    id_profesional: input.id_profesional ?? current.id_profesional,
    id_especialidad: input.id_especialidad ?? current.id_especialidad,
    id_salita: input.id_salita ?? current.id_salita,
    fecha_hora_inicio: input.fecha_hora_inicio ?? current.fecha_hora_inicio,
    ...(input.id_horario ? { id_horario: input.id_horario } : {}) 
  };

  assertTurnoScope(
    await getTurnoScope(user), 
    candidate.id_salita
  );

  // Reprogramar revalida toda la agenda, excluyendo solamente este mismo turno.
  const agenda = await validateTurnoAgenda(candidate, id);

  const updated = requireUpdated(
    await patchTurno(
      id, 
      current.version, 
      { 
        ...input, 
        ...agenda 
      }
    )
  );

  // Notifica después de guardar; compara instantes para evitar avisos por formato de fecha.
  if (
    Date.parse(current.fecha_hora_inicio) !== Date.parse(updated.fecha_hora_inicio) ||
    Date.parse(current.fecha_hora_fin) !== Date.parse(updated.fecha_hora_fin)
  ) {
    await notifyTurnoReprogramado(updated.id_turno);
  }

  if (current.id_profesional !== updated.id_profesional) {
    await notifyCambioProfesional(updated.id_turno);
  }

  return updated;
};

export const changeTurnoStatus = async (
  id: string, 
  input: TurnoStatusInput, 
  user: AuthenticatedUser
) => {
  const current = await getTurno(id, user);

  assertEditable(current);

  const state = await getTurnoState(input.estado);

  if (state.id_estado === current.id_estado) throw new AppError(
    "El turno ya tiene ese estado",
    409
  );

  if (state.ocupa_agenda) {
    // Confirmar o registrar llegada no reprograma un turno que ya comenzó.
    const agenda = await validateTurnoAgenda(
      { id_paciente: current.id_paciente,
        id_profesional: current.id_profesional,
        id_especialidad: current.id_especialidad,
        id_salita: current.id_salita, 
        fecha_hora_inicio: current.fecha_hora_inicio,
        ...(current.id_horario ? { 
          id_horario: current.id_horario 
        } : {}) 
      }, 
      id, 
      current.ocupa_agenda
    );

    if (Date.parse(
      agenda.fecha_hora_fin
    ) !== Date.parse(current.fecha_hora_fin)) {
      throw new AppError(
        "La duración del horario cambió; debe reprogramar el turno",
        409
      );
    }
  }

  // Cancelación lógica: mantiene fecha, paciente, profesional e historial del trigger.
  const updated = requireUpdated(
    await patchTurno(
      id, 
      current.version, 
      {
        id_estado: state.id_estado,
        ...(state.codigo === "CANCELADO" ? { 
          motivo_cancelacion: input.motivo_cancelacion ?? null,
          cancelado_por: user.id_usuario,
          fecha_cancelacion: new Date().toISOString() 
        } : {}
      )
  }));

  // El código del catálogo identifica la cancelación; los UUID cambian entre bases.
  if (current.estado.codigo !== "CANCELADO" && state.codigo === "CANCELADO") {
    await notifyTurnoCancelado(updated.id_turno);
  }

  return updated;
};
