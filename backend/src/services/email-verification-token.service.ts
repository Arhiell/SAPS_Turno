import {
  createHash,
  createHmac,
  randomBytes,
  randomInt
} from "node:crypto";
import { env } from "../config/env.js";

// Genera el token que recibirá el usuario.
export const generateEmailVerificationToken =
  (): string => {
    return randomBytes(32).toString("hex");
  };

// Solo almacenamos SHA-256 del token.
export const hashEmailVerificationToken = (
  token: string
): string => {
  return createHash("sha256")
    .update(token)
    .digest("hex");
};

// Genera un código seguro de 4 dígitos, incluidos ceros iniciales.
export const generateEmailVerificationCode = (): string =>
  String(randomInt(0, 10000)).padStart(4, "0");

export const hashEmailVerificationCode = (
  userId: string,
  code: string
): string =>
  createHmac("sha256", env.JWT_ACCESS_SECRET)
    .update(`${userId}:${code}`)
    .digest("hex");