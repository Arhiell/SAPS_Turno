import type {
  GoogleLoginInput
} from "../validators/google-auth.validator.js";

import type {
  RequestMetadata
} from "../types/request-metadata.types.js";

import {
  verifyGoogleCredential
} from "./google-token.service.js";

import {
  createGoogleIdentity,
  createGoogleUser,
  findGoogleIdentity,
  findUserByGoogleEmail
} from "../repositories/google-auth.repository.js";

import {
  findRoleByCode,
  findRoleById,
  findUserById
} from "../repositories/user.repository.js";

import {
  generateUsernameFromEmail
} from "../utils/username-generator.js";

import {
  generateAccessToken
} from "./jwt.service.js";

import {
  createSession
} from "./session.service.js";

import {
  AppError
} from "../utils/app-error.js";


/**
 * Login / registro mediante Google.
 */
export const loginWithGoogle = async (
  input: GoogleLoginInput,
  metadata: RequestMetadata
) => {
  /**
   * Primero Google debe validar
   * completamente la credencial.
   */
  const googleUser =
    await verifyGoogleCredential(
      input.credential
    );

  /**
   * Buscamos por Google "sub",
   * nunca por email como identidad primaria.
   */
  const existingIdentity =
    await findGoogleIdentity(
      googleUser.googleId
    );

  let user;

  /**
   * CASO 1:
   * ya utilizó Google anteriormente.
   */
  if (existingIdentity) {
    user = await findUserById(
      existingIdentity.id_usuario
    );

    if (!user || !user.activo) {
      throw new AppError(
        "Usuario no autorizado",
        401
      );
    }
  } else {
    /**
     * CASO 2:
     * Google válido pero identidad
     * todavía no registrada.
     */
    const existingEmail =
      await findUserByGoogleEmail(
        googleUser.email
      );

    /**
     * Por seguridad no vinculamos
     * automáticamente Google con una
     * cuenta local existente.
     *
     * El linking de cuentas lo haremos
     * mediante un endpoint autenticado.
     */
    if (existingEmail) {
      throw new AppError(
        "Este correo ya está registrado. Inicie sesión con su método actual antes de vincular Google.",
        409
      );
    }

    const patientRole =
      await findRoleByCode(
        "PACIENTE"
      );

    if (!patientRole) {
      throw new AppError(
        "Rol PACIENTE no configurado",
        500
      );
    }

    const username =
      generateUsernameFromEmail(
        googleUser.email
      );

    /**
     * Creamos la cuenta local.
     */
    user = await createGoogleUser({
      idRol:
        patientRole.id_rol,

      username,

      email:
        googleUser.email
    });

    /**
     * Y posteriormente asociamos
     * el Google "sub".
     */
    await createGoogleIdentity({
      idUsuario:
        user.id_usuario,

      googleId:
        googleUser.googleId,

      email:
        googleUser.email
    });
  }

  /**
   * Determinamos el rol actual
   * desde nuestra propia base.
   */
  const role =
    await findRoleById(
      user.id_rol
    );

  if (!role || !role.activo) {
    throw new AppError(
      "Rol no autorizado",
      403
    );
  }

  const authenticatedUser = {
    id_usuario:
      user.id_usuario,

    email:
      user.email,

    nombre_usuario:
      user.nombre_usuario,

    rol:
      role.codigo
  };

  /**
   * Google solamente prueba identidad.
   *
   * A partir de acá usamos nuestros propios
   * tokens SAPS Turno.
   */
  const accessToken =
    await generateAccessToken(
      authenticatedUser
    );

  const refreshToken =
    await createSession(
      user.id_usuario,
      {
        ip:
          metadata.ip,

        userAgent:
          metadata.userAgent ??
          null
      }
    );

  return {
    user: authenticatedUser,
    accessToken,
    refreshToken
  };
};