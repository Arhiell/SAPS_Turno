import { z } from "zod";

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