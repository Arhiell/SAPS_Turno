import type {
  RegisterInput
} from "../validators/auth.validator.js";

import {
  createUser,
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
 * Registra una cuenta pública.
 *
 * Todo registro público recibe siempre
 * el rol PACIENTE.
 */
export const registerUser = async (
  input: RegisterInput
) => {
  // Normalizamos datos antes de utilizarlos.
  const email = input.email.trim().toLowerCase();
  const username = input.nombre_usuario.trim();

  /**
   * Comprobamos primero si el email está ocupado.
   */
  const existingEmail = await findUserByEmail(email);

  if (existingEmail) {
    throw new AppError(
      "El correo electrónico ya está registrado",
      409
    );
  }

  /**
   * Evitamos nombres de usuario duplicados.
   */
  const existingUsername =
    await findUserByUsername(username);

  if (existingUsername) {
    throw new AppError(
      "El nombre de usuario ya está registrado",
      409
    );
  }

  /**
   * El rol NO viene del frontend.
   * El backend siempre asigna PACIENTE.
   */
  const patientRole = await findRoleByCode("PACIENTE");

  if (!patientRole) {
    throw new AppError(
      "El rol PACIENTE no está configurado",
      500
    );
  }

  /**
   * La contraseña se convierte en hash antes
   * de tocar la base de datos.
   */
  const passwordHash = await hashPassword(
    input.password
  );

  /**
   * Finalmente registramos la cuenta.
   */
  const user = await createUser({
    id_rol: patientRole.id_rol,
    nombre_usuario: username,
    email,
    password_hash: passwordHash
  });

  return {
    ...user,

    rol: {
      codigo: patientRole.codigo,
      nombre: patientRole.nombre
    }
  };
};