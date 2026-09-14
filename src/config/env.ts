import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .default(3000),

  SUPABASE_URL: z
    .string()
    .url("SUPABASE_URL debe ser una URL válida"),

  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "Falta SUPABASE_PUBLISHABLE_KEY"),

  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, "Falta SUPABASE_SECRET_KEY"),

  SUPABASE_JWKS_URL: z
    .string()
    .url()
    .optional(),

  // Clave utilizada para formar nuestrar JWT.
  JWT_ACCESS_SECRET: z.string().min(12),

  //Tiempo de expiración del JWT en segundos.
  JWT_ACCESS_EXPIRES_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(10),

  //Cantidad máxima de intentos incorrectos antes de bloquear temporalmente la cuenta.
  LOGIN_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5),

  //Duración del bloqueo temporal.
  LOGIN_LOCK_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),

  // Cantidad de días que permanece
  // valida una sesión refresh.
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .default(7),

  // Minutos durante los cuales será válido un
  // token de recuperación de contraseña.
  PASSWORD_RECOVERY_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(15),

  /**
  * Horas durante las cuales será válido
  * un token de verificación de correo.
  */
  EMAIL_VERIFICATION_HOURS: z.coerce
   .number()
    .int()
    .positive()
    .default(24),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(" Error en las variables de entorno:");

  console.error(
    result.error.flatten().fieldErrors
  );

  throw new Error(
    "Configuración de variables de entorno inválida"
  );
}

export const env = result.data;