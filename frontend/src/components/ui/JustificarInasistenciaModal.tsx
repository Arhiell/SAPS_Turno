import React, { useState } from 'react';
import { crearJustificacion } from '../../services/inasistencias.service';

interface JustificarInasistenciaModalProps {
  idTurno: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JustificarInasistenciaModal: React.FC<JustificarInasistenciaModalProps> = ({
  idTurno,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [motivo, setMotivo] = useState('');
  const [documentacionRef, setDocumentacionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 5) {
      setError('El motivo debe tener al menos 5 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await crearJustificacion({
        id_turno: idTurno,
        motivo: motivo.trim(),
        documentacion_ref: documentacionRef.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'No se pudo enviar la justificación. Intentalo nuevamente.';
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
              <i className="bi bi-file-earmark-medical text-success" aria-hidden="true" />
              <span>Justificar inasistencia al turno</span>
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
              <div className="alert alert-info py-2 px-3 small mb-3">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                Tu justificación será evaluada por el equipo de tu salita. Si es aprobada, la falta se
                excluirá de tus antecedentes y se levantará cualquier advertencia vinculada.
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="justificacion-motivo" className="form-label fw-semibold small">
                  Motivo de la inasistencia <span className="text-danger">*</span>
                </label>
                <textarea
                  id="justificacion-motivo"
                  className="form-control"
                  rows={4}
                  placeholder="Explicá brevemente por qué no pudiste concurrir (ej.: reposo médico, atención en guardia, fuerza mayor)..."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  disabled={submitting}
                  required
                />
                <div className="form-text small">Mínimo 5 caracteres.</div>
              </div>

              <div className="mb-3">
                <label htmlFor="justificacion-doc" className="form-label fw-semibold small">
                  Referencia documental (opcional)
                </label>
                <input
                  type="text"
                  id="justificacion-doc"
                  className="form-control"
                  placeholder="Ej.: Certificado médico guardia Dr. Pérez / Protocolo N° 458"
                  value={documentacionRef}
                  onChange={(e) => setDocumentacionRef(e.target.value)}
                  disabled={submitting}
                />
                <div className="form-text small">
                  Podés acercar la constancia física a tu salita para facilitar la validación.
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
                className="btn btn-success d-inline-flex align-items-center gap-2"
                disabled={submitting || motivo.trim().length < 5}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send" aria-hidden="true" />
                    <span>Enviar justificación</span>
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

export default JustificarInasistenciaModal;
