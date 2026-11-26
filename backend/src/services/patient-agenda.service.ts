import { getClinicSpecialtyIds } from './configuracion.service.js';
import { assertPatientCanBook } from './booking-restriction.service.js';
import { assertOwnCoverage } from './patient-coverage.service.js';
import { resolveManagedPatient } from './patient-managed.service.js';
import { validateTurnoEntities } from './turno-entities.service.js';
import { obtenerDisponibilidad } from './disponibilidad.service.js';
import { findCierres } from '../repositories/cierre-calendario.repository.js';
import { cierreEtiqueta } from '../utils/cierre-calendario.js';

import { findOpenTurno } from '../repositories/turno-agenda.repository.js';
import { findPatientProfessionals } from '../repositories/patient-agenda.repository.js';
import { getAllHorarios } from '../repositories/horario-atencion.repository.js';

import { assertBookingDate, bookingWindow } from '../utils/booking-window.js';
import { agendaDateTime } from '../utils/turno-time.js';
import { AppError } from '../utils/app-error.js';
import { formatProfesionalNombre } from '../utils/profesional-format.js';

import type { AuthenticatedUser } from '../types/auth.types.js';
import type { DisponibilidadQuery } from '../validators/disponibilidad.validator.js';

// Verifica que una asignación esté activa y vigente en la fecha indicada.
const vigente = (
  row: {
    activo: boolean;
    fecha_desde: string;
    fecha_hasta: string | null;
  },
  date: string
) =>
  row.activo &&
  row.fecha_desde <= date &&
  (!row.fecha_hasta || row.fecha_hasta >= date);

// Obtiene los profesionales y especialidades disponibles para el paciente.
export const getPatientProfessionals = async (
  user: AuthenticatedUser,
  date?: string,
  patientId?: string
) => {
  if (date) {
    assertBookingDate(date);
  }

  const window = bookingWindow();
  const dates = date ? [date] : window.fechas;
  const isDateFilter = Boolean(date);

  // Obtiene el paciente y verifica sus restricciones.
  const patient = await resolveManagedPatient(user, patientId, date);

  await assertPatientCanBook(patient.id_paciente);

  // Verifica la cobertura del paciente para la fecha.
  await assertOwnCoverage(
    user,
    patient.id_salita_asignada,
    dates[0]!,
    patient.id_paciente
  );

  // Consulta profesionales, horarios y especialidades de la salita.
  const [
    professionals,
    schedules,
    clinicSpecialties,
  ] = await Promise.all([
    findPatientProfessionals(
      patient.id_salita_asignada
    ),
    getAllHorarios([
      patient.id_salita_asignada,
    ]),
    getClinicSpecialtyIds(
      patient.id_salita_asignada
    ),
  ]);

  // Filtra profesionales con asignaciones vigentes a la salita del paciente.
  return professionals
    .filter((p) =>
      p.salitas.some((s) =>
        s.id_salita === patient.id_salita_asignada &&
        (isDateFilter
          ? vigente(s, date!)
          : s.activo &&
            s.fecha_desde <= window.hasta &&
            (!s.fecha_hasta || s.fecha_hasta >= window.desde))
      )
    )
    .map((p) => ({
      id_profesional: p.id_profesional,
      matricula: p.matricula,
      persona: p.persona,

      // Conserva especialidades activas con agenda vigente en la salita.
      especialidades: p.especialidades
        .filter((e) => {
          if (!e.especialidad?.activo) return false;
          if (
            clinicSpecialties !== null &&
            !clinicSpecialties.includes(e.id_especialidad)
          ) {
            return false;
          }

          const espVigente = isDateFilter
            ? vigente(e, date!)
            : e.activo &&
              e.fecha_desde <= window.hasta &&
              (!e.fecha_hasta || e.fecha_hasta >= window.desde);
          if (!espVigente) return false;

          const salitaVigente = p.salitas.some((s) =>
            s.id_salita === patient.id_salita_asignada &&
            (isDateFilter
              ? vigente(s, date!)
              : s.activo &&
                s.fecha_desde <= window.hasta &&
                (!s.fecha_hasta || s.fecha_hasta >= window.desde))
          );
          if (!salitaVigente) return false;

          if (isDateFilter) {
            const targetWeekday = agendaDateTime(
              `${date!}T12:00:00-03:00`
            ).weekday;
            return schedules.some(
              (h) =>
                h.activo &&
                h.id_profesional === p.id_profesional &&
                h.id_especialidad === e.id_especialidad &&
                (!h.id_salita || h.id_salita === patient.id_salita_asignada) &&
                h.dia_semana === targetWeekday &&
                h.vigencia_desde <= date! &&
                (!h.vigencia_hasta || h.vigencia_hasta >= date!)
            );
          }

          // Para consulta general de la salita: muestra profesionales con agenda vigente
          // aunque su próximo día de atención no coincida con los días restantes de la semana actual
          return schedules.some(
            (h) =>
              h.activo &&
              h.id_profesional === p.id_profesional &&
              h.id_especialidad === e.id_especialidad &&
              (!h.id_salita || h.id_salita === patient.id_salita_asignada) &&
              h.vigencia_desde <= window.hasta &&
              (!h.vigencia_hasta || h.vigencia_hasta >= window.desde)
          );
        })
        .map((e) => ({
          id_especialidad: e.id_especialidad,
          nombre: e.especialidad.nombre,
        })),
    }))

    // Excluye profesionales sin especialidades disponibles.
    .filter(
      (p) => p.especialidades.length > 0
    );
};

// Obtiene los horarios que el paciente puede reservar.
export const getPatientAvailability = async (
  user: AuthenticatedUser,
  query: DisponibilidadQuery
) => {
  assertBookingDate(query.fecha);

  // Verifica la cobertura del paciente para la salita y fecha.
  const patient = await assertOwnCoverage(
    user,
    query.id_salita,
    query.fecha,
    query.id_paciente
  );

  await assertPatientCanBook(
    patient.id_paciente
  );

  // Impide solicitar otro turno pendiente de la misma especialidad.
  const openTurno = await findOpenTurno(
    patient.id_paciente,
    query.id_especialidad
  );
  if (openTurno) {
    const raw = openTurno as Record<string, any>;
    const fechaHora = raw.fecha_hora_inicio ? agendaDateTime(raw.fecha_hora_inicio) : null;
    const profesionalNombre = raw.profesional
      ? formatProfesionalNombre(raw.profesional)
      : undefined;

    throw new AppError(
      'Ya tenés un turno pendiente. Para solicitar otro, primero debés resolver el actual.',
      409,
      'PACIENTE_TURNO_PENDIENTE',
      {
        turno_pendiente: {
          id_turno: raw.id_turno,
          fecha: fechaHora?.date,
          hora: fechaHora?.time?.slice(0, 5),
          especialidad: raw.especialidad?.nombre,
          profesional: profesionalNombre,
          salita: raw.salita?.nombre,
          estado: raw.estado?.nombre || 'En espera',
          estado_codigo: raw.estado?.codigo || 'EN_ESPERA',
        },
      }
    );
  }

  // Valida las entidades relacionadas con el turno.
  await validateTurnoEntities(
    {
      ...query,
      id_paciente: patient.id_paciente,
      fecha_hora_inicio:
        `${query.fecha}T12:00:00-03:00`,
    },
    query.fecha
  );

  // Obtiene la disponibilidad general de la agenda.
  const result = await obtenerDisponibilidad(
    query
  );

  // Muestra solo horarios disponibles y futuros.
  // No expone reservas ajenas ni motivos de bloqueo.
  const slots = result.slots
    .filter(
      (s) =>
        s.estado === 'DISPONIBLE' &&
        Date.parse(
          `${query.fecha}T${s.hora_inicio}:00-03:00`
        ) > Date.now()
    )
    .map(
      ({
        hora_inicio,
        hora_fin,
        estado,
      }) => ({
        hora_inicio,
        hora_fin,
        estado,
      })
    );

  // Devuelve la disponibilidad visible para el paciente.
  return {
    ...result,
    slots,
    resumen: {
      total_slots: slots.length,
      disponibles: slots.length,
      ocupados: 0,
      bloqueados: 0,
    },
  };
};

// Obtiene las fechas que tienen al menos un horario realmente disponible.
export const getPatientAvailableDates = async (
  user: AuthenticatedUser,
  query: Omit<DisponibilidadQuery, 'fecha'>
) => {
  const window = bookingWindow();

  // Obtiene los profesionales disponibles para el paciente.
  const professionals = await getPatientProfessionals(
    user,
    undefined,
    query.id_paciente
  );

  // Verifica que el profesional y la especialidad estén disponibles.
  if (
    !professionals.some(
      (p) =>
        p.id_profesional === query.id_profesional &&
        p.especialidades.some(
          (s) =>
            s.id_especialidad === query.id_especialidad
        )
    )
  ) {
    throw new AppError(
      'La atención seleccionada no está disponible esta semana.',
      409
    );
  }

  // Verifica la cobertura y obtiene los horarios de la salita.
  await assertOwnCoverage(
    user,
    query.id_salita,
    window.desde,
    query.id_paciente
  );

  const schedules = await getAllHorarios([
    query.id_salita,
  ]);

  // Selecciona las fechas con horarios activos y vigentes.
  const candidates = window.fechas.filter(
    (date) =>
      schedules.some(
        (schedule) =>
          schedule.activo &&
          schedule.id_profesional ===
            query.id_profesional &&
          schedule.id_especialidad ===
            query.id_especialidad &&
          schedule.dia_semana ===
            agendaDateTime(
              `${date}T12:00:00-03:00`
            ).weekday &&
          schedule.vigencia_desde <= date &&
          (
            !schedule.vigencia_hasta ||
            schedule.vigencia_hasta >= date
          )
      )
  );

  // Consulta las fechas secuencialmente para no saturar la base de datos.
  const fechas: string[] = [];
  // Una consulta para todo el período; solo etiquetas públicas salen de este servicio.
  const cierres = await findCierres([query.id_salita], window.desde, window.hasta, true);
  const dias = window.fechas.map(fecha => {
    const aplicables = cierres.filter(c => c.fecha_inicio <= fecha && c.fecha_fin >= fecha);
    const completo = aplicables.find(c => c.dia_completo);
    const etiqueta = completo ?? aplicables[0];
    return { fecha, disponible: false,
      estado: completo ? 'CERRADO' : candidates.includes(fecha) ? 'SIN_CUPOS' : 'SIN_HORARIO',
      cierre: etiqueta ? cierreEtiqueta(etiqueta) : null,
      franjas_cerradas: completo ? ['Todo el día'] : [...new Set(aplicables.map(c => `${c.hora_inicio!.slice(0, 5)}–${c.hora_fin!.slice(0, 5)}`))],
    };
  });

  for (const fecha of candidates) {
    const dia = dias.find(d => d.fecha === fecha)!;
    if (dia.estado === 'CERRADO') continue;
    try {
      // Reutiliza las validaciones de cobertura, sanciones y turnos abiertos.
      const result = await getPatientAvailability(
        user,
        {
          ...query,
          fecha,
        }
      );

      if (result.slots.length) {
        fechas.push(fecha);
        dia.disponible = true;
        dia.estado = 'DISPONIBLE';
      } else if (result.sin_horarios_por_cierre) {
        dia.estado = 'CERRADO';
      }
    } catch (error) {
      // Omite asociaciones vencidas sin ocultar errores de permisos o infraestructura.
      if (
        error instanceof AppError &&
        error.statusCode === 400 &&
        (!error.code || error.code === 'TUTORSHIP_DATE_EXPIRED')
      ) {
        continue;
      }

      throw error;
    }
  }

  const DIAS_SEMANA_NOMBRES = [
    '',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
    'domingo',
  ];

  const profSchedules = schedules.filter(
    (s) =>
      s.activo &&
      s.id_profesional === query.id_profesional &&
      s.id_especialidad === query.id_especialidad &&
      (!s.id_salita || s.id_salita === query.id_salita) &&
      s.vigencia_desde <= window.hasta &&
      (!s.vigencia_hasta || s.vigencia_hasta >= window.desde)
  );

  const diasAtencion = [
    ...new Set(profSchedules.map((s) => s.dia_semana)),
  ].sort((a, b) => a - b);

  let proxima_disponibilidad: {
    dias_atencion: number[];
    dias_atencion_nombres: string[];
    proxima_fecha?: string;
    proxima_apertura: string;
    mensaje: string;
  } | null = null;

  if (!fechas.length && profSchedules.length > 0) {
    const nombresDias = diasAtencion
      .map((d) => DIAS_SEMANA_NOMBRES[d])
      .filter(Boolean)
      .join(', ');

    let proximaFecha: string | undefined;
    for (let offset = 1; offset <= 14; offset++) {
      const candidateDate = new Date(
        Date.parse(`${window.desde}T12:00:00Z`) + offset * 86400000
      )
        .toISOString()
        .slice(0, 10);
      const dow = agendaDateTime(`${candidateDate}T12:00:00-03:00`).weekday;
      if (diasAtencion.includes(dow)) {
        proximaFecha = candidateDate;
        break;
      }
    }

    const horaApertura = window.proxima_apertura.slice(11, 16);
    const mensaje = nombresDias
      ? `El profesional atiende habitualmente los días ${nombresDias}. Los turnos de la próxima semana se habilitan el sábado a las ${horaApertura} hs.`
      : `No quedan turnos disponibles en el período habilitado. La próxima semana se habilitará el sábado a las ${horaApertura} hs.`;

    proxima_disponibilidad = {
      dias_atencion: diasAtencion,
      dias_atencion_nombres: diasAtencion.map((d) => DIAS_SEMANA_NOMBRES[d] || ''),
      ...(proximaFecha ? { proxima_fecha: proximaFecha } : {}),
      proxima_apertura: window.proxima_apertura,
      mensaje,
    };
  }

  return {
    fechas,
    dias,
    ventana: window,
    proxima_disponibilidad,
  };
};
