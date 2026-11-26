import api from './api';

export interface AdvertenciaInasistencia {
  id_advertencia: string;
  id_turno: string;
  nivel: 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL';
  motivo: string;
  anulada: boolean;
  fecha_emision: string;
}

export interface SancionVigente {
  id_sancion: string;
  motivo: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface EstadoInasistenciasPaciente {
  id_paciente: string;
  ventana_dias: number;
  conteo_faltas_activas: number;
  puede_reservar_online: boolean;
  sancion_vigente: SancionVigente | null;
  advertencias: AdvertenciaInasistencia[];
  aviso_asistencial: string;
}

export interface JustificacionInasistencia {
  id_justificacion: string;
  id_turno: string;
  id_paciente: string;
  motivo: string;
  documentacion_ref?: string | null;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  presentada_por?: string | null;
  evaluado_por?: string | null;
  fecha_evaluacion?: string | null;
  motivo_resolucion?: string | null;
  fecha_creacion: string;
  turno?: {
    id_turno: string;
    id_salita?: string;
    codigo_turno?: string;
    fecha_hora_inicio: string;
    especialidad?: { id_especialidad?: string; nombre: string };
    profesional?: { matricula: string; persona?: { nombres: string; apellidos: string } };
    salita?: { id_salita?: string; nombre: string };
  };
  paciente?: {
    id_paciente: string;
    persona?: {
      nombres: string;
      apellidos: string;
      dni: string;
    };
  };
  evaluador?: {
    id_usuario: string;
    nombre_usuario: string;
    persona?: {
      nombres: string;
      apellidos: string;
    };
  };
}

export interface JustificacionesResponse {
  data: JustificacionInasistencia[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InasistenciaRegistradaItem {
  id_turno: string;
  codigo_turno: string;
  id_paciente: string;
  id_profesional: string;
  id_especialidad: string;
  id_salita: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  observaciones: string | null;
  rectificado_por: string | null;
  motivo_rectificacion: string | null;
  fecha_rectificacion: string | null;
  faltas_90d: number;
  estado: {
    id_estado: string;
    codigo: string;
    nombre: string;
  };
  paciente: {
    id_paciente: string;
    persona: {
      dni: string;
      nombres: string;
      apellidos: string;
    };
  };
  profesional?: {
    id_profesional: string;
    matricula: string;
    persona?: {
      nombres: string;
      apellidos: string;
    };
  };
  salita?: {
    id_salita: string;
    nombre: string;
  };
  especialidad?: {
    id_especialidad: string;
    nombre: string;
  };
  justificacion?: {
    id_justificacion: string;
    estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
    motivo: string;
    documentacion_ref?: string | null;
    fecha_creacion: string;
    fecha_evaluacion?: string | null;
    motivo_resolucion?: string | null;
  } | null;
}

export interface InasistenciasRegistradasResponse {
  data: InasistenciaRegistradaItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AdvertenciaAdminItem {
  id_advertencia: string;
  id_paciente: string;
  id_turno: string;
  nivel: 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL' | 'RESTRICCION';
  motivo: string;
  anulada: boolean;
  motivo_anulacion?: string | null;
  anulada_por?: string | null;
  fecha_emision: string;
  fecha_anulacion?: string | null;
  fecha_fin?: string | null;
  turno: {
    id_turno: string;
    id_salita: string;
    fecha_hora_inicio: string;
    especialidad?: { id_especialidad: string; nombre: string };
    salita?: { id_salita: string; nombre: string };
  };
  paciente: {
    id_paciente: string;
    persona: {
      dni: string;
      nombres: string;
      apellidos: string;
    };
  };
  anulador?: {
    id_usuario: string;
    nombre_usuario: string;
    persona?: {
      nombres: string;
      apellidos: string;
    };
  };
}

export interface AdvertenciasAdminResponse {
  data: AdvertenciaAdminItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MetricasInasistencias {
  justificaciones_pendientes: number;
  inasistencias_registradas: number;
  advertencias_vigentes: number;
}

export const getEstadoInasistencias = async (
  id_paciente: string
): Promise<EstadoInasistenciasPaciente> => {
  const response = await api.get<{ success: boolean; data: EstadoInasistenciasPaciente }>(
    `/inasistencias/pacientes/${id_paciente}/estado`
  );
  return response.data.data;
};

export const getMetricasInasistencias = async (): Promise<MetricasInasistencias> => {
  const response = await api.get<{ success: boolean; data: MetricasInasistencias }>(
    '/inasistencias/metricas'
  );
  return response.data.data;
};

export const crearJustificacion = async (input: {
  id_turno: string;
  motivo: string;
  documentacion_ref?: string;
}): Promise<JustificacionInasistencia> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: { justificacion: JustificacionInasistencia };
  }>('/inasistencias/justificaciones', input);
  return response.data.data.justificacion;
};

export const listarJustificaciones = async (query?: {
  id_paciente?: string;
  id_salita?: string;
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<JustificacionesResponse> => {
  const response = await api.get<{
    success: boolean;
    data: JustificacionInasistencia[];
    pagination: JustificacionesResponse['pagination'];
  }>('/inasistencias/justificaciones', { params: query });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const listarInasistenciasRegistradas = async (query?: {
  id_salita?: string;
  id_profesional?: string;
  id_especialidad?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<InasistenciasRegistradasResponse> => {
  const response = await api.get<{
    success: boolean;
    data: InasistenciaRegistradaItem[];
    pagination: InasistenciasRegistradasResponse['pagination'];
  }>('/inasistencias/registradas', { params: query });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const listarAdvertenciasAdmin = async (query?: {
  id_paciente?: string;
  id_salita?: string;
  nivel?: 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL' | 'RESTRICCION';
  anulada?: 'true' | 'false';
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdvertenciasAdminResponse> => {
  const response = await api.get<{
    success: boolean;
    data: AdvertenciaAdminItem[];
    pagination: AdvertenciasAdminResponse['pagination'];
  }>('/inasistencias/advertencias', { params: query });
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const anularAdvertenciaAdmin = async (
  id_advertencia: string,
  input: { motivo_anulacion: string }
): Promise<void> => {
  await api.patch(`/inasistencias/advertencias/${id_advertencia}/anular`, input);
};

export const evaluarJustificacion = async (
  id_justificacion: string,
  input: {
    estado: 'APROBADA' | 'RECHAZADA';
    motivo_resolucion?: string;
  }
): Promise<JustificacionInasistencia> => {
  const response = await api.patch<{
    success: boolean;
    message: string;
    data: { justificacion: JustificacionInasistencia };
  }>(`/inasistencias/justificaciones/${id_justificacion}/evaluar`, input);
  return response.data.data.justificacion;
};

export const rectificarInasistencia = async (
  id_turno: string,
  input: {
    nuevo_estado: 'ATENDIDO';
    motivo_rectificacion: string;
  }
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post<{ success: boolean; message: string }>(
    `/inasistencias/turnos/${id_turno}/rectificar`,
    input
  );
  return response.data;
};
