import { duplicateMessages } from "../utils/duplicate-error.js";
import type {
  CreateAdminInput,
  CreatePatientAccountInput,
  CreateProfessionalAccountInput
} from "../validators/user.validator.js";
import type { AuthenticatedUser } from "../types/auth.types.js";
import { supabase } from "../config/supabase.js";
import { getProfesionalById } from "../repositories/profesional.repository.js";
import { getTurnoScope } from "./turno-access.service.js";
import { createVerificationCodeForNewUser } from "./email-verification.service.js";

import {
  assignUserToSalita,
  createUser,
  findActiveSalitaById,
  findRoleByCode,
  findUserByEmail,
  findUserByUsername
} from "../repositories/user.repository.js";

import {
  hashPassword
} from "./password.service.js";

import {
  AppError
} from "../utils/app-error.js";

/**
 * Verifica email y username antes de crear cuenta.
 */
const ensureUserDoesNotExist = async (
  email: string,
  username: string
) => {
  if (await findUserByEmail(email)) {
    throw new AppError(
      duplicateMessages.email,
      409
    );
  }

  if (
    await findUserByUsername(username)
  ) {
    throw new AppError(
      duplicateMessages.username,
      409
    );
  }
};

/**
 * Solo será llamado desde una ruta SUPER_ADMIN.
 */
export const createAdminAccount = async (
  input: CreateAdminInput
) => {
  const email =
    input.email.toLowerCase();

  const username =
    input.nombre_usuario.trim();

  await ensureUserDoesNotExist(
    email,
    username
  );

  // El rol se obtiene desde nuestra base.
  const role =
    await findRoleByCode("ADMIN_SALITA");

  if (!role) {
    throw new AppError(
      "Rol ADMIN_SALITA no encontrado",
      500
    );
  }

  // La salita debe existir y estar activa.
  const salita =
    await findActiveSalitaById(
      input.id_salita
    );

  if (!salita) {
    throw new AppError(
      "La salita indicada no existe o está inactiva",
      404
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  const user = await createUser({
    id_rol: role.id_rol,
    nombre_usuario: username,
    email,
    password_hash: passwordHash
  });

  /**
   * Los Admin de Salita sí requieren
   * una relación usuario_salita.
   */
  await assignUserToSalita(
    user.id_usuario,
    input.id_salita
  );

  return {
    ...user,

    rol: role.codigo,

    salita: {
      id_salita: salita.id_salita,
      nombre: salita.nombre
    }
  };
};

/**
 * Crea una cuenta PACIENTE.
 *
 * Puede ser utilizada por Super Admin
 * o Administrador de Salita.
 */
export const createPatientAccount = async (
  input: CreatePatientAccountInput
) => {
  const email =
    input.email.toLowerCase();

  const username =
    input.nombre_usuario.trim();

  await ensureUserDoesNotExist(
    email,
    username
  );

  const role =
    await findRoleByCode("PACIENTE");

  if (!role) {
    throw new AppError(
      "Rol PACIENTE no encontrado",
      500
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  const user = await createUser({
    id_rol: role.id_rol,
    nombre_usuario: username,
    email,
    password_hash: passwordHash
  });

  return {
    ...user,
    rol: role.codigo
  };
};

/**
 * Crea una cuenta PROFESIONAL.
 *
 * El usuario queda asociado al rol
 * PROFESIONAL. La relación con una
 * salita se realizará posteriormente.
 */
export const createProfessionalAccount = async (
  input: CreateProfessionalAccountInput,
  actor: AuthenticatedUser,
  ip: string | null = null
) => {
  const professional = await getProfesionalById(input.id_profesional);
  if (!professional?.activo) throw new AppError("Profesional no encontrado o inactivo", 404);
  const scope = await getTurnoScope(actor);
  if (scope !== null) {
    const { data, error } = await supabase.from("profesional_salita").select("id_profesional")
      .eq("id_profesional", input.id_profesional).in("id_salita", scope).eq("activo", true);
    if (error) throw error;
    if (!data?.length) throw new AppError("El profesional no pertenece a tus salitas", 403);
  }
  const { data: existingAccount, error: accountError } = await supabase.from("usuarios")
    .select("id_usuario").eq("id_persona", professional.id_persona).limit(1).maybeSingle();
  if (accountError) throw accountError;
  if (existingAccount) throw new AppError("La persona ya tiene una cuenta asociada", 409);
  const email =
    input.email.toLowerCase();

  const username =
    input.nombre_usuario.trim();

  await ensureUserDoesNotExist(
    email,
    username
  );

  const role =
    await findRoleByCode("PROFESIONAL");

  if (!role) {
    throw new AppError(
      "Rol PROFESIONAL no encontrado",
      500
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  const user = await createUser({
    id_persona: professional.id_persona,
    id_rol: role.id_rol,
    nombre_usuario: username,
    email,
    password_hash: passwordHash
  });

  const verificationExpiresAt = await createVerificationCodeForNewUser(
    user.id_usuario,
    email,
    ip
  );
  return {
    ...user,
    rol: role.codigo,
    verificationExpiresAt
  };
};
