export type TipoEventoAgenda =
  | 'TURNO_CREADO'
  | 'TURNO_REPROGRAMADO'
  | 'TURNO_CANCELADO'
  | 'TURNO_ACTUALIZADO'
  | 'BLOQUEO_AGENDA';

export interface EventoAgenda {
  id: string;
  tipo: TipoEventoAgenda;
  mensaje: string;
  id_turno?: string;
  id_profesional: string;
  id_salita?: string;
  paciente?: string;
  fecha_anterior?: string;
  horario_anterior?: string;
  nueva_fecha?: string;
  nuevo_horario?: string;
  motivo?: string;
  timestamp: string;
}

export type EstadoConexionSocket = 'conectado' | 'reconectando' | 'desconectado';
