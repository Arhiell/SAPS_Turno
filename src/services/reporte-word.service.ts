import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";

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