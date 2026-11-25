import React, { useState } from 'react';
import { rectificarInasistencia } from '../../services/inasistencias.service';

interface RectificarInasistenciaModalProps {
  idTurno: string;
  codigoTurno?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RectificarInasistenciaModal: React.FC<RectificarInasistenciaModalProps> = ({
  idTurno,
  codigoTurno,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5) {
      setError('Debe especificar un motivo de rectificación de al menos 5 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await rectificarInasistencia(idTurno, {
        nuevo_estado: 'ATENDIDO',
        motivo_rectificacion: motivo.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'No se pudo rectificar la inasistencia. Intente nuevamente.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light">
            <h2 className="modal-title h5 mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-arrow-counterclockwise text-primary" aria-hidden="true" />
              <span>Rectificar inasistencia errónea</span>
            </h2>
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              disabled={submitting}
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="alert alert-warning py-2 px-3 small mb-3">
                <i className="bi bi-shield-exclamation me-1" aria-hidden="true" />
                Esta acción auditable modificará el turno{' '}
                {codigoTurno ? <strong>({codigoTurno})</strong> : ''} de <strong>NO_ASISTIO</strong> a{' '}
                <strong>ATENDIDO</strong>, anulará automáticamente cualquier advertencia vinculada y
                reajustará el historial del paciente.
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="rectificar-motivo" className="form-label fw-semibold small">
                  Motivo de la rectificación <span className="text-danger">*</span>
                </label>
                <textarea
                  id="rectificar-motivo"
                  className="form-control"
                  rows={4}
                  placeholder="Detalle la causa de la rectificación (ej.: El paciente estuvo en sala y fue atendido tras retraso en recepción)..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={submitting}
                  required
                />
                <div className="form-text small">
                  El motivo quedará asentado en el historial de auditoría de CORA.
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={submitting}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                disabled={submitting || motivo.trim().length < 5}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    <span>Rectificando…</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle" aria-hidden="true" />
                    <span>Confirmar rectificación</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RectificarInasistenciaModal;
