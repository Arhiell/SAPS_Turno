import { z } from "zod";

export const createPatientTutorSchema = z.object({
  id_tutor: z.string().uuid(),
  parentesco: z.string().trim().min(1).max(50),
  es_principal: z.boolean().optional(),
  puede_gestionar_turnos: z.boolean().optional(),
  fecha_desde: z.string().date().optional(),
  fecha_hasta: z.string().date().nullable().optional()
}).strict();

export const updatePatientTutorSchema = z.object({
  parentesco: z.string().trim().min(1).max(50).optional(),
  es_principal: z.boolean().optional(),
  puede_gestionar_turnos: z.boolean().optional(),
  fecha_desde: z.string().date().optional(),
  fecha_hasta: z.string().date().nullable().optional()
})
.strict()
.refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: "Debe enviar al menos un campo para actualizar"
  }
);

export const patientTutorParamsSchema = z.object({
  patientId: z.string().uuid(),
  tutorId: z.string().uuid()
}).strict();

export const patientIdParamSchema = z.object({
  patientId: z.string().uuid()
}).strict();

export const tutorIdParamSchema = z.object({
  tutorId: z.string().uuid()
}).strict();

export type CreatePatientTutorInput =
  z.infer<typeof createPatientTutorSchema>;

export type UpdatePatientTutorInput =
  z.infer<typeof updatePatientTutorSchema>;