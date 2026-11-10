import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/auth.service';
import { authError, passwordError } from '../../utils/auth-errors';
import { PROFESSIONAL_MESSAGE_TIMEOUT_MS, useAutoDismiss } from '../../utils/useAutoDismiss';

import PasswordInput from '../../pages/auth/PasswordInput';
import ConfirmationModal from './ConfirmationModal';

// Gestiona el cambio de contraseña del usuario autenticado.
export default function AccountPasswordForm() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Controla el formulario y los datos de la contraseña.
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Controla el procesamiento y los mensajes de error.
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');

  useAutoDismiss(error, setError, PROFESSIONAL_MESSAGE_TIMEOUT_MS, user?.rol === 'PROFESIONAL');

  // Controla la apertura del modal de confirmación.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Limpia los campos y errores del formulario.
  const reset = () => {
    setCurrent('');
    setPassword('');
    setConfirmation('');
    setError('');
  };

  // Valida la nueva contraseña y su confirmación.
  const validate = () =>
    passwordError(password, confirmation) ||
    (current === password
      ? 'La nueva contraseña debe ser diferente de la actual.'
      : '');

  // Actualiza la contraseña y cierra la sesión.
  const save = async () => {
    if (pending.current) {
      return;
    }

    const validation = validate();

    if (validation) {
      setError(validation);
      setConfirmOpen(false);
      return;
    }

    pending.current = true;
    setBusy(true);
    setError('');

    try {
      // El servidor verifica la contraseña actual y revoca las renovaciones de sesión.
      await changePassword(current, password);

      reset();

      // Cierra la sesión después de actualizar la contraseña.
      try {
        await logout();
      } catch {
        // AuthContext ya limpia la sesión local.
      }

      navigate('/login', {
        replace: true,
        state: { passwordChanged: true },
      });
    } catch (cause) {
      setError(authError(cause));
    } finally {
      pending.current = false;
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section className="patient-section h-100">
      {/* Solicita confirmación antes de cambiar la contraseña. */}
      <ConfirmationModal
        open={confirmOpen}
        title="Cambiar contraseña"
        message="¿Querés actualizar tu contraseña de acceso?"
        detail={
          <div className="text-muted small">
            Se cerrará tu sesión y tendrás que ingresar nuevamente.
          </div>
        }
        confirmText="Cambiar contraseña"
        variant="warning"
        icon="bi-key"
        loading={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void save()}
      />

      <h2 className="h5">
        Contraseña
      </h2>

      <p className="text-muted">
        Actualizá tu contraseña de acceso a SAPS.
      </p>

      {/* Muestra los errores de validación o actualización. */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Permite abrir el formulario de cambio de contraseña. */}
      {!editing ? (
        <button
          className="btn btn-outline-success"
          onClick={() => setEditing(true)}
        >
          Cambiar contraseña
        </button>
      ) : (
        <form
          onSubmit={event => {
            event.preventDefault();

            const validation = validate();

            setError(validation);

            if (!validation) {
              setConfirmOpen(true);
            }
          }}
        >
          <fieldset disabled={busy}>
            {/* Solicita la contraseña actual. */}
            <PasswordInput
              id="account-current-password"
              label="Contraseña actual"
              autoComplete="current-password"
              required
              maxLength={128}
              value={current}
              onChange={event => setCurrent(event.target.value)}
            />

            {/* Solicita la nueva contraseña. */}
            <PasswordInput
              id="account-new-password"
              label="Nueva contraseña"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />

            {/* Solicita la confirmación de la nueva contraseña. */}
            <PasswordInput
              id="account-confirm-password"
              label="Repetir nueva contraseña"
              autoComplete="new-password"
              required
              maxLength={128}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
            />

            <p className="small text-muted">
              Usá entre 8 y 12 caracteres, con mayúscula, minúscula,
              número y símbolo. Después del cambio vas a ingresar nuevamente.
            </p>

            {/* Permite guardar o cancelar el cambio. */}
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-saps">
                {busy ? 'Actualizando…' : 'Guardar contraseña'}
              </button>

              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  reset();
                  setEditing(false);
                }}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {/* Ofrece la recuperación de contraseña por correo. */}
      <p className="small mt-3 mb-0">
        Si olvidaste tu contraseña o ingresás con Google, podés{' '}
        <Link to="/recuperar-contrasena">
          recuperar o establecer tu contraseña por correo
        </Link>.
      </p>
    </section>
  );
}