import { 
  AppError 
} from "../utils/app-error.js";
import { z } from "zod";
import { supabase } from "../config/supabase.js";

// Catálogo por SAPS independiente de profesionales y horarios, en la
// configuración local existente. Solo SUPER_ADMIN administra esta clave.
const validateClinicSpecialties = async (
  clave: string, valor: unknown, idSalita: string | null
) => {
  if (clave !== "salita.especialidades") return;
  const parsed = z.array(z.string().uuid()).max(500).safeParse(valor);
  if (!idSalita || !parsed.success || new Set(parsed.data).size !== parsed.data.length) {
    throw new AppError("Seleccioná una SAPS y especialidades válidas sin duplicados", 400);
  }
  if (!parsed.data.length) return;
  const { data, error } = await supabase.from("especialidades")
    .select("id_especialidad").in("id_especialidad", parsed.data);
  if (error) throw error;
  if (data?.length !== parsed.data.length) {
    throw new AppError("Una de las especialidades seleccionadas no existe", 400);
  }
};

import { 
  getSalita 
} from "./salita.service.js";

import { 
  findConfiguraciones, 
  findConfiguracionById, 
  findConfiguracionByClave,
  createConfiguracion, 
  updateConfiguracion 
} from "../repositories/configuracion.repository.js";

import { 
  configuracionReadAccess, 
  assertConfiguracionWrite, 
  requireConfiguracionUser,
  isSafePublic, 
  assertPublicValue, 
  publicConfiguracion 
} from "./configuracion-policy.js";

import { 
  configuracionClaveSchema 
} from "../validators/configuracion.validator.js";

import type { 
  ConfiguracionQuery, 
  CreateConfiguracionInput, 
  UpdateConfiguracionInput, 
  ConfiguracionValor 
} from "../validators/configuracion.validator.js";

import type { 
  AuthenticatedUser 
} from "../types/auth.types.js";

export const getConfiguraciones = async (
  filters: ConfiguracionQuery, 
  user?: AuthenticatedUser, 
  clave?: string
) => {
  const access = await configuracionReadAccess(filters, user);

  const rows = await findConfiguraciones(filters, access, clave);

  return rows.flatMap(row => {
    const publicView = access.publicOnly || (user?.rol === "ADMIN_SALITA" && row.id_salita === null);
    
    return publicView ? (isSafePublic(row) ? [publicConfiguracion(row)] : []) : [row];
  });
};

export const getConfiguracionesPublicas = async (filters: ConfiguracionQuery) => {
  const rows = await findConfiguraciones(
    filters, { 
      publicOnly: true,
      salitas: null 
    }
  );
  return rows.filter(isSafePublic).map(publicConfiguracion);
};

export const getConfiguracion = async (
  clave: string, 
  filters: ConfiguracionQuery, 
  user: AuthenticatedUser
) => {
  // Sin salita, una clave identifica exclusivamente su configuración global.
  const rows = await getConfiguraciones(
    filters.id_salita ? filters : {
       scope: "global" 
      }, user, clave
    );

  if (!rows[0]) throw new AppError(
    "La configuración no existe"
    , 
    404
  );

  return rows[0];
};

const writeError = (error: unknown): never => {
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "23505") throw new AppError(
      "Ya existe una configuración con esa clave",
      409
    );

    if (error.code === "23503") throw new AppError(
      "La salita o el usuario no existe",
      404
    );
  }
  throw error;
};

export const registerConfiguracion = async (
  input: CreateConfiguracionInput,
  user: AuthenticatedUser
) => {
  requireConfiguracionUser(user);
  
  const idSalita = input.id_salita ?? null;
  
  await assertConfiguracionWrite(user, idSalita, input.clave);
  await validateClinicSpecialties(input.clave, input.valor, idSalita);
  
  if (user.rol === "ADMIN_SALITA" && input.es_publica) 
    throw new AppError("Solo SUPER_ADMIN puede publicar configuraciones", 403);
  
  assertPublicValue(input);
  
  if (idSalita && !await getSalita(idSalita)) throw new AppError("La salita no existe", 404);
  
  // Evita duplicados; la restricción SQL también cubre creaciones concurrentes.
  if (await findConfiguracionByClave(input.clave, idSalita)) throw new AppError(
    "Ya existe una configuración con esa clave",
    409
  );

  try { 
    return await createConfiguracion(
      input,
      user.id_usuario
    ); 
  }
  catch (error) { 
    return writeError(error); 
  }
};

export const editConfiguracion = async (
  id: string, 
  input: UpdateConfiguracionInput,
  user: AuthenticatedUser
) => {
  requireConfiguracionUser(user);
  
  if (![
    "SUPER_ADMIN", 
    "ADMIN_SALITA"
  ].includes(user.rol)) throw new AppError(
    "No tiene permisos para modificar configuraciones",
    403
  );

  const current = await findConfiguracionById(id);

  if (!current) throw new AppError(
    "La configuración no existe",
    404
  );

  await assertConfiguracionWrite(
    user,
    current.id_salita,
    current.clave
  );

  if (user.rol === "ADMIN_SALITA" && input.es_publica !== undefined) throw new AppError(
    "Solo SUPER_ADMIN puede cambiar la visibilidad",
    403
  );

  assertPublicValue(
    { 
    clave: current.clave, 
    valor: input.valor ?? current.valor, 
    es_publica: input.es_publica ?? current.es_publica 
  });
  await validateClinicSpecialties(current.clave, input.valor ?? current.valor, current.id_salita);
  try {
    const updated = await updateConfiguracion(current, input, user.id_usuario);
    if (!updated) throw new AppError("La configuración no existe", 404);
    return updated;
  } catch (error) { return writeError(error); }
};

// Uso interno del backend; no se expone como resolución sin permisos por HTTP.
export const getConfiguracionValue = async (
  clave: string, idSalita?: string | null, 
  defaultValue?: ConfiguracionValor
) => {
  configuracionClaveSchema.parse(clave);

  if (idSalita) {
    const local = await findConfiguracionByClave(clave, idSalita);
    if (local) return local.valor;
  }

  const global = await findConfiguracionByClave(clave);
  
  return global ? global.valor : defaultValue;
};
