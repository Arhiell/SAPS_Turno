import React, { useEffect, useState } from 'react';
import {
  getEstadoInasistencias,
  type EstadoInasistenciasPaciente,
} from '../../services/inasistencias.service';
import { formatFechaHora } from '../../utils/agenda-display';

interface InasistenciaStatusBannerProps {
  idPaciente?: string | null;
  refreshKey?: number;
  className?: string;
}

export const InasistenciaStatusBanner: React.FC<InasistenciaStatusBannerProps> = ({
  idPaciente,
  refreshKey = 0,
  className = '',
}) => {
  const [estado, setEstado] = useState<EstadoInasistenciasPaciente | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idPaciente) {
      setEstado(null);
      return;
    }

    let active = true;
    setLoading(true);

    getEstadoInasistencias(idPaciente)
      .then((data) => {
        if (active) setEstado(data);
      })
      .catch(() => {
        // En caso de error de red o permisos, no bloquear la vista
        if (active) setEstado(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [idPaciente, refreshKey]);

  if (loading || !estado) return null;

  // 1. Caso crítico: Restricción activa (3 o más inasistencias)
  if (!estado.puede_reservar_online && estado.sancion_vigente) {
    const finFormatted = formatFechaHora(estado.sancion_vigente.fecha_fin);

    return (
      <div
        className={`alert alert-danger border-danger shadow-sm p-3 p-md-4 rounded-3 mb-4 ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="d-flex align-items-start gap-3">
          <div className="text-danger fs-3 flex-shrink-0" aria-hidden="true">
            <i className="bi bi-shield-slash-fill" />
          </div>
          <div className="flex-grow-1">
            <h3 className="h6 fw-bold text-danger mb-1 d-flex align-items-center gap-2">
              <span>Restricción temporal de reservas online activa</span>
              <span className="badge bg-danger text-white">7 días corridos</span>
            </h3>
            <p className="small mb-2 text-dark">
              Tu cuenta tiene temporalmente inhabilitada la solicitud de nuevos turnos online debido a la
              acumulación de <strong>{estado.conteo_faltas_activas} inasistencias injustificadas</strong> en los
              últimos {estado.ventana_dias} días.
            </p>
            <div className="bg-white p-2 px-3 rounded border border-danger-subtle small mb-2 text-secondary">
              <div>
                <strong>Restricción vigente hasta:</strong> {finFormatted} hs
              </div>
              <div>
                <strong>Motivo:</strong> {estado.sancion_vigente.motivo}
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 p-2 rounded bg-danger-subtle text-danger-emphasis small fw-medium">
              <i className="bi bi-hospital fs-5 flex-shrink-0" aria-hidden="true" />
              <span>
                <strong>Atención presencial garantizada:</strong> Esta restricción aplica exclusivamente al
                portal web. Podés concurrir personalmente a tu salita o consultar por guardia en cualquier
                momento.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Caso formal: 2ª Falta (Advertencia formal, 1 falta más disparará sanción)
  if (estado.conteo_faltas_activas === 2) {
    return (
      <div
        className={`alert alert-warning border-warning shadow-sm p-3 rounded-3 mb-4 ${className}`}
        role="alert"
      >
        <div className="d-flex align-items-start gap-3">
          <div className="text-warning-emphasis fs-4 flex-shrink-0" aria-hidden="true">
            <i className="bi bi-exclamation-triangle-fill" />
          </div>
          <div className="flex-grow-1">
            <h3 className="h6 fw-bold text-warning-emphasis mb-1">
              Advertencia formal por inasistencias (2/3)
            </h3>
            <p className="small mb-2 text-dark">
              Registrás <strong>2 inasistencias injustificadas</strong> a turnos médicos en los últimos{' '}
              {estado.ventana_dias} días. Si acumulás una tercera falta injustificada, no podrás realizar nuevas
              reservas online por 7 días.
            </p>
            <p className="small mb-0 text-muted">
              Si tuviste un motivo justificado (reposo médico, guardia o fuerza mayor), podés presentar tu
              justificación ingresando al detalle del turno en la sección <strong>Mis turnos</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Caso informativo: 1ª Falta (Advertencia informativa y preventiva)
  if (estado.conteo_faltas_activas === 1) {
    return (
      <div
        className={`alert alert-info border-info-subtle shadow-sm p-3 rounded-3 mb-4 ${className}`}
        role="status"
      >
        <div className="d-flex align-items-start gap-3">
          <div className="text-info-emphasis fs-4 flex-shrink-0" aria-hidden="true">
            <i className="bi bi-info-circle-fill" />
          </div>
          <div className="flex-grow-1">
            <h3 className="h6 fw-bold text-info-emphasis mb-1">
              Aviso sobre inasistencia (1/3)
            </h3>
            <p className="small mb-0 text-dark">
              Registramos que no concurriste a un turno programado en los últimos {estado.ventana_dias} días. Te
              recordamos cancelar tus turnos con anticipación si no podés asistir para que otra persona pueda
              aprovechar el lugar. Podés justificar la inasistencia desde el detalle del turno si contás con
              certificado médico.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InasistenciaStatusBanner;
