import { z } from 'zod';

const uuidSchema = z.string().uuid('Debe ser un UUID válido');

export const crearJustificacionSchema = z.object({
  id_turno: uuidSchema,
  motivo: z
    .string()
    .trim()
    .min(5, 'El motivo de la justificación debe tener al menos 5 caracteres')
    .max(2000, 'El motivo es demasiado largo (máximo 2000 caracteres)'),
  documentacion_ref: z
    .string()
    .trim()
    .max(500, 'La referencia documental es demasiado larga')
    .optional(),
});

export const evaluarJustificacionSchema = z.object({
  estado: z.enum(['APROBADA', 'RECHAZADA']),
  motivo_resolucion: z
    .string()
    .trim()
    .min(3, 'Debe indicar el motivo o resolución de la evaluación')
    .max(2000, 'El motivo de resolución es demasiado largo')
    .optional(),
});

export const rectificarInasistenciaSchema = z.object({
  nuevo_estado: z.literal('ATENDIDO'),
  motivo_rectificacion: z
    .string()
    .trim()
    .min(5, 'El motivo de rectificación debe tener al menos 5 caracteres')
    .max(2000, 'El motivo de rectificación es demasiado largo'),
});

export const justificacionesQuerySchema = z.object({
  id_paciente: uuidSchema.optional(),
  estado: z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CrearJustificacionInput = z.infer<typeof crearJustificacionSchema>;
export type EvaluarJustificacionInput = z.infer<typeof evaluarJustificacionSchema>;
export type RectificarInasistenciaInput = z.infer<typeof rectificarInasistenciaSchema>;
export type JustificacionesQuery = z.infer<typeof justificacionesQuerySchema>;
