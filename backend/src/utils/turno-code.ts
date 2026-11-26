import { randomUUID } from 'node:crypto';

export const generateTurnoCode = () =>
  `T-${randomUUID().replaceAll('-', '').slice(0, 28)}`;

export const isTurnoCodeConflict = (error: { code?: string; message?: string }) =>
  error.code === '23505' && /turnos_codigo_turno_key/.test(error.message ?? '');
