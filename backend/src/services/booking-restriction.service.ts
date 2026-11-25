import { findTurnoSanction } from '../repositories/turno-agenda.repository.js';

import { AppError } from '../utils/app-error.js';

/**
 * Roles institucionales autorizados para gestionar reservas asistenciales en ventanilla,
 * derivaciones médicas o sobreturnos de urgencia sin ser bloqueados por sanciones web del paciente.
 */
export const ROLES_BYPASS_ASISTENCIAL = [
  'SUPER_ADMIN',
  'ADMIN_SALITA',
  'RECEPCION',
  'PROFESIONAL',
] as const;

export type BypassRole = (typeof ROLES_BYPASS_ASISTENCIAL)[number];

/**
 * Determina de forma estricta si el rol del usuario autenticado cuenta con autorización
 * para bypass asistencial presencial/urgencias.
 * Cualquier rol ajeno o no autorizado (ej. PACIENTE, roles desconocidos o nulos) retorna false.
 */
export const canBypassOnlineSanction = (rol?: string | null): boolean => {
  if (!rol || typeof rol !== 'string') return false;
  return (ROLES_BYPASS_ASISTENCIAL as readonly string[]).includes(rol);
};

// Verifica que el paciente no tenga sanciones vigentes para solicitar turnos.
export const assertPatientCanBook = async (
  patient: string
) => {
  // Consulta si existe una sanción activa.
  const sanction = await findTurnoSanction(patient);

  // Impide reservar turnos mientras la sanción esté vigente.
  if (sanction) {
    throw new AppError(
      'Tenés una sanción vigente. No podés solicitar turnos de ninguna especialidad hasta que finalice.',
      409,
      'PATIENT_SANCTIONED',
      {
        motivo: sanction.motivo,
        fecha_inicio: sanction.fecha_inicio,
        fecha_fin: sanction.fecha_fin,
      }
    );
  }
};