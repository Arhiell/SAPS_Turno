import {
  useState,
  type FormEvent,
} from 'react';

import {
  changeTurnoStatus,
} from '../../services/turnos.service';

import type {
  Turno,
} from '../../types/turno.types';

import {
  authError,
} from '../../utils/auth-errors';

export default function CancelAppointment({
  turno,
  onCancelled,
}: {
  turno: Turno;
  onCancelled?: () => void;
}) {
  // Controla si se muestra el formulario de cancelación.
  const [open, setOpen] = useState(false);

  // Motivo ingresado por el paciente.
  const [reason, setReason] = useState('');

  // Estados de la operación.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // ========================================
  // CANCELACIÓN DEL TURNO
  // ========================================

  const cancel = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    // Evita enviar varias solicitudes al mismo tiempo.
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      // Cambia el estado del turno a CANCELADO
      // y registra el motivo indicado.
      await changeTurnoStatus(
        turno.id_turno,
        {
          estado: 'CANCELADO',
          motivo_cancelacion:
            reason.trim(),
        }
      );

      setDone(true);
      setOpen(false);

      // Informa al componente padre que el turno fue cancelado.
      onCancelled?.();
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // RESULTADO DE LA CANCELACIÓN
  // ========================================

  if (done) {
    return (
      <p
        role="status"
        className="text-success mb-0"
      >
        Turno cancelado.
      </p>
    );
  }

  // No permite cancelar turnos finalizados
  // ni turnos cuya fecha ya pasó.
  if (
    turno.estado.es_estado_final ||
    Date.parse(
      turno.fecha_hora_inicio
    ) <= Date.now()
  ) {
    return null;
  }

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div>
      {!open ? (
        // Muestra inicialmente el botón de cancelación.
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={() =>
            setOpen(true)
          }
        >
          Cancelar turno
        </button>
      ) : (
        // Formulario para confirmar la cancelación.
        <form
          onSubmit={(event) =>
            void cancel(event)
          }
          className="mt-3"
        >
          <p>
            Vas a cancelar el turno{' '}
            {turno.codigo_turno}.
            {' '}
            Esta acción libera el horario.
          </p>

          {/* Motivo obligatorio de la cancelación. */}
          <label className="form-label w-100">
            Motivo de cancelación

            <textarea
              className="form-control mt-1"
              required
              minLength={3}
              maxLength={2000}
              value={reason}
              disabled={busy}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
            />
          </label>

          {/* Mensaje de error. */}
          {error && (
            <div
              role="alert"
              className="alert alert-danger"
            >
              {error}
            </div>
          )}

          {/* Acciones del formulario. */}
          <div className="d-flex flex-wrap gap-2">
            <button
              className="btn btn-danger"
              disabled={
                busy ||
                reason.trim().length < 3
              }
            >
              {busy
                ? 'Cancelando…'
                : 'Confirmar cancelación'}
            </button>

            <button
              className="btn btn-outline-secondary"
              type="button"
              disabled={busy}
              onClick={() =>
                setOpen(false)
              }
            >
              Conservar turno
            </button>
          </div>
        </form>
      )}
    </div>
  );
}