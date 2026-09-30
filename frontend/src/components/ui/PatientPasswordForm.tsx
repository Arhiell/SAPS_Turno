import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import ConfirmationModal from './ConfirmationModal';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  changePassword,
} from '../../services/auth.service';

import {
  authError,
  passwordError,
} from '../../utils/auth-errors';

import PasswordInput from '../../pages/auth/PasswordInput';

export default function PatientPasswordForm() {
  // Obtiene la función para cerrar la sesión.
  const {
    logout,
  } = useAuth();

  const navigate = useNavigate();

  // Controla si el formulario está visible.
  const [
    editing,
    setEditing,
  ] = useState(false);

  // Contraseña actual.
  const [
    current,
    setCurrent,
  ] = useState('');

  // Nueva contraseña y confirmación.
  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmation,
    setConfirmation,
  ] = useState('');

  // Estado de procesamiento.
  const [
    busy,
    setBusy,
  ] = useState(false);

  // Mensaje de error.
  const [
    error,
    setError,
  ] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ========================================
  // REINICIO DEL FORMULARIO
  // ========================================

  // Limpia los campos y errores del formulario.
  const reset = () => {
    setCurrent('');
    setPassword('');
    setConfirmation('');
    setError('');
  };

  // ========================================
  // CAMBIO DE CONTRASEÑA
  // ========================================

  const save = async (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    // Evita solicitudes duplicadas.
    if (busy) {
      return;
    }

    // Valida la nueva contraseña y su confirmación.
    const validation = passwordError(
      password,
      confirmation
    );

    if (validation) {
      setError(
        validation
      );
      return;
    }

    setBusy(true);
    setError('');

    try {
      // Solicita el cambio de contraseña.
      await changePassword(
        current,
        password
      );

      // Limpia los datos sensibles del formulario.
      reset();

      // Descarta la sesión local después de revocar
      // las renovaciones en la API.
      try {
        await logout();
      } catch {
        // AuthContext ya elimina la sesión local.
      }

      // Redirige al login para volver a autenticarse.
      navigate(
        '/login',
        {
          replace: true,
          state: {
            passwordChanged: true,
          },
        }
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
  // INTERFAZ
  // ========================================

  return (
    <section className="patient-section h-100">
      <ConfirmationModal
        open={confirmOpen}
        title="Cambiar contraseña"
        message="¿Querés actualizar tu contraseña de acceso?"
        detail={<div className="text-muted small">Se cerrará tu sesión y tendrás que ingresar nuevamente.</div>}
        confirmText="Cambiar contraseña"
        variant="warning"
        icon="bi-key"
        loading={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void save();
        }}
      />

      <h2 className="h5">
        Contraseña
      </h2>

      <p className="text-muted">
        Actualizá tu contraseña de acceso a SAPS.
      </p>

      {/* Mensaje de error. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {!editing ? (
        // Abre el formulario de cambio de contraseña.
        <button
          className="btn btn-outline-success"
          onClick={() =>
            setEditing(true)
          }
        >
          Cambiar contraseña
        </button>
      ) : (
        // Formulario para actualizar la contraseña.
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <fieldset disabled={busy}>
            {/* Contraseña actualmente utilizada. */}
            <PasswordInput
              id="patient-current-password"
              label="Contraseña actual"
              autoComplete="current-password"
              required
              maxLength={128}
              value={current}
              onChange={(event) =>
                setCurrent(
                  event.target.value
                )
              }
            />

            {/* Nueva contraseña. */}
            <PasswordInput
              id="patient-new-password"
              label="Nueva contraseña"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
            />

            {/* Confirmación de la nueva contraseña. */}
            <PasswordInput
              id="patient-confirm-password"
              label="Repetir nueva contraseña"
              autoComplete="new-password"
              required
              maxLength={128}
              value={confirmation}
              onChange={(event) =>
                setConfirmation(
                  event.target.value
                )
              }
            />

            {/* Requisitos de seguridad. */}
            <p className="small text-muted">
              Usá entre 8 y 128 caracteres, con
              mayúscula, minúscula, número y símbolo.
              Después del cambio vas a ingresar
              nuevamente.
            </p>

            {/* Acciones del formulario. */}
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-saps">
                {busy
                  ? 'Actualizando…'
                  : 'Guardar contraseña'}
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

      {/* Alternativa para recuperar o establecer contraseña. */}
      <p className="small mt-3 mb-0">
        Si olvidaste tu contraseña o ingresás con
        Google, podés{' '}
        <Link to="/recuperar-contrasena">
          recuperar o establecer tu contraseña por correo
        </Link>
        .
      </p>
    </section>
  );
}