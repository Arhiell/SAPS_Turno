// El UUID sigue siendo una alternativa para respuestas que solo incluyen el ID.
type TurnoReference = { id_turno: string; codigo_turno?: string; codigo_url?: string };

export const turnoReference = (turno: TurnoReference) =>
  turno.codigo_url || turno.codigo_turno || turno.id_turno;

export const turnoLink = (
  turno: TurnoReference,
  patient = false,
) => `${patient ? '/mis-turnos' : '/turnos'}/${encodeURIComponent(turnoReference(turno))}`;
