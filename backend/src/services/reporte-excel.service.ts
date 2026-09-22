import ExcelJS from "exceljs";
import { esReporteSecciones } from "../types/reporte-agenda.types.js";

// Convierte objetos en filas de Excel.
const normalizeRows = (data: unknown) => {
  if (Array.isArray(data)) {
    return data;
  }

  return [data];
};

// Genera archivo XLSX en memoria.
export const generateExcel = async (
  data: unknown,
  titulo: string,
) => {
  const workbook = new ExcelJS.Workbook();
  if (esReporteSecciones(data)) {
    // Cada profesional tiene una hoja independiente y encabezados al imprimir.
    data.secciones.forEach((section, index) => {
      const sheet = workbook.addWorksheet(`Lista ${index + 1}`, { pageSetup: {
        paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      } });
      const addHeading = (line: string) => {
        const row = sheet.addRow([line]);
        sheet.mergeCells(row.number, 1, row.number, 6);
        row.height = 24;
      };
      for (const line of section.cabecera) addHeading(line);
      sheet.addRow([]);
      const header = sheet.addRow(section.columnas);
      header.font = { bold: true };
      for (const row of section.filas) sheet.addRow(row);
      sheet.addRow([]);
      for (const line of section.pie) addHeading(line);
      [6, 10, 30, 16, 20, 40].forEach((width, i) => { sheet.getColumn(i + 1).width = width; });
      sheet.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
      sheet.pageSetup.printTitlesRow = `1:${header.number}`;
    });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
  const sheet = workbook.addWorksheet("Reporte");

  sheet.addRow([titulo]);
  sheet.addRow([]);

  const rows = normalizeRows(data);

  if (rows.length === 0) {
    sheet.addRow(["Sin datos"]);
    return Buffer.from(
      await workbook.xlsx.writeBuffer(),
    );
  }

  const first = rows[0] as Record<string, unknown>;

  // Usa las claves como encabezados.
  const headers = Object.keys(first);

  sheet.addRow(headers);

  for (const row of rows) {
    const record = row as Record<string, unknown>;

    sheet.addRow(
      headers.map((key) => {
        const value = record[key];

        // Convierte objetos a texto.
        if (
          typeof value === "object" &&
          value !== null
        ) {
          return JSON.stringify(value);
        }

        return value ?? "";
      }),
    );
  }

  // Ajusta el ancho de columnas.
  sheet.columns.forEach((column) => {
    column.width = 22;
  });

  const buffer =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
};
