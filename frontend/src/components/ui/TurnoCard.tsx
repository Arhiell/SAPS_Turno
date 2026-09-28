import type { Turno } from '../../types/turno.types';
import { getEstadoClass } from '../../utils/turno-status';

export default function TurnoCard({ turno, patient = false }: { turno: Turno; patient?: boolean }) {
  const person = patient ? turno.profesional?.persona : turno.paciente?.persona;
  return <article className="turno-preview">
    <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
      <time dateTime={turno.fecha_hora_inicio}>{new Date(turno.fecha_hora_inicio).toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires', dateStyle: 'medium', timeStyle: 'short',
      })}</time>
      <span className={getEstadoClass(turno.estado.codigo)}>{turno.estado.nombre}</span>
    </div>
    <h3 className="h6 mt-3">{patient ? 'Profesional: ' : ''}{person ? `${person.apellidos} ${person.nombres}` : 'Sin informar'}</h3>
    {!patient && <p className="small mb-2">DNI {turno.paciente?.persona?.dni || 'Sin informar'}</p>}
    <p className="text-muted mb-0">{turno.especialidad?.nombre || 'Especialidad sin informar'} · {turno.salita?.nombre || 'Salita sin informar'}</p>
    {patient && turno.salita?.direccion && <p className="small mt-2 mb-0">{turno.salita.direccion}</p>}
  </article>;
}
