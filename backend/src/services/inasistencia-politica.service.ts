import { AppError } from '../utils/app-error.js';
import { supabase } from '../config/supabase.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import {
  countUnjustifiedAbsences,
  insertAdvertencia,
  findAdvertenciasByPatient,
  anularAdvertenciaByTurno,
  insertJustificacion,
  findJustificacionById,
  findJustificacionByTurno,
  countPendingJustificacionesByPatient,
  findJustificaciones,
  updateJustificacionDecision,
} from '../repositories/inasistencia-politica.repository.js';
import { findTurnoById } from '../repositories/turno-read.repository.js';
import { patchTurno } from '../repositories/turno-update.repository.js';
import { getTurno, getTurnoState } from './turno-read.service.js';
import { resolveManagedPatient } from './patient-managed.service.js';
import { anularSancion } from '../repositories/sancion.repository.js';
import { findTurnoSanction } from '../repositories/turno-agenda.repository.js';
import { findPatientById } from '../repositories/patient-read.repository.js';
import { sendSystemNotification } from './notificacion.service.js';
import { emitirCambioAgenda } from './socket.service.js';
import type {
  CrearJustificacionInput,
  EvaluarJustificacionInput,
  RectificarInasistenciaInput,
  JustificacionesQuery,
} from '../validators/inasistencia-politica.validator.js';

const VENTANA_DIAS_DEFAULT = 90;

/**
 * Procesa una inasistencia recién registrada aplicando la política progresiva 1-2-3.
 * La decisión (conteo, advertencia o restricción) se toma de forma atómica e idempotente
 * en PostgreSQL (fn_procesar_inasistencia_turno), serializada por paciente; el operador
 * se valida en la base contra usuarios/roles activos.
 */
export const procesarInasistenciaTurno = async (
  id_turno: string,
  user: AuthenticatedUser
) => {
  const turno = await findTurnoById(id_turno);
  if (!turno) throw new AppError('Turno no encontrado', 404);

  const patientId = turno.id_paciente;

  const { data, error } = await supabase.rpc('fn_procesar_inasistencia_turno', {
    p_id_turno: turno.id_turno,
    p_usuario: user.id_usuario,
  });
  if (error) throw error;

  const resultado = (data ?? {}) as { accion?: string; faltas?: number };
  const faltas = resultado.faltas ?? 0;
  const patientUser = await findPatientUserId(patientId);

  if (resultado.accion === 'PRIMERA_ADVERTENCIA' && patientUser) {
    await sendSystemNotification({
      id_usuario: patientUser,
      id_turno: turno.id_turno,
      tipo: 'ADVERTENCIA_INASISTENCIA',
      titulo: 'Aviso sobre inasistencia a tu turno',
      mensaje:
        'Registramos que no asististe a tu turno médico. Esta es una advertencia informativa. Te recordamos cancelar con anticipación si no podés concurrir para que otra persona aproveche el horario.',
    }).catch(() => null);
  } else if (resultado.accion === 'ADVERTENCIA_FORMAL' && patientUser) {
    await sendSystemNotification({
      id_usuario: patientUser,
      id_turno: turno.id_turno,
      tipo: 'ADVERTENCIA_INASISTENCIA',
      titulo: 'Advertencia formal por inasistencia',
      mensaje:
        'Registraste una segunda inasistencia en los últimos 90 días. Si acumulás una tercera falta injustificada, no podrás realizar nuevas reservas online por 7 días. Si tuviste un motivo justificado, podés presentar documentación en tu salita.',
    }).catch(() => null);
  } else if (resultado.accion === 'RESTRICCION' && patientUser) {
    await sendSystemNotification({
      id_usuario: patientUser,
      id_turno: turno.id_turno,
      tipo: 'RESTRICCION_APLICADA',
      titulo: 'Restricción temporal de reservas online (7 días)',
      mensaje:
        'Debido a la acumulación de tres inasistencias en los últimos 90 días, tu cuenta no podrá solicitar nuevos turnos por la web durante 7 días corridos. Si necesitás atención médica urgente o presencial, podés concurrir directamente a tu salita.',
    }).catch(() => null);
  }

  return { faltas, accion: resultado.accion ?? 'NINGUNA' };
};
/**
 * Rectificación explícita y auditable de una inasistencia errónea hacia ATENDIDO
 */
export const rectificarInasistencia = async (
  id_turno: string,
  input: RectificarInasistenciaInput,
  user: AuthenticatedUser
) => {
  // Solo roles autorizados
  const rolesAutorizados = ['PROFESIONAL', 'ADMIN_SALITA', 'RECEPCION', 'SUPER_ADMIN'];
  if (!rolesAutorizados.includes(user.rol)) {
    throw new AppError('No tenés permisos para rectificar inasistencias', 403);
  }

  // Valida existencia y alcance de salita/profesional del turno
  const turno = await getTurno(id_turno, user);
  if (!turno) throw new AppError('Turno no encontrado', 404);

  if (turno.estado.codigo !== 'NO_ASISTIO') {
    throw new AppError(
      'Solo se pueden rectificar turnos que se encuentren en estado No Asistió',
      400
    );
  }

  const estadoAtendido = await getTurnoState('ATENDIDO');

  // Actualizar turno con trazabilidad de rectificación
  await patchTurno(id_turno, turno.version, {
    id_estado: estadoAtendido.id_estado,
    rectificado_por: user.id_usuario,
    motivo_rectificacion: input.motivo_rectificacion,
    fecha_rectificacion: new Date().toISOString(),
  });

  // Revertir antecedentes asociados de manera idempotente y auditable (soft-anulada)
  await anularAdvertenciaByTurno(
    id_turno,
    `Rectificación médica a ATENDIDO: ${input.motivo_rectificacion}`,
    user.id_usuario
  );

  // Re-evaluar conteo de faltas en la ventana móvil: solo si cae por debajo de 3 se levanta la sanción
  const faltasActualizadas = await countUnjustifiedAbsences(
    turno.id_paciente,
    VENTANA_DIAS_DEFAULT
  );
  if (faltasActualizadas < 3) {
    const sancionActiva = await findTurnoSanction(turno.id_paciente);
    if (sancionActiva) {
      await anularSancion(
        sancionActiva.id_sancion,
        `Levantamiento automático tras rectificación médica del turno a ATENDIDO: ${input.motivo_rectificacion}`,
        user.id_usuario
      ).catch(() => null);
    }
  }

  emitirCambioAgenda({
    tipo: 'TURNO_ACTUALIZADO',
    mensaje: 'Inasistencia rectificada a Atendido',
    id_turno: turno.id_turno,
    id_paciente: turno.id_paciente,
    id_profesional: turno.id_profesional,
    id_salita: turno.id_salita,
    estado: 'ATENDIDO',
  });

  return {
    success: true,
    message: 'Inasistencia rectificada correctamente a Atendido',
    data: { id_turno: turno.id_turno, nuevo_estado: 'ATENDIDO' },
  };
};

/**
 * Presentación de una justificación de inasistencia
 */
export const presentarJustificacion = async (
  input: CrearJustificacionInput,
  user: AuthenticatedUser
) => {
  // getTurno valida existencia, alcance de salita para personal y tutoría/propiedad para PACIENTE
  const turno = await getTurno(input.id_turno, user);
  if (!turno) throw new AppError('Turno no encontrado', 404);

  if (turno.estado.codigo !== 'NO_ASISTIO') {
    throw new AppError(
      'Solo se pueden justificar turnos que tengan inasistencia registrada',
      400
    );
  }

  // Verificación estricta de propiedad/tutoría para pacientes
  if (user.rol === 'PACIENTE') {
    await resolveManagedPatient(user, turno.id_paciente);
  }

  // Control anti-abuso 1: Unicidad (un turno solo admite 1 justificación)
  const existing = await findJustificacionByTurno(input.id_turno);
  if (existing) {
    throw new AppError(
      `Ya existe una justificación para este turno en estado ${existing.estado}`,
      409
    );
  }

  // Control anti-abuso 2: No permitir más de 2 justificaciones pendientes simultáneas sin evaluar
  const pendientes = await countPendingJustificacionesByPatient(turno.id_paciente);
  if (pendientes >= 2) {
    throw new AppError(
      'Tenés solicitudes de justificación pendientes de evaluación. Esperá la resolución de tu salita antes de enviar una nueva.',
      429
    );
  }

  const justificacion = await insertJustificacion({
    id_turno: input.id_turno,
    id_paciente: turno.id_paciente,
    motivo: input.motivo,
    documentacion_ref: input.documentacion_ref,
    presentada_por: user.id_usuario,
  });

  return justificacion;
};

/**
 * Dictamina una justificación (APROBADA o RECHAZADA) por parte de Recepción o Administración
 */
export const evaluarJustificacion = async (
  id_justificacion: string,
  input: EvaluarJustificacionInput,
  user: AuthenticatedUser
) => {
  const rolesAutorizados = ['SUPER_ADMIN', 'ADMIN_SALITA', 'RECEPCION'];
  if (!rolesAutorizados.includes(user.rol)) {
    throw new AppError('No tenés permisos para dictaminar justificaciones', 403);
  }

  const previa = await findJustificacionById(id_justificacion);
  if (!previa) throw new AppError('Justificación no encontrada', 404);

  if (previa.estado !== 'PENDIENTE') {
    throw new AppError(`Esta justificación ya fue dictaminada como ${previa.estado}`, 409);
  }

  // Validar alcance de salita sobre el turno de la justificación
  const turno = await getTurno(previa.id_turno, user);
  if (!turno) throw new AppError('Turno asociado no encontrado', 404);

  const justificacion = await updateJustificacionDecision(id_justificacion, {
    estado: input.estado,
    evaluado_por: user.id_usuario,
    motivo_resolucion: input.motivo_resolucion,
  });

  if (input.estado === 'APROBADA' && turno) {
    // Si la justificación es aprobada:
    // 1. Desactivar advertencia si este turno la había originado
    await anularAdvertenciaByTurno(
      turno.id_turno,
      `Justificación aprobada: ${input.motivo_resolucion || 'Aprobada por salita'}`,
      user.id_usuario
    );

    // 2. Si tenía sanción activa originada por este turno, o el nuevo conteo cae < 3, anular sanción
    const faltasActualizadas = await countUnjustifiedAbsences(
      turno.id_paciente,
      VENTANA_DIAS_DEFAULT
    );

    if (faltasActualizadas < 3) {
      const sancionActiva = await findTurnoSanction(turno.id_paciente);
      if (sancionActiva) {
        await anularSancion(
          sancionActiva.id_sancion,
          `Levantamiento automático tras aprobación de justificación médica: ${
            input.motivo_resolucion || 'Justificación aprobada'
          }`,
          user.id_usuario
        ).catch(() => null);
      }
    }
  }

  // Notificar al paciente de la decisión
  if (turno) {
    const patientUser = await findPatientUserId(turno.id_paciente);
    if (patientUser) {
      await sendSystemNotification({
        id_usuario: patientUser,
        id_turno: turno.id_turno,
        tipo: 'JUSTIFICACION_EVALUADA',
        titulo: `Justificación de inasistencia ${input.estado.toLowerCase()}`,
        mensaje:
          input.estado === 'APROBADA'
            ? 'Tu justificación de inasistencia fue aprobada por la salita. La falta ha sido excluida de tus antecedentes.'
            : `Tu justificación de inasistencia fue rechazada. Motivo: ${
                input.motivo_resolucion || 'Documentación insuficiente.'
              }`,
      }).catch(() => null);
    }
  }

  return justificacion;
};

/**
 * Consulta del estado completo de inasistencias y advertencias para el paciente o administración
 */
export const obtenerEstadoInasistenciasPaciente = async (patientId: string) => {
  const faltasVentana = await countUnjustifiedAbsences(patientId, VENTANA_DIAS_DEFAULT);
  const advertencias = await findAdvertenciasByPatient(patientId, true);
  const sancion = await findTurnoSanction(patientId);

  return {
    id_paciente: patientId,
    ventana_dias: VENTANA_DIAS_DEFAULT,
    conteo_faltas_activas: faltasVentana,
    puede_reservar_online: !sancion,
    sancion_vigente: sancion
      ? {
          id_sancion: sancion.id_sancion,
          motivo: sancion.motivo,
          fecha_inicio: sancion.fecha_inicio,
          fecha_fin: sancion.fecha_fin,
        }
      : null,
    advertencias: advertencias.map((a) => ({
      id_advertencia: a.id_advertencia,
      id_turno: a.id_turno,
      nivel: a.nivel,
      motivo: a.motivo,
      anulada: a.anulada,
      fecha_emision: a.fecha_emision,
    })),
    aviso_asistencial:
      'Las restricciones de reserva aplican exclusivamente al portal web. Podés concurrir presencialmente a tu salita o solicitar atención médica de urgencia en cualquier momento.',
  };
};

/**
 * Helper para obtener el usuario de un paciente
 */
const findPatientUserId = async (patientId: string): Promise<string | null> => {
  try {
    const patient = await findPatientById(patientId);
    if (!patient?.id_persona) return null;

    // Buscar en usuarios
    const { supabase } = await import('../config/supabase.js');
    const { data } = await supabase
      .from('usuarios')
      .select('id_usuario')
      .eq('id_persona', patient.id_persona)
      .maybeSingle();

    return data?.id_usuario ?? null;
  } catch {
    return null;
  }
};
