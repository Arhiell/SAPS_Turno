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
  findAdvertenciasAdmin,
  anularAdvertenciaAdmin,
} from '../repositories/inasistencia-politica.repository.js';
import { findTurnoById, findPatientIdsForTurnoSearch } from '../repositories/turno-read.repository.js';
import { patchTurno } from '../repositories/turno-update.repository.js';
import { getTurno, getTurnoState } from './turno-read.service.js';
import { getTurnoScope, assertTurnoScope } from './turno-access.service.js';
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
  AdvertenciasQuery,
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
 * Consulta de justificaciones para administración con filtrado por salita y scope
 */
export const obtenerJustificacionesAdmin = async (
  query: JustificacionesQuery,
  user: AuthenticatedUser
) => {
  const scope = await getTurnoScope(user);
  if (query.id_salita) {
    assertTurnoScope(scope, query.id_salita);
  }

  const patientIds = query.search
    ? await findPatientIdsForTurnoSearch(query.search, scope)
    : null;

  if (query.search && patientIds?.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
      },
    };
  }

  return findJustificaciones({
    id_paciente: query.id_paciente,
    id_salita: query.id_salita,
    estado: query.estado,
    fecha_desde: query.fecha_desde,
    fecha_hasta: query.fecha_hasta,
    patientIds,
    scope,
    page: query.page,
    limit: query.limit,
  });
};

/**
 * Consulta de advertencias para administración con filtrado por salita y scope
 */
export const obtenerAdvertenciasAdmin = async (
  query: AdvertenciasQuery,
  user: AuthenticatedUser
) => {
  const scope = await getTurnoScope(user);
  if (query.id_salita) {
    assertTurnoScope(scope, query.id_salita);
  }

  const patientIds = query.search
    ? await findPatientIdsForTurnoSearch(query.search, scope)
    : null;

  if (query.search && patientIds?.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
      },
    };
  }

  return findAdvertenciasAdmin({
    id_paciente: query.id_paciente,
    id_salita: query.id_salita,
    nivel: query.nivel,
    anulada: query.anulada ? query.anulada === 'true' : undefined,
    fecha_desde: query.fecha_desde,
    fecha_hasta: query.fecha_hasta,
    patientIds,
    scope,
    page: query.page,
    limit: query.limit,
  });
};

/**
 * Anula una advertencia administrativamente
 */
export const anularAdvertenciaOperativa = async (
  id_advertencia: string,
  motivo: string,
  user: AuthenticatedUser
) => {
  const rolesAutorizados = ['SUPER_ADMIN', 'ADMIN_SALITA'];
  if (!rolesAutorizados.includes(user.rol)) {
    throw new AppError('Solo administradores pueden anular advertencias', 403);
  }

  const { data: advertencia } = await supabase
    .from('advertencias_inasistencia')
    .select('*, turno:turnos!inner(id_salita)')
    .eq('id_advertencia', id_advertencia)
    .maybeSingle();

  if (!advertencia) {
    // Si no está en advertencias_inasistencia, verificar si es una sanción / restricción (Nivel 3)
    const { data: sancion } = await supabase
      .from('sanciones')
      .select('*, turno:turnos(id_salita)')
      .eq('id_sancion', id_advertencia)
      .maybeSingle();

    if (!sancion) {
      throw new AppError('Advertencia o restricción no encontrada', 404);
    }

    if (sancion.anulada) {
      throw new AppError('La restricción ya se encuentra anulada', 400);
    }

    const scope = await getTurnoScope(user);
    if (sancion.turno?.id_salita) {
      assertTurnoScope(scope, sancion.turno.id_salita);
    }

    const sancionAnulada = await anularSancion(id_advertencia, motivo, user.id_usuario);
    return sancionAnulada;
  }

  if (advertencia.anulada) {
    throw new AppError('La advertencia ya se encuentra anulada', 400);
  }

  const scope = await getTurnoScope(user);
  assertTurnoScope(scope, advertencia.turno.id_salita);

  const anulada = await anularAdvertenciaAdmin(id_advertencia, motivo, user.id_usuario);
  return anulada;
};

/**
 * Consulta de inasistencias registradas enriquecidas con conteo 90 días y estado de justificación
 */
export const obtenerInasistenciasAdmin = async (
  query: {
    id_salita?: string | undefined;
    id_profesional?: string | undefined;
    id_especialidad?: string | undefined;
    fecha_desde?: string | undefined;
    fecha_hasta?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  },
  user: AuthenticatedUser
) => {
  const scope = await getTurnoScope(user);
  if (query.id_salita) {
    assertTurnoScope(scope, query.id_salita);
  }

  const patientIds = query.search
    ? await findPatientIdsForTurnoSearch(query.search, scope)
    : null;

  if (query.search && patientIds?.length === 0) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
        totalPages: 0,
      },
    };
  }

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('turnos')
    .select(
      `
      id_turno,
      codigo_turno,
      id_paciente,
      id_profesional,
      id_especialidad,
      id_salita,
      fecha_hora_inicio,
      fecha_hora_fin,
      observaciones,
      rectificado_por,
      motivo_rectificacion,
      fecha_rectificacion,
      estado:estados_turno!inner(id_estado, codigo, nombre),
      paciente:pacientes!inner(
        id_paciente,
        persona:personas(dni, nombres, apellidos)
      ),
      profesional:profesionales(
        id_profesional,
        matricula,
        persona:personas(nombres, apellidos)
      ),
      salita:salitas(id_salita, nombre),
      especialidad:especialidades(id_especialidad, nombre),
      justificaciones:inasistencias_justificaciones(
        id_justificacion,
        estado,
        motivo,
        documentacion_ref,
        fecha_creacion,
        fecha_evaluacion,
        motivo_resolucion
      )
    `,
      { count: 'exact' }
    )
    .eq('estado.codigo', 'NO_ASISTIO')
    .order('fecha_hora_inicio', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scope !== null) {
    if (scope.length === 0) {
      return {
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }
    dbQuery = dbQuery.in('id_salita', scope);
  }

  if (query.id_salita) {
    dbQuery = dbQuery.eq('id_salita', query.id_salita);
  }
  if (query.id_profesional) {
    dbQuery = dbQuery.eq('id_profesional', query.id_profesional);
  }
  if (query.id_especialidad) {
    dbQuery = dbQuery.eq('id_especialidad', query.id_especialidad);
  }
  if (patientIds) {
    dbQuery = dbQuery.in('id_paciente', patientIds);
  }
  if (query.fecha_desde) {
    dbQuery = dbQuery.gte('fecha_hora_inicio', `${query.fecha_desde}T00:00:00.000Z`);
  }
  if (query.fecha_hasta) {
    dbQuery = dbQuery.lte('fecha_hora_inicio', `${query.fecha_hasta}T23:59:59.999Z`);
  }

  const { data, count, error } = await dbQuery;
  if (error) throw error;

  // Enriquecer concurrentemente con el conteo determinístico de faltas de los últimos 90 días
  const turnosEnriquecidos = await Promise.all(
    (data || []).map(async (t: any) => {
      const faltas90d = await countUnjustifiedAbsences(t.id_paciente, VENTANA_DIAS_DEFAULT);
      const justificacionReciente = Array.isArray(t.justificaciones) && t.justificaciones.length > 0
        ? t.justificaciones[0]
        : null;
      return {
        ...t,
        faltas_90d: faltas90d,
        justificacion: justificacionReciente,
      };
    })
  );

  return {
    data: turnosEnriquecidos,
    pagination: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
};

/**
 * Consulta de métricas generales para los contadores (badges) del módulo
 */
export const obtenerMetricasInasistenciasAdmin = async (user: AuthenticatedUser) => {
  const scope = await getTurnoScope(user);

  // 1. Justificaciones pendientes
  let justQuery = supabase
    .from('inasistencias_justificaciones')
    .select('id_justificacion, turno:turnos!inner(id_salita)', { count: 'exact', head: true })
    .eq('estado', 'PENDIENTE');

  if (scope !== null) {
    justQuery = justQuery.in('turno.id_salita', scope);
  }
  const { count: pendientesCount } = await justQuery;

  // 2. Inasistencias registradas
  let inasQuery = supabase
    .from('turnos')
    .select('id_turno, estado:estados_turno!inner(codigo)', { count: 'exact', head: true })
    .eq('estado.codigo', 'NO_ASISTIO');

  if (scope !== null) {
    inasQuery = inasQuery.in('id_salita', scope);
  }
  const { count: inasistenciasCount } = await inasQuery;

  // 3. Advertencias y restricciones vigentes no anuladas
  let advQuery = supabase
    .from('advertencias_inasistencia')
    .select('id_advertencia, turno:turnos!inner(id_salita)', { count: 'exact', head: true })
    .eq('anulada', false);

  if (scope !== null) {
    advQuery = advQuery.in('turno.id_salita', scope);
  }
  const { count: advertenciasCount } = await advQuery;

  let sancQuery = supabase
    .from('sanciones')
    .select('id_sancion, turno:turnos(id_salita)', { count: 'exact', head: true })
    .eq('anulada', false)
    .gt('fecha_fin', new Date().toISOString());

  if (scope !== null) {
    sancQuery = sancQuery.in('turno.id_salita', scope);
  }
  const { count: sancionesCount } = await sancQuery;

  return {
    justificaciones_pendientes: pendientesCount ?? 0,
    inasistencias_registradas: inasistenciasCount ?? 0,
    advertencias_vigentes: (advertenciasCount ?? 0) + (sancionesCount ?? 0),
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
