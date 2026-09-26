import {
  getReporteResumen,
  getReporteEspecialidades,
} from "./reporte.service.js";

import {
  getReporteProfesionales,
} from "./reporte-profesional.service.js";

import type {
  ReporteExportQuery,
} from "../validators/reporte.validator.js";

import { generateExcel } from
  "./reporte-excel.service.js";

import { generateWord } from
  "./reporte-word.service.js";

import { generatePdf } from
  "./reporte-pdf.service.js";


// Obtiene los datos según el reporte pedido.
export const getReporteExportData = async (
  filters: ReporteExportQuery, scope: string[] | null = null,
) => {
  if (filters.tipo === "resumen") {
    return getReporteResumen(filters, scope);
  }

  if (filters.tipo === "especialidades") {
    return getReporteEspecialidades(filters, scope);
  }

  return getReporteProfesionales(filters, scope);
};

// Genera el archivo solicitado.
export const exportReporte = async (
  filters: ReporteExportQuery, scope: string[] | null = null,
) => {
  const data =
    await getReporteExportData(filters, scope);

  return generateReporteFile(
    data, 
    `Reporte SAPS - ${filters.tipo}`,
     filters.formato
    );
};

// Un solo punto de selección de formato para reportes estadísticos y agenda diaria.
export const generateReporteFile = async (
  data: unknown, 
  titulo: string,
   formato: "pdf" | "xlsx" | "docx") => {

  if (formato === "xlsx") {
    return {
      buffer: await generateExcel(
        data,
        titulo,
      ),
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
    };
  }

  if (formato === "docx") {
    return {
      buffer: await generateWord(
        data,
        titulo,
      ),
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
    };
  }

  return {
    buffer: await generatePdf(
      data,
      titulo,
    ),
    contentType: "application/pdf",
    extension: "pdf",
  };
};
