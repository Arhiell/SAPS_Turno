import PDFDocument from "pdfkit";

import { 
  esReporteSecciones 
} from "../types/reporte-agenda.types.js";

import { 
  drawReporteSections 
} from "./reporte-pdf-tabla.js";

// Convierte valores complejos a texto.
const textValue = (value: unknown) => {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
};

// Genera el PDF en memoria.
export const generatePdf = (
  data: unknown,
  titulo: string,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      ...(esReporteSecciones(data) ? { size: "A4" } : {}),
    });

    const chunks: Buffer[] = [];
    doc.on("error", reject);

    // Guarda cada fragmento generado.
    doc.on("data", (chunk) => {
      chunks.push(chunk);
    });

    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    if (esReporteSecciones(data)) {
      drawReporteSections(doc, data);
      doc.end();
      return;
    }

    doc
      .fontSize(18)
      .text(titulo);

    doc.moveDown();

    doc
      .fontSize(10)
      .text(
        `Generado: ${new Date().toLocaleString("es-AR")}`,
      );

    doc.moveDown();

    const rows = Array.isArray(data)
      ? data
      : [data];

    for (const row of rows) {
      const record =
        row as Record<string, unknown>;

      // Imprime cada propiedad.
      for (const [key, value] of Object.entries(
        record,
      )) {
        doc
          .fontSize(10)
          .text(
            `${key}: ${textValue(value)}`,
          );
      }

      doc.moveDown();
    }

    doc.end();
  });
};
