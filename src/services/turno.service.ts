import { 
  randomUUID 
} from "node:crypto";

import { 
  insertTurno 
} from "../repositories/turno.repository.js";

import { 
  validateTurnoAgenda 
} from "./turno-agenda.service.js";

import { 
  getTurnoScope, 
  assertTurnoScope 
} from "./turno-access.service.js";

import { 
  getTurnoState 
} from "./turno-read.service.js";

import { 
  AppError 
} from "../utils/app-error.js";

import type { 
  CreateTurnoInput 
} from "../validators/turno.validator.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

export const createTurno = async (
  input: CreateTurnoInput, 
  user: AuthenticatedUser
) => {
  assertTurnoScope(await getTurnoScope(user), input.id_salita);

  const state = await getTurnoState("SOLICITADO");

  if (!state.ocupa_agenda || state.es_estado_final) {
    throw new AppError(
      "El estado SOLICITADO no está configurado para reservar agenda", 
      400
    );
  }

  const agenda = await validateTurnoAgenda(input);
  // Código público sin datos personales, dentro del VARCHAR(30) del SQL.
  return insertTurno(
    { 
      ...input, 
      ...agenda, 
      id_estado: state.id_estado,
      codigo_turno: `T-${randomUUID().replaceAll("-", "").slice(0, 28)}`, 
      creado_por: user.id_usuario 
    }
  );
};
