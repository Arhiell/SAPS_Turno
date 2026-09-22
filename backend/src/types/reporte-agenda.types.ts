export interface AgendaPaciente {
  id_turno: string;
  codigo_turno: string;
  hora: string;
  apellido_nombre: string;
  dni: string;
  estado: string;
  motivo_consulta: string | null;
}
export interface AgendaLista {
  fecha: string;
  id_salita: string;
  salita: string;
  direccion: string | null;
  id_profesional: string;
  profesional: string;
  id_especialidad: string;
  especialidad: string;
  total_pacientes: number;
  pacientes: AgendaPaciente[];
}
// Contrato común para los exportadores existentes, independiente del origen de datos.
export interface ReporteSecciones {
  secciones: {
     cabecera: string[]; 
     columnas: string[]; 
     filas: string[][]; 
     pie: string[] }[];
}
export const esReporteSecciones = (
  data: unknown
): data is ReporteSecciones =>
  typeof data === "object" && data !== null && "secciones" in data && Array.isArray(data.secciones);
