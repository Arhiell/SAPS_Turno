import { useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import { changeTurnoStatus } from '../../services/turnos.service';
import type { Turno } from '../../types/turno.types';
import { authError } from '../../utils/auth-errors';
import { formatFechaHora } from '../../utils/agenda-display';

export default function CancelAppointment({
  turno,
  onCancelled,
  compact = false,
}: {
  turno: Turno;
  onCancelled?: () => void;
  compact?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const confirmCancel = async () => {
    if (busy) return;
    setBusy(true);
    setError('');

    try {
      await changeTurnoStatus(turno.id_turno, {
        estado: 'CANCELADO',
        motivo_cancelacion: reason.trim() || 'Cancelado por el paciente',
      });
      setDone(true);
      setConfirmOpen(false);
      onCancelled?.();
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // RESULTADO DE LA CANCELACIÓN
  // ========================================

  if (done) {
    return (
      <span role="status" className="text-success small fw-medium d-inline-flex align-items-center gap-1">
        <i className="bi bi-check-circle" aria-hidden="true" />
        <span>Turno cancelado</span>
      </span>
    );
  }

  // No permite cancelar turnos finalizados ni turnos cuya fecha ya pasó.
  if (
    turno.estado.es_estado_final ||
    Date.parse(turno.fecha_hora_inicio) <= Date.now()
  ) {
    return null;
  }

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <>
      <ConfirmationModal
        open={confirmOpen}
        title="Cancelar turno"
        subtitle="Esta acción liberará el horario inmediatamente para que otra persona pueda solicitarlo."
        message="¿Estás seguro de que querés cancelar este turno?"
        detail={
          <div>
            <div className="fw-semibold text-dark">
              {turno.especialidad?.nombre || 'Consulta médica'}
            </div>
            <div className="text-secondary small mt-1">
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />
              {turno.salita?.nombre || 'Salita asignada'}
            </div>
            <div className="text-secondary small">
              <i className="bi bi-calendar3 me-1" aria-hidden="true" />
              {formatFechaHora(turno.fecha_hora_inicio)} hs
            </div>

            <div className="mt-3">
              <label
                className="form-label small fw-semibold text-secondary w-100 mb-1"
                htmlFor={`cancel-motivo-${turno.id_turno}`}
              >
                Motivo de la cancelación (opcional)
              </label>
              <textarea
                id={`cancel-motivo-${turno.id_turno}`}
                className="form-control form-control-sm"
                rows={2}
                maxLength={500}
                placeholder="Podés indicar brevemente el motivo..."
                value={reason}
                disabled={busy}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 small mt-2 mb-0" role="alert">
                {error}
              </div>
            )}
          </div>
        }
        confirmText="Sí, cancelar turno"
        cancelText="Conservar turno"
        variant="danger"
        icon="bi-x-circle"
        loading={busy}
        onClose={() => {
          if (!busy) {
            setError('');
            setConfirmOpen(false);
          }
        }}
        onConfirm={() => void confirmCancel()}
      />

      <button
        type="button"
        className={`btn btn-outline-danger d-inline-flex align-items-center justify-content-center gap-1 text-nowrap ${
          compact ? 'btn-sm' : ''
        }`}
        style={{ minHeight: compact ? '36px' : '40px', whiteSpace: 'nowrap' }}
        onClick={() => {
          setError('');
          setConfirmOpen(true);
        }}
        disabled={busy}
        title="Cancelar este turno"
      >
        <i className="bi bi-x-circle" aria-hidden="true" />
        <span>Cancelar turno</span>
      </button>
    </>
  );
}
