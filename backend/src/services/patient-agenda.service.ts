import { getClinicSpecialtyIds } from './configuracion.service.js';
import {
  findPatientProfessionals,
} from '../repositories/patient-agenda.repository.js';

import {
  getAllHorarios,
} from '../repositories/horario-atencion.repository.js';

import {
  assertOwnCoverage,
  getOwnPatient,
} from './patient-coverage.service.js';

import {
  validateTurnoEntities,
} from './turno-entities.service.js';

import {
  obtenerDisponibilidad,
} from './disponibilidad.service.js';

import type {
  AuthenticatedUser,
} from '../types/auth.types.js';

import type {
  DisponibilidadQuery,
} from '../validators/disponibilidad.validator.js';

import {
  agendaDateTime,
} from '../utils/turno-time.js';

// Verifica que una asignación esté activa
// y vigente para la fecha indicada.
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
  (
    !row.fecha_hasta ||
    row.fecha_hasta >= date
  );

// ========================================
// PROFESIONALES DISPONIBLES PARA EL PACIENTE
// ========================================

// Obtiene profesionales y especialidades disponibles
// según la salita y cobertura del paciente.
export const getPatientProfessionals = async (
  user: AuthenticatedUser,
  date: string
) => {
  // Obtiene el paciente asociado al usuario autenticado.
  const patient = await getOwnPatient(
    user
  );

  // Verifica la cobertura del paciente para la fecha.
  await assertOwnCoverage(
    user,
    patient.id_salita_asignada,
    date
  );

  // Obtiene profesionales y horarios de la salita.
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
    getClinicSpecialtyIds(patient.id_salita_asignada),
  ]);

  // Obtiene el día de la semana correspondiente.
  const weekday = agendaDateTime(
    `${date}T12:00:00-03:00`
  ).weekday;

  // Filtra profesionales con asignación vigente.
  return professionals
    .filter(
      (p) =>
        p.salitas.some(
          (s) => vigente(s, date)
        )
    )
    .map((p) => ({
      id_profesional: p.id_profesional,
      matricula: p.matricula,
      persona: p.persona,

      // Conserva especialidades activas, vigentes
      // y con horarios disponibles para ese día.
      especialidades: p.especialidades
        .filter(
          (e) =>
            e.especialidad?.activo &&
            (clinicSpecialties === null || clinicSpecialties.includes(e.id_especialidad)) &&
            vigente(e, date) &&
            schedules.some(
              (h) =>
                h.activo &&
                h.id_profesional ===
                  p.id_profesional &&
                h.id_especialidad ===
                  e.id_especialidad &&
                h.dia_semana === weekday &&
                h.vigencia_desde <= date &&
                (
                  !h.vigencia_hasta ||
                  h.vigencia_hasta >= date
                )
            )
        )
        .map((e) => ({
          id_especialidad:
            e.id_especialidad,
          nombre:
            e.especialidad.nombre,
        })),
    }))
    // Excluye profesionales sin especialidades disponibles.
    .filter(
      (p) =>
        p.especialidades.length > 0
    );
};

// ========================================
// DISPONIBILIDAD PARA EL PACIENTE
// ========================================

// Obtiene únicamente los horarios que el paciente
// puede utilizar para solicitar un turno.
export const getPatientAvailability = async (
  user: AuthenticatedUser,
  query: DisponibilidadQuery
) => {
  // Verifica que el paciente tenga cobertura
  // para la salita y fecha solicitadas.
  const patient = await assertOwnCoverage(
    user,
    query.id_salita,
    query.fecha
  );

  // Valida paciente, profesional, especialidad
  // y demás entidades relacionadas con el turno.
  await validateTurnoEntities(
    {
      ...query,
      id_paciente:
        patient.id_paciente,
      fecha_hora_inicio:
        `${query.fecha}T12:00:00-03:00`,
    },
    query.fecha
  );

  // Obtiene la disponibilidad general de la agenda.
  const result =
    await obtenerDisponibilidad(
      query
    );

  // No expone identificadores de reservas ajenas
  // ni motivos de bloqueo.
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

  // Devuelve únicamente la disponibilidad
  // que puede visualizar el paciente.
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
