import { z } from "zod";

/**
 * Valores admitidos por PostgreSQL
 * para el sexo del paciente.
 */
const patientSexSchema = z.enum([
  "FEMENINO",
  "MASCULINO",
  "X",
  "NO_INFORMA"
]);

/**
 * Datos que pueden modificarse.
 * Todos son opcionales porque PATCH
 * permite actualizar solamente algunos campos.
 */
export const updatePatientSchema = z
  .object({
    id_barrio: z
      .string()
      .uuid()
      .optional(),

    id_salita_asignada: z
      .string()
      .uuid()
      .optional(),

    dni: z
      .string()
      .regex(/^[0-9]{7,15}$/)
      .optional(),

    nombres: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    apellidos: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    fecha_nacimiento: z
      .string()
      .date()
      .optional(),

    sexo: patientSexSchema.optional(),

    telefono: z
      .string()
      .trim()
      .max(30)
      .nullable()
      .optional(),

    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .nullable()
      .optional(),

    direccion: z
      .string()
      .trim()
      .min(3)
      .max(250)
      .optional(),

    localidad: z
      .string()
      .trim()
      .max(120)
      .optional(),

    provincia: z
      .string()
      .trim()
      .max(120)
      .optional(),

    codigo_postal: z
      .string()
      .trim()
      .max(12)
      .nullable()
      .optional(),

    obra_social: z
      .string()
      .trim()
      .max(150)
      .nullable()
      .optional(),

    numero_afiliado: z
      .string()
      .trim()
      .max(80)
      .nullable()
      .optional(),

    contacto_emergencia_nombre: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional(),

    contacto_emergencia_telefono: z
      .string()
      .trim()
      .max(30)
      .nullable()
      .optional()
  })
  .strict()
  .refine(
    (data) =>
      Object.keys(data).length > 0,
    {
      message:
        "Debe enviar al menos un campo para actualizar"
    }
  );

/**
 * Activar o desactivar paciente.
 */
export const patientStatusSchema = z
  .object({
    activo: z.boolean()
  })
  .strict();

export type UpdatePatientInput =
  z.infer<typeof updatePatientSchema>;

export type PatientStatusInput =
  z.infer<typeof patientStatusSchema>;