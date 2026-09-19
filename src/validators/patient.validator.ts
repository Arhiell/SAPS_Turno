import { z } from "zod";

/**
 * Valores permitidos por la restricción
 * ck_paciente_sexo de PostgreSQL.
 */
const patientSexSchema = z.enum([
  "FEMENINO",
  "MASCULINO",
  // Debemos verificar esta parte
  // en donde género y sex no es lo mismo
  "X",
  "NO_INFORMA"
]);

/**
 * Valida los datos necesarios
 * para registrar un paciente.
 */
export const createPatientSchema = z
  .object({
    id_usuario: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    id_barrio: z
      .string()
      .uuid("id_barrio no es válido"),

    id_salita_asignada: z
      .string()
      .uuid("id_salita_asignada no es válido"),

    dni: z
      .string()
      .regex(
        /^[0-9]{7,15}$/,
        "El DNI debe contener entre 7 y 15 números"
      ),

    nombres: z
      .string()
      .trim()
      .min(2)
      .max(100),

    apellidos: z
      .string()
      .trim()
      .min(2)
      .max(100),

    fecha_nacimiento: z
      .string()
      .date(),

    sexo: patientSexSchema,

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
      .max(250),

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
  .strict();

export type CreatePatientInput =
  z.infer<typeof createPatientSchema>;