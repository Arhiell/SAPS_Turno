import { z } from "zod";

/**
 * Datos para crear Administrador de Salita.
 */
export const createAdminSchema = z
  .object({
    nombre_usuario: z
      .string()
      .trim()
      .min(3)
      .max(60),

    email: z
      .string()
      .trim()
      .email(),

    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),

    // El administrador debe pertenecer a una salita.
    id_salita: z
      .string()
      .uuid()
  })
  .strict();

/**
 * Datos de una cuenta PACIENTE.
 */
export const createPatientAccountSchema = z
  .object({
    nombre_usuario: z
      .string()
      .trim()
      .min(3)
      .max(60),

    email: z
      .string()
      .trim()
      .email(),

    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
  })
  .strict();

/**
 * Datos de una cuenta PROFESIONAL.
 */
export const createProfessionalAccountSchema = z
  .object({
    nombre_usuario: z
      .string()
      .trim()
      .min(3)
      .max(60),

    email: z
      .string()
      .trim()
      .email(),

    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/)
  })
  .strict();

export type CreateAdminInput =
  z.infer<typeof createAdminSchema>;

export type CreatePatientAccountInput =
  z.infer<typeof createPatientAccountSchema>;

export type CreateProfessionalAccountInput =
  z.infer<typeof createProfessionalAccountSchema>;