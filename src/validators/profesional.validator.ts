import { z } from "zod";

import {
  createPersonSchema,
  updatePersonSchema
} from "./person.validator.js";

export const createProfesionalSchema = createPersonSchema.extend({
  matricula: z.string().trim().min(1).max(50)
}).strict();

export const updateProfesionalSchema = updatePersonSchema.extend({
  matricula: z.string().trim().min(1).max(50).optional(),
  activo: z.boolean().optional(),
  fecha_alta: z.string().date().optional(),
  fecha_baja: z.string().date().nullable().optional()
}).strict();

export type CreateProfesionalInput =
  z.infer<typeof createProfesionalSchema>;

export type UpdateProfesionalInput =
  z.infer<typeof updateProfesionalSchema>;