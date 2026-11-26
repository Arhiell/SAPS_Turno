import type { AffectedTurno, AgendaProposal } from '../../services/agenda-impacto.service';
import { agendaDateTime } from '../../utils/agenda-display';
import { formatProfesionalName } from '../../utils/profesional-format';

interface Props {
  turnos: AffectedTurno[];
  propuestas: AgendaProposal[];
}

export default function AgendaReview({ turnos, propuestas }: Props) {
  const getDurationMin = (inicio: string, fin: string) => {
    const diff = Date.parse(fin) - Date.parse(inicio);
    return Math.max(1, Math.round(diff / 60000));
  };

  return (
    <div className="d-flex flex-column gap-3">
      {turnos.map((t) => {
        const propuesta = propuestas.find((p) => p.id_turno === t.id_turno);
        const destino = propuesta?.destino;
        const duracionOriginal = getDurationMin(t.fecha_hora_inicio, t.fecha_hora_fin);
        const duracionNueva = destino ? getDurationMin(destino.fecha_hora_inicio, destino.fecha_hora_fin) : null;

        return (
          <div
            key={t.id_turno}
            className={`border rounded p-3 ${
              destino ? 'bg-white border-success-subtle shadow-sm' : 'bg-light border-warning-subtle'
            }`}
          >
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
              <div>
                <h6 className="mb-0 fw-bold text-dark">
                  <i className="bi bi-person me-1 text-primary" />
                  {t.paciente.persona.apellidos}, {t.paciente.persona.nombres}
                  {t.paciente.persona.dni && (
                    <span className="badge text-bg-light border ms-2 text-muted fw-normal">
                      DNI: {t.paciente.persona.dni}
                    </span>
                  )}
                </h6>
                <div className="small text-muted mt-1">
                  <i className="bi bi-hospital me-1" />
                  {t.salita.nombre} · {t.especialidad.nombre} · {formatProfesionalName(t.profesional)}
                </div>
              </div>

              <div>
                {destino ? (
                  <span className="badge text-bg-success d-inline-flex align-items-center gap-1">
                    <i className="bi bi-arrow-repeat" />
                    Reprogramación lista
                  </span>
                ) : (
                  <span className="badge text-bg-warning d-inline-flex align-items-center gap-1">
                    <i className="bi bi-clock-history" />
                    Queda pendiente
                  </span>
                )}
              </div>
            </div>

            <div className="row g-2 mt-2 pt-2 border-top">
              <div className="col-sm-6">
                <span className="text-muted small d-block mb-1">
                  <i className="bi bi-calendar-x me-1 text-danger" />
                  Turno original afectado
                </span>
                <div className="fw-semibold text-danger">
                  {agendaDateTime(t.fecha_hora_inicio)}
                </div>
                <small className="text-muted">
                  Duración: {duracionOriginal} minutos · Estado: {t.estado.nombre}
                </small>
              </div>

              <div className="col-sm-6">
                <span className="text-muted small d-block mb-1">
                  <i className="bi bi-calendar-check me-1 text-success" />
                  Nuevo horario asignado
                </span>
                {destino ? (
                  <>
                    <div className="fw-bold text-success">
                      {agendaDateTime(destino.fecha_hora_inicio)}
                    </div>
                    <small className="text-muted">
                      Duración: {duracionNueva} minutos · Listo para confirmar
                    </small>
                  </>
                ) : (
                  <div className="text-muted fst-italic small mt-1">
                    Sin nuevo horario asignado. El turno permanecerá en estado afectado para su resolución posterior.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
