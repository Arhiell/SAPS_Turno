import {
  createHash,
  randomBytes
} from "node:crypto";

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