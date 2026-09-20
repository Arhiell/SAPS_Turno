import ExcelJS from "exceljs";

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