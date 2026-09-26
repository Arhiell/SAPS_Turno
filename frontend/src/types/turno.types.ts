export type TurnoEstadoCodigo =
  | 'SOLICITADO'
  | 'CONFIRMADO'
  | 'EN_ESPERA'
  | 'ATENDIDO'
  | 'NO_ASISTIO'
  | 'CANCELADO'
  | 'REPROGRAMADO'
  | string;

export interface TurnoEstado {
  id_estado: string;
  codigo: TurnoEstadoCodigo;
  nombre: string;
  ocupa_agenda: boolean;
  impide_otro_misma_especialidad: boolean;
  es_estado_final: boolean;
  activo: boolean;
}

export interface TurnoPaciente {
  id_paciente: string;
  persona: {
    dni: string;
    nombres: string;
    apellidos: string;
  };
}

export interface TurnoProfesional {
  id_profesional: string;
  matricula: string;
  persona: {
    nombres: string;
    apellidos: string;
  };
}

export interface TurnoSalita {
  id_salita: string;
  nombre: string;
  direccion?: string;
}

export interface TurnoEspecialidad {
  id_especialidad: string;
  nombre: string;
}

export interface Turno {
  id_turno: string;
  codigo_turno: string;

  id_paciente: string;
  id_profesional: string;
  id_especialidad: string;
  id_salita: string;
  id_horario: string | null;
  id_estado: string;

  fecha_hora_inicio: string;
  fecha_hora_fin: string;

  motivo_consulta: string | null;
  observaciones: string | null;

  motivo_cancelacion: string | null;
  fecha_cancelacion: string | null;
  cancelado_por: string | null;

  fecha_solicitud?: string;
  fecha_actualizacion?: string;

  ocupa_agenda: boolean;
  impide_otro_misma_especialidad: boolean;
  version: number;

  estado: TurnoEstado;
  paciente: TurnoPaciente;
  profesional: TurnoProfesional;
  salita: TurnoSalita;
  especialidad: TurnoEspecialidad;
}

export interface TurnosPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TurnosResponse {
  success: boolean;
  message?: string;
  data: {
    turnos: Turno[];
    pagination: TurnosPagination;
  };
}

export interface TurnoResponse {
  success: boolean;
  message?: string;
  data: {
    turno: Turno;
  };
}

export interface CreateTurnoRequest {
  id_paciente: string;
  id_profesional: string;
  id_especialidad: string;
  id_salita: string;
  id_horario?: string;
  fecha_hora_inicio: string;
  motivo_consulta?: string | null;
  observaciones?: string | null;
}

export interface UpdateTurnoRequest {
  id_profesional?: string;
  id_especialidad?: string;
  id_salita?: string;
  id_horario?: string;
  fecha_hora_inicio?: string;
  motivo_consulta?: string | null;
  observaciones?: string | null;
}

export interface ChangeTurnoStatusRequest {
  estado: string;
  motivo_cancelacion?: string;
}

export type DisponibilidadEstado =
  | 'DISPONIBLE'
  | 'OCUPADO'
  | 'BLOQUEADO';

export interface DisponibilidadSlot {
  hora_inicio: string;
  hora_fin: string;
  estado: DisponibilidadEstado;
  id_turno?: string;
  estado_turno?: string;
  motivo?: string;
}

export interface DisponibilidadHorario {
  id_horario: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_turno_minutos: number;
  cupo_maximo_diario: number | null;
}

export interface DisponibilidadResponse {
  fecha: string;
  dia_semana: number;
  id_profesional: string;
  id_especialidad: string;
  id_salita: string;

  resumen: {
    total_slots: number;
    disponibles: number;
    ocupados: number;
    bloqueados: number;
  };

  slots: DisponibilidadSlot[];

  horarios_utilizados: DisponibilidadHorario[];
}

export interface TurnosFilters {
  fecha?: string;
  id_profesional?: string;
  id_paciente?: string;
  id_salita?: string;
  estado?: string;
  page?: number;
  limit?: number;
}