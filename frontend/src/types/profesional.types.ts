export type ProfessionalSex =
  | 'FEMENINO'
  | 'MASCULINO'
  | 'X'
  | 'NO_INFORMA';

export interface ProfessionalPerson {
  id_persona: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  sexo: ProfessionalSex | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  localidad: string | null;
  provincia: string | null;
  codigo_postal: string | null;
  activo: boolean;
}

export interface Professional {
  id_profesional: string;
  id_persona: string;
  matricula: string;
  activo: boolean;
  fecha_alta: string;
  fecha_baja: string | null;
  fecha_actualizacion: string;
  persona: ProfessionalPerson;
}

export interface ProfessionalResponse {
  success: boolean;
  message?: string;
  data: Professional;
}

export interface ProfessionalsResponse {
  success: boolean;
  message?: string;
  data: Professional[];
}

export interface CreateProfessionalRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string | null;
  sexo?: ProfessionalSex | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string | null;
  matricula: string;
}

export interface UpdateProfessionalRequest {
  dni?: string;
  nombres?: string;
  apellidos?: string;
  fecha_nacimiento?: string | null;
  sexo?: ProfessionalSex | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  localidad?: string;
  provincia?: string;
  codigo_postal?: string | null;
  matricula?: string;
  activo?: boolean;
  fecha_alta?: string;
  fecha_baja?: string | null;
}

export interface ProfessionalSpecialty {
  id_profesional: string;
  id_especialidad: string;
  fecha_desde: string;
  fecha_hasta: string | null;
  activo: boolean;
  especialidad: {
    id_especialidad: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
  };
}

export interface ProfessionalSpecialtiesResponse {
  success: boolean;
  message?: string;
  data: ProfessionalSpecialty[];
}

export interface CreateProfessionalSpecialtyRequest {
  id_especialidad: string;
  fecha_desde?: string;
  fecha_hasta?: string | null;
}

export interface UpdateProfessionalSpecialtyRequest {
  fecha_desde?: string;
  fecha_hasta?: string | null;
  activo?: boolean;
}

export interface ProfessionalClinic {
  id_profesional: string;
  id_salita: string;
  fecha_desde: string;
  fecha_hasta: string | null;
  activo: boolean;
  salita: {
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
  };
}

export interface ProfessionalClinicsResponse {
  success: boolean;
  message?: string;
  data: ProfessionalClinic[];
}

export interface CreateProfessionalClinicRequest {
  id_salita: string;
  fecha_desde?: string;
  fecha_hasta?: string | null;
}

export interface UpdateProfessionalClinicRequest {
  fecha_desde?: string;
  fecha_hasta?: string | null;
  activo?: boolean;
}

export interface Specialty {
  id_especialidad: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  requiere_profesional: boolean;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface SpecialtiesResponse {
  success: boolean;
  message?: string;
  data: Specialty[];
}