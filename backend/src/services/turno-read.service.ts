import { 
  findTurnoById, 
  findTurnos, 
  findTurnoState } from "../repositories/turno-read.repository.js";

import { 
  getTurnoScope, 
  assertTurnoScope 
} from "./turno-access.service.js";

import { 
  AppError 
} from "../utils/app-error.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

import type { 
  TurnoQuery 
} from "../validators/turno-query.validator.js";

export const getTurno = async (id: string, user: AuthenticatedUser) => {
  
  const scope = await getTurnoScope(user);
 
  const turno = await findTurnoById(id);
  
  if (!turno) throw new AppError(
    "Turno no encontrado",
    404
  );

  assertTurnoScope(scope, turno.id_salita);

  return turno;
};


export const getTurnoState = async (code: string) => {
  const state = await findTurnoState(code);

  if (!state) throw new AppError(
    "El estado del turno no existe o está inactivo",
    400);

  return state;
};

// Sin asignaciones no se consultan ni se cuentan turnos de otras salitas.
export const getTurnos = async (
  filters: TurnoQuery, 
  user: AuthenticatedUser) => {
     const scope = await getTurnoScope(user);
     
     if (filters.id_salita) assertTurnoScope(scope, filters.id_salita);
     
     const state = filters.estado ? await getTurnoState(filters.estado) : null;
     
     const result = scope?.length === 0 ? { turnos: [], total: 0 }
     : await findTurnos(
      filters, 
      scope, 
      state?.id_estado
);

  return { 
    turnos: result.turnos, 
    pagination: { 
      page: filters.page, 
      limit: filters.limit,
    total: result.total, 
      totalPages: Math.ceil(result.total / filters.limit) 
    } 
  };
};
