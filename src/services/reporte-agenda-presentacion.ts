import type { 
  AgendaLista, 
  ReporteSecciones 
} from "../types/reporte-agenda.types.js";

export const agendaSecciones = (
  listas: AgendaLista[], 
  fecha: string): ReporteSecciones => (
    {
      secciones: listas.length ? listas.map(lista => (
        {
          cabecera: [
            "SAPS TURNO", 
            "Lista diaria de pacientes", 
            `Fecha: ${lista.fecha.split("-").reverse().join("/")}`,
            `Salita: ${lista.salita}`, 
            ...(lista.direccion ? [`Dirección: ${lista.direccion}`

            ] : []
          ),
          `Profesional: ${lista.profesional}`, 
          `Especialidad: ${lista.especialidad}`,
          `Total de pacientes: ${lista.total_pacientes}`
        ],
        columnas: ["N°", "Hora", "Paciente", "DNI", "Estado", "Motivo"],
        filas: lista.pacientes.map((p, i) => [String(i + 1), 
          p.hora,
          p.apellido_nombre,
          p.dni, p.estado,
          p.motivo_consulta ?? ""
        ]
      ),
      pie: [
        `Total de pacientes: ${lista.total_pacientes}`, 
        "Firma del profesional: ______________________"],
      }
    )
  ) : [
    { cabecera: [
      "SAPS TURNO", 
      "Lista diaria de pacientes", 
      `Fecha: ${fecha.split("-").reverse().join("/")}`
    ],
    columnas: [],
    filas: [], 
    pie: ["Sin pacientes asignados para los filtros seleccionados."] 
  }
],
}
);

// Escapa datos personales antes de insertarlos en el documento imprimible.
const escape = (value: string) => value.replace(/[&<>"']/g, char =>
  ({ 
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;", 
    "'": "&#39;" 
  }
)[char]!);

export const agendaHtml = (data: ReporteSecciones) => `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title
  SAPS Turno — Lista diaria
</title><style>

@page{
  size:A4;
  margin:15mm
} body{
 font:12px Arial, sans-serif;color:#000;background:#fff}
section{break-after:page}section:last-child{break-after:auto}h1{font-size:20px}p{margin:6px 0}
table{width:100%;border-collapse:collapse;margin:18px 0}th,td{border:1px solid #777;padding:7px;text-align:left;overflow-wrap:anywhere}
thead{display:table-header-group}tr{break-inside:avoid}footer{margin-top:20px} @media print{.ayuda{display:none}}
</style></head><body><p class="ayuda">Para imprimir, usá Ctrl+P o la opción Imprimir del navegador.</p>${data.secciones.map(s =>
  `<section><h1>${escape(s.cabecera[0] ?? "SAPS TURNO")}</h1>${s.cabecera.slice(1).map(line => `<p>${escape(line)}</p>`).join("")}
  <table><thead><tr>${s.columnas.map(c => `<th>${escape(c)}</th>`).join("")}</tr></thead><tbody>${s.filas.map(row =>
    `<tr>${row.map(cell => `<td>${escape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>
  <footer>${s.pie.map(line => `<p>${escape(line)}</p>`).join("")}</footer></section>`).join("")}</body></html>`;
