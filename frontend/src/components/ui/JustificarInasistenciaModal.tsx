import React, { useState } from 'react';
import { crearJustificacion } from '../../services/inasistencias.service';

interface JustificarInasistenciaModalProps {
  idTurno: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MOTIVOS_SUGERIDOS = [
  'Problemas de salud',
  'Emergencias familiares',
  'Problemas graves de traslado',
  'Accidentes u otras situaciones de fuerza mayor',
  'Otros motivos excepcionales',
] as const;

export const JustificarInasistenciaModal: React.FC<JustificarInasistenciaModalProps> = ({
  idTurno,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [tipoMotivo, setTipoMotivo] = useState<string>('');
  const [explicacion, setExplicacion] = useState('');
  const [documentacionRef, setDocumentacionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const motivoFinal = tipoMotivo
      ? explicacion.trim().startsWith(`[${tipoMotivo}]`)
        ? explicacion.trim()
        : `[${tipoMotivo}] ${explicacion.trim()}`
      : explicacion.trim();

    if (motivoFinal.length < 5) {
      setError('Por favor explicá el motivo con al menos 5 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await crearJustificacion({
        id_turno: idTurno,
        motivo: motivoFinal,
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
              <i className="bi bi-file-earmark-text text-primary" aria-hidden="true" />
              <span>Solicitar justificación de inasistencia</span>
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
                Tu solicitud quedará <strong>PENDIENTE</strong> hasta que el personal autorizado de tu salita la evalúe.
                Si es aprobada, la falta se excluirá de tus antecedentes y se levantará cualquier advertencia vinculada.
              </div>

              {error && (
                <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="justificacion-tipo" className="form-label fw-semibold small">
                  Tipo de situación (opcional)
                </label>
                <select
                  id="justificacion-tipo"
                  className="form-select form-select-sm"
                  value={tipoMotivo}
                  onChange={(e) => setTipoMotivo(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Seleccioná un tipo o motivo general...</option>
                  {MOTIVOS_SUGERIDOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="justificacion-motivo" className="form-label fw-semibold small">
                  Explicación de lo sucedido <span className="text-danger">*</span>
                </label>
                <textarea
                  id="justificacion-motivo"
                  className="form-control"
                  rows={4}
                  placeholder="Explicá lo sucedido que te impidió asistir (ej.: problemas de salud, emergencias familiares, traslados, etc.)..."
                  value={explicacion}
                  onChange={(e) => setExplicacion(e.target.value)}
                  disabled={submitting}
                  required
                />
                <div className="form-text small">Mínimo 5 caracteres.</div>
              </div>

              <div className="mb-3">
                <label htmlFor="justificacion-doc" className="form-label fw-semibold small">
                  Documentación respaldatoria (opcional)
                </label>
                <input
                  type="text"
                  id="justificacion-doc"
                  className="form-control"
                  placeholder="Ej.: Constancia médica, certificado policial, comprobante de traslado, etc."
                  value={documentacionRef}
                  onChange={(e) => setDocumentacionRef(e.target.value)}
                  disabled={submitting}
                />
                <div className="form-text small">
                  No es obligatorio presentar certificado médico. Podés adjuntar la referencia o presentar documentación respaldatoria física en tu salita si corresponde.
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
                disabled={submitting || explicacion.trim().length < 5}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                    <span>Enviando…</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-send" aria-hidden="true" />
                    <span>Enviar solicitud</span>
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
