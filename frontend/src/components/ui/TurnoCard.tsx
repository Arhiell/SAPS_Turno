import type {
  Turno,
} from '../../types/turno.types';

import {
  getEstadoClass,
} from '../../utils/turno-status';

import {
  Link,
} from 'react-router-dom';

import CancelAppointment from './CancelAppointment';

export default function TurnoCard({
  turno,
  patient = false,
  onChanged,
  detail = false,
}: {
  turno: Turno;
  patient?: boolean;
  onChanged?: () => void;
  detail?: boolean;
}) {
  // Define qué persona mostrar según
  // si la tarjeta pertenece al paciente.
  const person = patient
    ? turno.profesional?.persona
    : turno.paciente?.persona;

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <article className="turno-preview">
      {/* Fecha, hora y estado del turno. */}
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <time dateTime={turno.fecha_hora_inicio}>
          {new Date(
            turno.fecha_hora_inicio
          ).toLocaleString(
            'es-AR',
            {
              timeZone:
                'America/Argentina/Buenos_Aires',
              dateStyle: 'medium',
              timeStyle: 'short',
            }
          )}
        </time>

        <span
          className={getEstadoClass(
            turno.estado.codigo
          )}
        >
          {turno.estado.nombre}
        </span>
      </div>

      {/* Profesional para el paciente
          o paciente para administración/profesional. */}
      <h3 className="h6 mt-3">
        {patient
          ? 'Profesional: '
          : ''}

        {person
          ? `${person.apellidos} ${person.nombres}`
          : 'Sin informar'}
      </h3>

      {/* DNI visible fuera de la vista del paciente. */}
      {!patient && (
        <p className="small mb-2">
          DNI{' '}
          {turno.paciente?.persona?.dni ||
            'Sin informar'}
        </p>
      )}

      {/* Especialidad y salita del turno. */}
      <p className="text-muted mb-0">
        {turno.especialidad?.nombre ||
          'Especialidad sin informar'}
        {' · '}
        {turno.salita?.nombre ||
          'Salita sin informar'}
      </p>

      {/* Dirección de la salita para el paciente. */}
      {patient &&
        turno.salita?.direccion && (
          <p className="small mt-2 mb-0">
            {turno.salita.direccion}
          </p>
        )}

      {/* Información y acciones disponibles
          para el paciente. */}
      {patient && (
        <>
          <p className="small mt-2 mb-1">
            Código: {turno.codigo_turno}
          </p>

          <p className="small">
            Motivo:{' '}
            {turno.motivo_consulta ||
              'Sin informar'}
          </p>

          <div className="d-flex flex-wrap gap-2 mt-3">
            {/* Evita mostrar el enlace cuando
                ya estamos viendo el detalle. */}
            {!detail && (
              <Link
                className="btn btn-outline-success"
                to={`/mis-turnos/${turno.id_turno}`}
              >
                Ver detalle
              </Link>
            )}

            {/* Permite cancelar el turno
                cuando su estado lo permite. */}
            <CancelAppointment
              turno={turno}
              onCancelled={onChanged}
            />
          </div>
        </>
      )}
    </article>
  );
}