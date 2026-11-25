import React, { useEffect, useState } from 'react';
import {
  listarJustificaciones,
  evaluarJustificacion,
  type JustificacionInasistencia,
} from '../../services/inasistencias.service';
import { formatFechaHora } from '../../utils/agenda-display';

interface TurnoJustificacionCardProps {
  idTurno: string;
  isStaff?: boolean;
  onUpdated?: () => void;
}

export const TurnoJustificacionCard: React.FC<TurnoJustificacionCardProps> = ({
  idTurno,
  isStaff = false,
  onUpdated,
}) => {
  const [justificacion, setJustificacion] = useState<JustificacionInasistencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [motivoResolucion, setMotivoResolucion] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [error, setError] = useState('');

  const loadJustificacion = () => {
    setLoading(true);
    listarJustificaciones({ page: 1, limit: 100 })
      .then((res) => {
        const match = res.data.find((j) => j.id_turno === idTurno);
        setJustificacion(match || null);
      })
      .catch(() => {
        setJustificacion(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadJustificacion();
  }, [idTurno]);

  if (loading) return null;
  if (!justificacion) return null;

  const handleDecision = async (decision: 'APROBADA' | 'RECHAZADA') => {
    if (decision === 'RECHAZADA' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (decision === 'RECHAZADA' && motivoResolucion.trim().length < 3) {
      setError('Por favor indique el motivo del rechazo (mínimo 3 caracteres).');
      return;
    }

    try {
      setEvaluating(true);
      setError('');
      await evaluarJustificacion(justificacion.id_justificacion, {
        estado: decision,
        motivo_resolucion: motivoResolucion.trim() || undefined,
      });
      loadJustificacion();
      onUpdated?.();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al evaluar la justificación');
    } finally {
      setEvaluating(false);
      setShowRejectInput(false);
    }
  };

  const getStatusBadge = () => {
    switch (justificacion.estado) {
      case 'APROBADA':
        return <span className="badge bg-success">Justificación Aprobada</span>;
      case 'RECHAZADA':
        return <span className="badge bg-danger">Justificación Rechazada</span>;
      default:
        return <span className="badge bg-warning text-dark">Justificación Pendiente de Evaluación</span>;
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-3">
      <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
        <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
          <i className="bi bi-file-earmark-medical text-primary" aria-hidden="true" />
          Justificación médica de inasistencia
        </h6>
        {getStatusBadge()}
      </div>

      <div className="card-body p-3">
        {error && (
          <div className="alert alert-danger py-2 px-3 small mb-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="mb-2">
          <span className="text-secondary small fw-bold text-uppercase d-block" style={{ fontSize: '0.73rem' }}>
            Motivo presentado por el paciente
          </span>
          <p className="mb-1 text-dark fw-medium">{justificacion.motivo}</p>
        </div>

        {justificacion.documentacion_ref && (
          <div className="mb-2">
            <span className="text-secondary small fw-bold text-uppercase d-block" style={{ fontSize: '0.73rem' }}>
              Referencia documental
            </span>
            <p className="mb-1 text-secondary small">{justificacion.documentacion_ref}</p>
          </div>
        )}

        {justificacion.estado !== 'PENDIENTE' && (
          <div className="p-2 rounded bg-light border mt-2 small">
            <div>
              <strong>Resolución:</strong>{' '}
              {justificacion.estado === 'APROBADA' ? 'Falta médica justificada y excluida.' : 'Falta no justificada.'}
            </div>
            {justificacion.motivo_resolucion && (
              <div>
                <strong>Observaciones de la salita:</strong> {justificacion.motivo_resolucion}
              </div>
            )}
            {justificacion.fecha_evaluacion && (
              <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                Evaluado el {formatFechaHora(justificacion.fecha_evaluacion)} hs
              </div>
            )}
          </div>
        )}

        {isStaff && justificacion.estado === 'PENDIENTE' && (
          <div className="mt-3 pt-2 border-top">
            <span className="text-secondary small fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.73rem' }}>
              Dictamen administrativo de la salita
            </span>

            {showRejectInput && (
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Indique motivo del rechazo (ej.: certificado ilegible o fuera de término)..."
                  value={motivoResolucion}
                  onChange={(e) => setMotivoResolucion(e.target.value)}
                  disabled={evaluating}
                />
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                disabled={evaluating}
                onClick={() => handleDecision('APROBADA')}
              >
                <i className="bi bi-check-lg" aria-hidden="true" />
                <span>Aprobar justificación</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                disabled={evaluating}
                onClick={() => handleDecision('RECHAZADA')}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
                <span>{showRejectInput ? 'Confirmar rechazo' : 'Rechazar justificación'}</span>
              </button>
              {showRejectInput && (
                <button
                  type="button"
                  className="btn btn-sm btn-light"
                  disabled={evaluating}
                  onClick={() => setShowRejectInput(false)}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnoJustificacionCard;
