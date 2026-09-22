import type {
  CreateAdminInput,
  CreatePatientAccountInput,
  CreateProfessionalAccountInput
} from "../validators/user.validator.js";

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
      "El email ya está registrado",
      409
    );
  }

  if (
    await findUserByUsername(username)
  ) {
    throw new AppError(
      "El nombre de usuario ya está registrado",
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
  input: CreateProfessionalAccountInput
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