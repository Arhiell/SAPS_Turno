import {
  useState,
  type FormEvent,
} from 'react';

import {
  requestEmailChange,
  confirmEmailChange,
} from '../../services/auth.service';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  authError,
} from '../../utils/auth-errors';

export default function PatientEmailForm() {
  // Obtiene el usuario actual y la función
  // para recargar su perfil.
  const {
    user,
    reloadProfile,
  } = useAuth();

  // Controla si el formulario está abierto.
  const [open, setOpen] = useState(false);

  // Datos necesarios para cambiar el correo.
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  // Indica si el código ya fue enviado.
  const [sent, setSent] = useState(false);

  // Estado de procesamiento.
  const [busy, setBusy] = useState(false);

  // Mensajes de respuesta.
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // ========================================
  // ENVÍO DEL CÓDIGO
  // ========================================

  const send = async () => {
    setBusy(true);
    setError('');

    try {
      // Solicita el cambio y envía un código
      // de verificación al nuevo correo.
      await requestEmailChange(
        email.trim()
      );

      setSent(true);
      setCode('');

      setMessage(
        'Enviamos un código al nuevo correo. Vence en 10 minutos. Podés reenviarlo después de un minuto.'
      );
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // CONFIRMACIÓN DEL CAMBIO
  // ========================================

  const submit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    // Evita solicitudes duplicadas.
    if (busy) {
      return;
    }

    // Si todavía no se envió el código,
    // realiza primero la solicitud.
    if (!sent) {
      await send();
      return;
    }

    setBusy(true);
    setError('');

    try {
      // Confirma el código enviado al nuevo correo.
      await confirmEmailChange(
        email.trim(),
        code
      );

      // Recarga el perfil para obtener
      // el nuevo correo actualizado.
      await reloadProfile();

      setMessage(
        'Tu correo fue verificado y actualizado.'
      );

      // Cierra y reinicia el formulario.
      setOpen(false);
      setSent(false);
      setCode('');
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <section className="patient-section mt-4">
      <h2 className="h5">
        Correo de acceso
      </h2>

      {/* Correo actualmente registrado. */}
      <p>
        {user?.email}
      </p>

      {/* Mensaje de éxito o información. */}
      {message && (
        <p
          role="status"
          className="text-success"
        >
          {message}
        </p>
      )}

      {/* Mensaje de error. */}
      {error && (
        <div
          role="alert"
          className="alert alert-danger"
        >
          {error}
        </div>
      )}

      {!open ? (
        // Abre el formulario para cambiar el correo.
        <button
          className="btn btn-outline-success"
          onClick={() => {
            setOpen(true);
            setMessage('');
          }}
        >
          Cambiar correo
        </button>
      ) : (
        // Formulario de cambio de correo.
        <form
          onSubmit={(event) =>
            void submit(event)
          }
        >
          <p className="text-muted">
            Tu correo actual seguirá vigente hasta
            verificar el nuevo.
          </p>

          <fieldset disabled={busy}>
            {/* Nuevo correo electrónico. */}
            <label className="form-label w-100">
              Nuevo correo

              <input
                type="email"
                className="form-control mt-1"
                required
                maxLength={254}
                value={email}
                readOnly={sent}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
              />
            </label>

            {/* Código enviado al nuevo correo. */}
            {sent && (
              <label className="form-label w-100">
                Código de verificación

                <input
                  className="form-control mt-1"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                    )
                  }
                />
              </label>
            )}

            {/* Acciones del formulario. */}
            <div className="d-flex flex-wrap gap-2 mt-2">
              <button className="btn btn-saps">
                {busy
                  ? 'Procesando…'
                  : sent
                    ? 'Verificar y cambiar correo'
                    : 'Enviar código'}
              </button>

              {/* Permite solicitar nuevamente el código. */}
              {sent && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() =>
                    void send()
                  }
                >
                  Reenviar código
                </button>
              )}

              {/* Cancela y reinicia el proceso. */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setOpen(false);
                  setSent(false);
                  setError('');
                  setMessage('');
                }}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}