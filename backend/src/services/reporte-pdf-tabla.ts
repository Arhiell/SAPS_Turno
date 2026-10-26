import type {
   ReporteSecciones 
  } from "../types/reporte-agenda.types.js";

// Dibuja tablas sobre el mismo documento PDFKit que usa el exportador existente.
export const drawReporteSections = (
  doc: PDFKit.PDFDocument, 
  data: ReporteSecciones
) => {
  const left = 40;

  const availableWidth = doc.page.width - left * 2;
  const widths = [25, 40, 140, 70, 90, 150].map(width => width * availableWidth / 615);

  const bottom = doc.page.height - 55;

  for (const [index, section] of data.secciones.entries()) {

    const header = () => {

      doc.font("Helvetica");

      for (const [i, line] of section.cabecera.entries()) doc.fontSize(i === 0 ? 16 : 10).text(line);
      doc.moveDown(0.5);

      if (section.columnas.length) row(section.columnas, true);
    };

    const row = (
      cells: string[], 
      bold = false) => {
          doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    
          // Divide incluso motivos extensos para no cortar texto al cambiar de página.
      const lines = cells.map((cell, i) => {
      
        const result = [""];
      
        for (const char of cell) {
          const last = result.length - 1;
      
          if (char === "\n" || doc.widthOfString(result[last] + char) > widths[i]! - 8) result.push(char === "\n" ? "" : char);
      
          else result[last] += char;
        }

        return result;
      });

      while (lines.some(cell => cell.length)) {
        if (doc.y + 26 > bottom) { doc.addPage(); header(); }
        
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
        
        const count = Math.min(Math.max(...lines.map(cell => cell.length)), Math.floor((bottom - doc.y - 12) / 12));
        
        const height = count * 12 + 12;
        
        const y = doc.y;
        
        let x = left;
        
        lines.forEach((cell, i) => {
        
          doc.rect(x, y, widths[i]!, height).strokeColor("#999999").stroke();
        
          cell.splice(0, count).forEach((line, n) => doc.fillColor("#000000")
            .text(line, x + 4, y + 6 + n * 12, { lineBreak: false }));
          x += widths[i]!;
        });
        
        doc.x = left; doc.y = y + height;
      }

    };

    if (index) doc.addPage();
    
    header();
    
    section.filas.forEach(cells => row(cells));
    
    if (doc.y + 65 > bottom) { doc.addPage(); header(); }
    
    doc.moveDown();
    
    section.pie.forEach(line => doc.fontSize(10).text(line));
  }
};
