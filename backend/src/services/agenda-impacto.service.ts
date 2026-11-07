
import { findAgendaAffected } from '../repositories/agenda-impacto.repository.js';
import { getHorarioById } from '../repositories/horario-atencion.repository.js';
import { getBloqueoById } from '../repositories/bloqueo-agenda.repository.js';
import { getTurnoScope, assertTurnoScope } from './turno-access.service.js';
import { AppError } from '../utils/app-error.js';
import type { AuthenticatedUser } from '../types/auth.types.js';
import type { AgendaChange } from '../validators/agenda-impacto.validator.js';
import { validarHorario } from '../validators/horario-rules.js';

// Verifica que el cambio de agenda no afecte turnos vigentes.
export const assertNoAgendaAffected = async (
  tipo: 'horario' | 'bloqueo',
  datos: object
) => {
  const afectados = await findAgendaAffected(tipo, datos);

  if (afectados.length) {
    throw new AppError(
      `Este cambio afecta ${afectados.length} turnos vigentes. Debés resolverlos antes de guardar.`,
      409,
      'AGENDA_CONFLICT',
      {
        cantidad: afectados.length,
      }
    );
  }
};

// Obtiene los turnos afectados por una modificación de agenda.
export const getAgendaImpact = async (
  change: AgendaChange,
  user: AuthenticatedUser
) => {
  // Verifica que el usuario tenga permisos de reprogramación.
  if (!['SUPER_ADMIN', 'ADMIN_SALITA', 'RECEPCION'].includes(user.rol)) {
    throw new AppError(
      'No tiene permisos para reprogramación asistida',
      403
    );
  }

  // Obtiene las salitas autorizadas para el usuario.
  const scope = await getTurnoScope(user);

  // Recupera la configuración actual del horario o bloqueo.
  const current =
    change.tipo === 'horario'
      ? await getHorarioById(change.id)
      : change.id
        ? await getBloqueoById(change.id)
        : null;

  if (change.id && !current) {
    throw new AppError(
      'Configuración no encontrada',
      404
    );
  }

  // Verifica el acceso a la configuración existente.
  if (current) {
    assertTurnoScope(scope, current.id_salita);
  }

  // Valida las fechas y horas cuando se modifica un horario.
  if (change.tipo === 'horario') {
    const horario = {
      ...current as NonNullable<Awaited<ReturnType<typeof getHorarioById>>>,
      ...change.datos,
    };

    validarHorario(
      horario.hora_inicio,
      horario.hora_fin,
      horario.vigencia_desde,
      horario.vigencia_hasta
    );
  }

  // Combina la configuración actual con los cambios solicitados.
  const datos = {
    activo: true,
    ...current,
    ...change.datos,
  };

  assertTurnoScope(scope, datos.id_salita!);

  // Consulta los turnos afectados y verifica su alcance.
  const afectados = await findAgendaAffected(
    change.tipo,
    datos
  );

  for (const turno of afectados) {
    assertTurnoScope(scope, turno.id_salita);
  }

  return {
    datos,
    afectados,
  };
};
