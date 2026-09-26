export interface Salita {
  id_salita: string;
  codigo: string;
  nombre: string;
  direccion: string;
  id_barrio: string;
  telefono: string | null;
  email: string | null;
  latitud: number | null;
  longitud: number | null;
  horario_apertura: string | null;
  horario_cierre: string | null;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface SalitaResponse {
  success: boolean;
  message?: string;
  data: Salita;
}

export interface SalitasResponse {
  success: boolean;
  message?: string;
  data: Salita[];
}

export interface CreateSalitaRequest {
  codigo: string;
  nombre: string;
  direccion: string;
  id_barrio: string;
  telefono?: string | null;
  email?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  activo?: boolean;
}

export interface UpdateSalitaRequest {
  codigo?: string;
  nombre?: string;
  direccion?: string;
  id_barrio?: string;
  telefono?: string | null;
  email?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  horario_apertura?: string | null;
  horario_cierre?: string | null;
  activo?: boolean;
}