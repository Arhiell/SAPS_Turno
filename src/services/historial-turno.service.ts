import {
    AppError
} from "../utils/app-error.js";

import {
  findTurnoForHistorial,
  findHistorialByTurno,
  findHistorialGeneral
} from "../repositories/historial-turno.repository.js";

import type {
  HistorialTurnoQuery,
} from "../validators/historial-turno.validator.js";
import type { AuthenticatedUser } from "../types/auth.types.js";
import { getTurnoScope, assertTurnoScope } from "./turno-access.service.js";

// Consulta el historial solamente si el turno existe.
export const getHistorialByTurno = async (
  idTurno: string,
  user: AuthenticatedUser,
) => {
  const scope = await getTurnoScope(user);
  const turnoExiste = await findTurnoForHistorial(idTurno);

  if (!turnoExiste) {
    throw new AppError(
      "El turno solicitado no existe",
      404,
    );
  }

  assertTurnoScope(scope, turnoExiste.id_salita);

  return findHistorialByTurno(idTurno);
};

// Consulta el historial administrativo con filtros.
export const getHistorialGeneral = async (
  filters: HistorialTurnoQuery,
  user: AuthenticatedUser,
) => {
  const scope = await getTurnoScope(user);
  if (scope?.length === 0) return { data: [], total: 0 };
  return findHistorialGeneral(filters, scope);
};
