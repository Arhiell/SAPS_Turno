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
  filters: ReporteExportQuery,
) => {
  if (filters.tipo === "resumen") {
    return getReporteResumen(filters);
  }

  if (filters.tipo === "especialidades") {
    return getReporteEspecialidades(filters);
  }

  return getReporteProfesionales(filters);
};

// Genera el archivo solicitado.
export const exportReporte = async (
  filters: ReporteExportQuery,
) => {
  const data =
    await getReporteExportData(filters);

  const titulo =
    `Reporte SAPS - ${filters.tipo}`;

  if (filters.formato === "xlsx") {
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

  if (filters.formato === "docx") {
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