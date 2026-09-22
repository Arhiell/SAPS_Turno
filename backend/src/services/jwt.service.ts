import {
  SignJWT,
  jwtVerify
} from "jose";

import { env } from "../config/env.js";

import type {
  AuthenticatedUser
} from "../types/auth.types.js";

/**
 * Convierte la clave del .env a bytes.
 */
const secret = new TextEncoder().encode(
  env.JWT_ACCESS_SECRET
);

/**
 * Genera el Access Token.
 */
export const generateAccessToken = async (
  user: AuthenticatedUser
): Promise<string> => {
  return new SignJWT({
    email: user.email,
    username: user.nombre_usuario,
    role: user.rol
  })
    .setProtectedHeader({
      alg: "HS256"
    })
    .setSubject(user.id_usuario)
    .setIssuedAt()
    .setExpirationTime(
      `${env.JWT_ACCESS_EXPIRES_MINUTES}m`
    )
    .sign(secret);
};

/**
 * Verifica firma y vencimiento del JWT.
 */
export const verifyAccessToken = async (
  token: string
) => {
  const { payload } = await jwtVerify(
    token,
    secret
  );

  return payload;
};