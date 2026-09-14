import { env } from "../config/env.js"; 

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
  clearExpiredLoginLock,
  findRoleById,
  findUserForLogin,
  registerFailedLogin,
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
 * Inicia sesión mediante email o username.
 *
 * También controla:
 * - usuario activo
 * - bloqueo temporal
 * - intentos fallidos
 * - contraseña
 * - rol activo
 * - último acceso
 */
export const loginUser = async (
  input: LoginInput
) => {
  const identifier =
    input.identifier.trim().toLowerCase();

  /**
   * Buscamos al usuario por email
   * o nombre de usuario.
   */
  const user = await findUserForLogin(
    identifier
  );

  /**
   * Utilizamos un mensaje genérico.
   *
   * No queremos revelar si determinado
   * correo existe en el sistema.
   */
  if (!user) {
    throw new AppError(
      "Credenciales incorrectas",
      401
    );
  }

  /**
   * Una cuenta desactivada no puede ingresar.
   */
  if (!user.activo) {
    throw new AppError(
      "La cuenta se encuentra deshabilitada",
      403
    );
  }

  const now = new Date();

  /**
   * Si existe un bloqueo que todavía
   * está vigente, rechazamos el login.
   */
  if (
    user.bloqueado_hasta &&
    new Date(user.bloqueado_hasta) > now
  ) {
    throw new AppError(
      "La cuenta se encuentra temporalmente bloqueada",
      423
    );
  }

  /**
   * Si existía un bloqueo pero ya venció,
   * reiniciamos los intentos.
   */
  let failedAttempts =
    user.intentos_fallidos ?? 0;

  if (
    user.bloqueado_hasta &&
    new Date(user.bloqueado_hasta) <= now
  ) {
    await clearExpiredLoginLock(
      user.id_usuario
    );

    failedAttempts = 0;
  }

  /**
   * Comparamos la contraseña recibida
   * contra el hash Argon2 almacenado.
   */
  const passwordIsValid =
    await verifyPassword(
      user.password_hash,
      input.password
    );

  if (!passwordIsValid) {
    const newAttempts =
      failedAttempts + 1;

    /**
     * Si alcanzó el máximo permitido,
     * calculamos la fecha del bloqueo.
     */
    if (
      newAttempts >=
      env.LOGIN_MAX_ATTEMPTS
    ) {
      const blockedUntil = new Date(
        now.getTime() +
          env.LOGIN_LOCK_MINUTES *
            60 *
            1000
      );

      await registerFailedLogin(
        user.id_usuario,
        newAttempts,
        blockedUntil.toISOString()
      );

      throw new AppError(
        "Demasiados intentos fallidos. La cuenta fue bloqueada temporalmente",
        423
      );
    }

    /**
     * Todavía no alcanzó el límite,
     * solamente incrementamos el contador.
     */
    await registerFailedLogin(
      user.id_usuario,
      newAttempts,
      null
    );

    throw new AppError(
      "Credenciales incorrectas",
      401
    );
  }

  /**
   * La contraseña es correcta.
   *
   * Ahora comprobamos que el rol
   * continúe existiendo y esté activo.
   */
  const role = await findRoleById(
    user.id_rol
  );

  if (!role || !role.activo) {
    throw new AppError(
      "El usuario no posee un rol válido",
      403
    );
  }

  /**
   * Login exitoso:
   * - intentos = 0
   * - bloqueo = NULL
   * - ultimo_acceso = ahora
   */
  await registerSuccessfulLogin(
    user.id_usuario
  );

  const authenticatedUser = {
    id_usuario: user.id_usuario,
    email: user.email,
    nombre_usuario:
      user.nombre_usuario,
    rol: role.codigo
  };

  /**
   * Finalmente generamos el JWT.
   */
  const accessToken =
    await generateAccessToken(
      authenticatedUser
    );

  return {
    user: authenticatedUser,
    accessToken
  };
};