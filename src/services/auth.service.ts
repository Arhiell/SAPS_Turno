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

import type {
  LoginInput
} from "../validators/auth.validator.js";

import {
  findRoleById,
  findUserForLogin,
  registerSuccessfulLogin
} from "../repositories/user.repository.js";

import {
  verifyPassword
} from "./password.service.js";

import {
  generateAccessToken
} from "./jwt.service.js";

// Registra una cuenta pública. Todo registro público recibe siempre
//el rol PACIENTE.
export const registerUser = async (
  input: RegisterInput
) => {
  // Normalizamos datos antes de utilizarlos.
  const email = input.email.trim().toLowerCase();
  const username = input.nombre_usuario.trim();

  // Comprobamos primero si el email está ocupado.
  const existingEmail = await findUserByEmail(email);

  if (existingEmail) {
    throw new AppError(
      "El correo electrónico ya está registrado",
      409
    );
  }

  //Evitamos nombres de usuario duplicados.
  const existingUsername =
    await findUserByUsername(username);

  if (existingUsername) {
    throw new AppError(
      "El nombre de usuario ya está registrado",
      409
    );
  }

  // El rol NO viene del frontend. El backend siempre asigna PACIENTE.
   const patientRole = await findRoleByCode("PACIENTE");

  if (!patientRole) {
    throw new AppError(
      "El rol PACIENTE no está configurado",
      500
    );
  }

  //La contraseña se convierte en hash antes de tocar la base de datos.
  const passwordHash = await hashPassword(
    input.password
  );

  // Finalmente registramos la cuenta.
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


/**
 * Inicia sesión y genera un Access Token.
 */
export const loginUser = async (
  input: LoginInput
) => {
  const identifier =
    input.identifier.trim().toLowerCase();

  // Buscamos email o username.
  const user =
    await findUserForLogin(identifier);

  if (!user) {
    throw new AppError(
      "Credenciales incorrectas",
      401
    );
  }

  if (!user.activo) {
    throw new AppError(
      "La cuenta se encuentra deshabilitada",
      403
    );
  }

  /**
   * Si existe un bloqueo vigente,
   * rechazamos el inicio.
   */
  if (
    user.bloqueado_hasta &&
    new Date(user.bloqueado_hasta) > new Date()
  ) {
    throw new AppError(
      "La cuenta se encuentra temporalmente bloqueada",
      423
    );
  }

  const passwordIsValid =
    await verifyPassword(
      user.password_hash,
      input.password
    );

  if (!passwordIsValid) {
    throw new AppError(
      "Credenciales incorrectas",
      401
    );
  }

  const role = await findRoleById(
    user.id_rol
  );

  if (!role || !role.activo) {
    throw new AppError(
      "El usuario no posee un rol válido",
      403
    );
  }

  // Registramos el acceso exitoso.
  await registerSuccessfulLogin(
    user.id_usuario
  );

  const authenticatedUser = {
    id_usuario: user.id_usuario,
    email: user.email,
    nombre_usuario: user.nombre_usuario,
    rol: role.codigo
  };

  const accessToken =
    await generateAccessToken(
      authenticatedUser
    );

  return {
    user: authenticatedUser,
    accessToken
  };
};