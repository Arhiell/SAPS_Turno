import type { EventoAgenda } from '../types/socket.types';

export interface ToastContext {
  id_evento?: string;
  id_turno?: string;
  id_paciente?: string;
  id_profesional?: string;
  id_salita?: string;
  tipo?: string;
  estado?: string;
  paciente?: string;
}

export type EventCategory =
  | 'LLEGADA_ESPERA'
  | 'CANCELACION'
  | 'REPROGRAMACION'
  | 'CREACION'
  | 'BLOQUEO'
  | 'HORARIO'
  | 'OTRO';

/**
 * Normaliza una cadena de texto para comparaciones insensibles a mayúsculas,
 * acentos y signos de puntuación.
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clasifica la categoría de un mensaje de toast verde y su contexto.
 */
export function getToastCategory(message: string, context?: ToastContext): EventCategory {
  if (context?.estado === 'EN_ESPERA') {
    return 'LLEGADA_ESPERA';
  }
  if (context?.tipo === 'TURNO_CANCELADO' || context?.estado === 'CANCELADO') {
    return 'CANCELACION';
  }
  if (context?.tipo === 'TURNO_REPROGRAMADO') {
    return 'REPROGRAMACION';
  }
  if (context?.tipo === 'TURNO_CREADO') {
    return 'CREACION';
  }
  if (context?.tipo === 'BLOQUEO_AGENDA') {
    return 'BLOQUEO';
  }
  if (context?.tipo === 'HORARIO_ATENCION_ACTUALIZADO') {
    return 'HORARIO';
  }

  const norm = normalizeText(message);
  if (!norm) return 'OTRO';

  // 1. Llegada / Sala de espera
  if (
    norm.includes('llegada') ||
    norm.includes('en espera') ||
    norm.includes('sala de espera') ||
    (norm.includes('pasa a') && norm.includes('espera'))
  ) {
    return 'LLEGADA_ESPERA';
  }

  // 2. Cancelación
  if (
    norm.includes('cancelad') || // cancelado, cancelada, cancelaron
    norm.includes('cancelacion')
  ) {
    return 'CANCELACION';
  }

  // 3. Reprogramación
  if (
    norm.includes('reprogramad') ||
    norm.includes('reprogramacion') ||
    norm.includes('reprogramo')
  ) {
    return 'REPROGRAMACION';
  }

  // 4. Creación de turno
  if (
    norm.includes('nuevo turno') ||
    norm.includes('turno creado') ||
    norm.includes('turno asignado') ||
    norm.includes('turno agendado') ||
    norm.includes('turno registrado')
  ) {
    return 'CREACION';
  }

  // 5. Bloqueo de agenda
  if (norm.includes('bloqueo')) {
    return 'BLOQUEO';
  }

  // 6. Horario de atención
  if (norm.includes('horario de atencion') || norm.includes('horario actualizado')) {
    return 'HORARIO';
  }

  return 'OTRO';
}

/**
 * Clasifica la categoría de una notificación blanca (EventoAgenda).
 */
export function getEventoCategory(evento: EventoAgenda): EventCategory {
  if (!evento) return 'OTRO';

  if (evento.estado === 'EN_ESPERA') {
    return 'LLEGADA_ESPERA';
  }
  if (evento.tipo === 'TURNO_CANCELADO' || evento.estado === 'CANCELADO') {
    return 'CANCELACION';
  }
  if (evento.tipo === 'TURNO_REPROGRAMADO') {
    return 'REPROGRAMACION';
  }
  if (evento.tipo === 'TURNO_CREADO') {
    return 'CREACION';
  }
  if (evento.tipo === 'BLOQUEO_AGENDA') {
    return 'BLOQUEO';
  }
  if (evento.tipo === 'HORARIO_ATENCION_ACTUALIZADO') {
    return 'HORARIO';
  }

  const normMsg = normalizeText(evento.mensaje);

  if (normMsg.includes('en espera') || normMsg.includes('llegada') || normMsg.includes('espera')) {
    return 'LLEGADA_ESPERA';
  }
  if (normMsg.includes('cancel')) {
    return 'CANCELACION';
  }
  if (normMsg.includes('reprogramad')) {
    return 'REPROGRAMACION';
  }
  if (normMsg.includes('nuevo turno') || normMsg.includes('turno agendado') || normMsg.includes('turno creado')) {
    return 'CREACION';
  }
  if (normMsg.includes('bloqueo')) {
    return 'BLOQUEO';
  }

  return 'OTRO';
}

/**
 * Comprueba si un mensaje de toast verde y una notificación blanca corresponden
 * al mismo evento y contexto.
 *
 * Prioridades estrictas:
 * 1. Identificador de evento (si existe).
 * 2. Identificador del turno (id_turno). No suprime eventos de turnos distintos del mismo paciente.
 * 3. Categoría y contexto del evento como alternativa controlada. Nunca utiliza únicamente
 *    el paciente como criterio suficiente para descartar un aviso.
 */
export function isEventEquivalent(
  message: string,
  evento: EventoAgenda,
  context?: ToastContext
): boolean {
  if (!evento) return false;

  // PRIORIDAD 1: Identificador del evento (si existe)
  if (context?.id_evento && evento.id) {
    if (context.id_evento !== evento.id) {
      return false;
    }
    return true;
  }

  // PRIORIDAD 2: Identificador del turno (id_turno)
  if (context?.id_turno || evento.id_turno) {
    // Si ambos identificadores están presentes, la igualdad o diferencia de turno es determinante
    if (context?.id_turno && evento.id_turno) {
      if (context.id_turno !== evento.id_turno) {
        // Pertenecen a turnos distintos del mismo o distinto paciente: NUNCA suprimir
        return false;
      }

      // Mismo turno: validar compatibilidad de estado
      if (context.estado && evento.estado && context.estado !== evento.estado) {
        return false;
      }

      const toastCat = getToastCategory(message, context);
      const eventoCat = getEventoCategory(evento);
      if (toastCat !== 'OTRO' && eventoCat !== 'OTRO' && toastCat !== eventoCat) {
        return false;
      }

      return true;
    }
  }

  // Validación de id_paciente: pacientes distintos nunca son equivalentes.
  // Pero el paciente por sí solo NUNCA es suficiente para descartar turnos distintos.
  if (context?.id_paciente && evento.id_paciente) {
    if (context.id_paciente !== evento.id_paciente) {
      return false;
    }
  }

  // PRIORIDAD 3: Categoría y contexto del evento como alternativa controlada
  const toastCat = getToastCategory(message, context);
  const eventoCat = getEventoCategory(evento);

  if (toastCat === 'OTRO' || eventoCat === 'OTRO') {
    return false;
  }

  if (toastCat !== eventoCat) {
    return false;
  }

  // 3. Verificación de entidad (paciente) para no confundir eventos de distintos pacientes
  const normMessage = normalizeText(message);
  const normEventoPaciente = normalizeText(evento.paciente || '');
  const normContextPaciente = normalizeText(context?.paciente || '');

  if (normEventoPaciente) {
    const eventoTokens = normEventoPaciente.split(' ').filter((t) => t.length > 2);

    // Si el contexto especifica un paciente distinto
    if (normContextPaciente) {
      const contextTokens = normContextPaciente.split(' ').filter((t) => t.length > 2);
      const sharesTokenWithContext = contextTokens.some((ct) =>
        eventoTokens.some((et) => et.includes(ct) || ct.includes(et))
      );
      if (!sharesTokenWithContext) {
        return false;
      }
    }

    // Si el mensaje del toast menciona explícitamente un apellido tras "para " (ej: "Llegada registrada para Lopez.")
    const paraMatch = normMessage.match(/para\s+([a-z]+)/);
    if (paraMatch && paraMatch[1]) {
      const targetSurname = paraMatch[1];
      if (targetSurname !== 'el' && targetSurname !== 'la' && targetSurname !== 'paciente') {
        const matchesSurname = eventoTokens.some(
          (et) => et.includes(targetSurname) || targetSurname.includes(et)
        );
        if (!matchesSurname) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Determina si existe alguna notificación equivalente activa en el panel de notificaciones.
 */
export function hasEquivalentNotification(
  message: string,
  notificaciones: EventoAgenda[],
  context?: ToastContext
): boolean {
  if (!message || !notificaciones || notificaciones.length === 0) {
    return false;
  }
  return notificaciones.some((evento) => isEventEquivalent(message, evento, context));
}
