import { z } from "zod";

import { 
  AppError 
} from "../utils/app-error.js";

import { 
  getTurnoScope, 
  assertTurnoScope 
} from "./turno-access.service.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

import type { 
  ConfiguracionRow 
} from "../types/configuracion.types.js";

import type { 
  ConfiguracionQuery 
} from "../validators/configuracion.validator.js";

// Parámetros autorizados para administración local.
export const configuracionAdminKeys = new Set(
  [
    "agenda.intervalo_default", 
    "notificaciones.recordatorio_horas",
    "turnos.dias_anticipacion", 
    "turnos.cancelacion_horas", 
    "sanciones.duracion_dias"
  ]
);

const texto = z.string().min(1).max(250).refine(value =>
  !/-----BEGIN|\bBearer\s|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\./i.test(value));

const numero = z.number().int().nonnegative();

// Catálogo público: no se publican claves arbitrarias ni objetos con credenciales.
const publicSchemas: Record<string, z.ZodType> = {
  "sistema.nombre": texto,
  "sistema.descripcion": texto, 
  "sistema.zona_horaria": texto,
  "turnos.dias_anticipacion": numero, 
  "turnos.cancelacion_horas": numero,
  "turnos.cancelacion_minima_horas": numero, 
  "turnos.sancion_inasistencia_dias": numero,
  "sanciones.duracion_dias": numero, 
  "agenda.intervalo_default": numero,
  "notificaciones.recordatorio_horas": numero,
};

export const isSafePublic = (
  row: Pick<ConfiguracionRow, 
  "clave" | "valor" | "es_publica">
) =>
  row.es_publica && Object.hasOwn(publicSchemas, row.clave) && publicSchemas[row.clave]!.safeParse(row.valor).success;

  export const assertPublicValue = (
    row: Pick<ConfiguracionRow, 
    "clave" | "valor" | "es_publica">
  ) => {
  
    if (row.es_publica && !isSafePublic(row)) 
      throw new AppError(
    "La clave o el valor no están habilitados para exposición pública"
    , 
    400
  );
};

export const requireConfiguracionUser = (user?: AuthenticatedUser): AuthenticatedUser => {
  
  if (!user) throw new AppError("Usuario no autenticado", 401);
 
  if (!["SUPER_ADMIN", "ADMIN_SALITA", "RECEPCION", "PACIENTE", "PROFESIONAL"].includes(user.rol))
    throw new AppError("No tiene permisos para consultar configuraciones", 403);
  
  return user;
};

export const configuracionReadAccess = async (filters: ConfiguracionQuery, user?: AuthenticatedUser) => {
  const actor = requireConfiguracionUser(user);
  
  if (actor.rol === "SUPER_ADMIN") 
    return { publicOnly: false, salitas: null };
  
  if (actor.rol !== "ADMIN_SALITA") 
    return { publicOnly: true, salitas: null };
  
  const salitas = await getTurnoScope(actor);
  
  if (filters.id_salita) assertTurnoScope(salitas, filters.id_salita);
  
  return { publicOnly: false, salitas };
};


export const assertConfiguracionWrite = async (
  user: AuthenticatedUser, idSalita: string | null, clave: string
) => {
  requireConfiguracionUser(user);
 
  if (user.rol === "SUPER_ADMIN") return;
  
  if (user.rol !== "ADMIN_SALITA" || !idSalita || !configuracionAdminKeys.has(clave))
    throw new AppError("No tiene permisos para modificar esta configuración", 403);
 
  assertTurnoScope(await getTurnoScope(user), idSalita);
};

// La vista pública no expone descripciones internas ni datos de auditoría.
export const publicConfiguracion = (
  row: ConfiguracionRow
) => (
    { 
      id_configuracion: row.id_configuracion,
      id_salita: row.id_salita,
      clave: row.clave,
      valor: row.valor,
      es_publica: true,
      fecha_actualizacion: row.fecha_actualizacion 
    }
  );
