import { z } from "zod";

import { 
  turnoQuerySchema
 } from "./turno-query.validator.js";

import { 
  agendaDateTime 
} from "../utils/turno-time.js";

// Filtros comunes para los reportes.
export const reporteQuerySchema = z.object({
  fecha_desde: z
    .string()
    .date("fecha_desde debe tener formato YYYY-MM-DD"),

  fecha_hasta: z
    .string()
    .date("fecha_hasta debe tener formato YYYY-MM-DD"),

  id_salita: z
    .string()
    .uuid("id_salita debe ser un UUID válido")
    .optional(),
}).refine(
  (data) =>
    new Date(data.fecha_desde) <=
    new Date(data.fecha_hasta),
  {
    message: "fecha_desde no puede superar fecha_hasta",
    path: ["fecha_hasta"],
  },
);

// Formatos permitidos.
export const reporteFormatoSchema = z.enum([
  "pdf",
  "xlsx",
  "docx",
]);

// Tipos de reporte exportables.
export const reporteTipoSchema = z.enum([
  "resumen",
  "especialidades",
  "profesionales",
]);

// Valida la exportación.
export const reporteExportQuerySchema =
  reporteQuerySchema.and(
    z.object({
      formato: reporteFormatoSchema,
      tipo: reporteTipoSchema,
    }),
  );

export type ReporteExportQuery =
  z.infer<typeof reporteExportQuerySchema>;
  
export type ReporteQuery =
  z.infer<typeof reporteQuerySchema>;

// Hoy y mañana se resuelven según el día municipal, no la zona del servidor.
const fechaAgenda = z.union([z.iso.date(), z.enum(["hoy", "manana", "mañana"])]).default("hoy")
  .transform(value => {
    if (value === "hoy") return agendaDateTime(new Date()).date;
    if (value === "manana" || value === "mañana") {
      const today = agendaDateTime(new Date()).date;
      return new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
    }
    return value;
  });

export const reporteAgendaQuerySchema = turnoQuerySchema
  .pick({ id_salita: true, id_profesional: true, estado: true })
  .extend({ fecha: fechaAgenda, id_especialidad: z.string().uuid().optional() });

  export const reporteAgendaExportSchema = reporteAgendaQuerySchema.extend({ formato: reporteFormatoSchema });

  export type ReporteAgendaQuery = z.infer<typeof reporteAgendaQuerySchema>;
