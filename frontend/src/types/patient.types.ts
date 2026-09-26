export type PatientSex =
  | 'FEMENINO'
  | 'MASCULINO'
  | 'X'
  | 'NO_INFORMA';

export interface Patient {
  id_paciente: string;
  id_persona: string;

  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  sexo: PatientSex | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  localidad?: string;
  provincia?: string;
  codigo_postal: string | null;

  id_barrio: string;
  id_salita_asignada: string;

  obra_social: string | null;
  numero_afiliado: string | null;
  contacto_emergencia_nombre: string | null;
  contacto_emergencia_telefono: string | null;

  activo: boolean;
  fecha_registro: string;
  fecha_actualizacion: string;
}

export interface PatientPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PatientsResponse {
  success: boolean;
  message?: string;
  data: {
    patients: Patient[];
    pagination: PatientPagination;
  };
}

export interface PatientResponse {
  success: boolean;
  message?: string;
  data: {
    patient: Patient;
  };
}

export interface UpdatePatientRequest {
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string | null;
  sexo?: PatientSex | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string | null;

  id_barrio?: string;
  id_salita_asignada?: string;

  obra_social?: string | null;
  numero_afiliado?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
}

export interface CreatePatientRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  sexo: PatientSex;
  telefono?: string | null;
  email?: string | null;
  direccion: string;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string | null;

  id_barrio: string;
  id_salita_asignada: string;

  obra_social?: string | null;
  numero_afiliado?: string | null;
  contacto_emergencia_nombre?: string | null;
  contacto_emergencia_telefono?: string | null;
}