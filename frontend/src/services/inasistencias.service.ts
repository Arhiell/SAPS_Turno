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
    codigo_turno: string;
    fecha_hora_inicio: string;
    especialidad?: { nombre: string };
    profesional?: { matricula: string; persona?: { nombres: string; apellidos: string } };
    salita?: { nombre: string };
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

export const getEstadoInasistencias = async (
  id_paciente: string
): Promise<EstadoInasistenciasPaciente> => {
  const response = await api.get<{ success: boolean; data: EstadoInasistenciasPaciente }>(
    `/inasistencias/pacientes/${id_paciente}/estado`
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
  estado?: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
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
