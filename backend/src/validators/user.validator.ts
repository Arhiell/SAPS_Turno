import { z } from 'zod';

import { registerSchema } from './auth.validator.js';

// Valida los datos para crear una cuenta administrativa.
export const createAdminSchema = z
  .object({
    nombre_usuario: registerSchema.shape.nombre_usuario.unwrap(),

    email: registerSchema.shape.email,

    password: registerSchema.shape.password,

    // Permite únicamente los roles administrativos.
    rol: z
      .enum(['SUPER_ADMIN', 'ADMIN_SALITA'])
      .default('ADMIN_SALITA'),

    id_salita: z
      .string()
      .uuid()
      .optional(),
  })
  .strict()
  .superRefine((input, ctx) => {
    // Exige una salita para el administrador de salita.
    if (input.rol === 'ADMIN_SALITA' && !input.id_salita) {
      ctx.addIssue({
        code: 'custom',
        path: ['id_salita'],
        message: 'Seleccioná una salita.',
      });
    }

    // Impide asignar una salita al superadministrador.
    if (input.rol === 'SUPER_ADMIN' && input.id_salita !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['id_salita'],
        message: 'El superadministrador no requiere salita.',
      });
    }
  });

// Valida los datos para crear una cuenta de paciente.
export const createPatientAccountSchema = z
  .object({
    nombre_usuario: registerSchema.shape.nombre_usuario.unwrap(),

    email: registerSchema.shape.email,

    password: registerSchema.shape.password,
  })
  .strict();

// Valida los datos para crear una cuenta de profesional.
export const createProfessionalAccountSchema = z
  .object({
    id_profesional: z
      .string()
      .uuid(),

    nombre_usuario: registerSchema.shape.nombre_usuario.unwrap(),

    email: registerSchema.shape.email,

    password: registerSchema.shape.password,
  })
  .strict();

// Define los datos necesarios para crear una cuenta administrativa.
export type CreateAdminInput =
  z.infer<typeof createAdminSchema>;

// Define los datos necesarios para crear una cuenta de paciente.
export type CreatePatientAccountInput =
  z.infer<typeof createPatientAccountSchema>;

// Define los datos necesarios para crear una cuenta de profesional.
export type CreateProfessionalAccountInput =
  z.infer<typeof createProfessionalAccountSchema>;