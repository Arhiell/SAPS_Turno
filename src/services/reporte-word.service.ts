import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";

import {
   esReporteSecciones 
  } from "../types/reporte-agenda.types.js";

// Convierte valores a texto.
const textValue = (value: unknown) => {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return JSON.stringify(value);
  }

  return String(value ?? "");
};

// Genera documento Word.
export const generateWord = async (
  data: unknown,
  titulo: string,
) => {
  if (esReporteSecciones(data)) {

    const document = new Document({ 
      sections: data.secciones.map(section => ({
        
      // A4 en unidades twip; cada lista comienza en una sección nueva.
      properties: { page: { size: { width: 11906, height: 16838 },
        margin: { top: 850, bottom: 850, left: 850, right: 850 } } },
      children: [
        ...section.cabecera.map((text, i) => new Paragraph({ keepNext: true,
          children: [new TextRun({ text, bold: i < 2, size: i === 0 ? 30 : 22 })] })),
        ...(section.columnas.length ? [new Table({
          width: { size: 100, type: "pct" },
          rows: [section.columnas, ...section.filas].map((row, index) => new TableRow({
            tableHeader: index === 0, cantSplit: true,
            children: row.map(text => new TableCell({ children: [new Paragraph({
              children: [new TextRun({ text, size: 20, bold: index === 0 })],
            })] })),
          })),
        })] : []),
        ...section.pie.map(text => new Paragraph({ text, spacing: { before: 200 } })),
      ],
    })) });
    return Packer.toBuffer(document);
  }
  const rows = Array.isArray(data)
    ? data
    : [data];

  const children: Array<Paragraph | Table> = [
    new Paragraph({
      children: [
        new TextRun({
          text: titulo,
          bold: true,
          size: 32,
        }),
      ],
    }),

    new Paragraph({
      text: `Generado: ${new Date().toLocaleString("es-AR")}`,
    }),
  ];

  if (rows.length > 0) {
    const first =
      rows[0] as Record<string, unknown>;

    const headers = Object.keys(first);

    // Encabezados de tabla.
    const tableRows = [
      new TableRow({
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: header,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
        ),
      }),
    ];

    // Agrega las filas.
    for (const row of rows) {
      const record =
        row as Record<string, unknown>;

      tableRows.push(
        new TableRow({
          children: headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph(
                    textValue(record[header]),
                  ),
                ],
              }),
          ),
        }),
      );
    }

    children.push(
      new Table({
        rows: tableRows,
      }),
    );
  }

  const document = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
};
