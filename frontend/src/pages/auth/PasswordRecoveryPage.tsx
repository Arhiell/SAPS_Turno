import { useEffect, useState, type FormEvent } from 'react';

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import {
  requestPasswordRecovery,
  resetPassword,
  verifyEmail,
} from '../../services/auth.service';

import { authError, passwordError } from '../../utils/auth-errors';

import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ValidatedInput from '../../components/ui/ValidatedInput';

import PasswordInput from './PasswordInput';
import AuthForm from './AuthForm';
import FourDigitCodeInput from './FourDigitCodeInput';

// Define los modos disponibles para recuperar el acceso o verificar el correo.
interface PasswordRecoveryPageProps {
  mode: 'forgot' | 'reset' | 'verify';
}

// Gestiona la recuperación de contraseña y la verificación del correo electrónico.
export default function PasswordRecoveryPage({
  mode,
}: PasswordRecoveryPageProps) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Almacena los datos necesarios para recuperar la contraseña.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');

  // Controla las etapas y el procesamiento del formulario.
  const [requested, setRequested] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);

  // Almacena los mensajes de error y confirmación.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Controla la apertura del modal de confirmación.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Obtiene el token de verificación o recuperación desde la URL.
  const token = params.get('token') ?? '';

  // Redirige al inicio de sesión después de completar la recuperación.
  useEffect(() => {
    if (!completed) {
      return;
    }

    const timeout = window.setTimeout(
      () =>
        navigate('/login', {
          replace: true,
        }),
      1500
    );

    return () => window.clearTimeout(timeout);
  }, [completed, navigate]);

  // Procesa la solicitud, recuperación o verificación según el modo.
  const submit = async (event?: FormEvent, confirmed = false) => {
    event?.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setSuccess('');

    // Valida el código y la contraseña en la recuperación por correo.
    if (mode === 'forgot' && requested) {
      if (code.length !== 4) {
        setError('Ingresá los 4 dígitos del código.');
        return;
      }

      const validation = passwordError(password, confirmation);

      if (validation) {
        setError(validation);
        return;
      }
    }

    // Valida la contraseña y el token de recuperación por enlace.
    if (mode === 'reset') {
      const validation = passwordError(password, confirmation);

      if (validation) {
        setError(validation);
        return;
      }

      if (token.length < 64) {
        setError(
          'El enlace no contiene un token válido. Solicitá otro enlace.'
        );
        return;
      }
    }

    // Solicita confirmación antes de restablecer la contraseña.
    if (
      !confirmed &&
      (
        mode === 'reset' ||
        (mode === 'forgot' && requested)
      )
    ) {
      setConfirmOpen(true);
      return;
    }

    setBusy(true);

    try {
      if (mode === 'forgot') {
        // Solicita el código de recuperación al correo electrónico.
        if (!requested) {
          await requestPasswordRecovery({
            email,
          });

          setRequested(true);
          setSuccess(
            'Si el correo está registrado, recibirás un código de 4 dígitos. Ingresalo para elegir una nueva contraseña.'
          );

          return;
        }

        // Restablece la contraseña mediante el código recibido.
        await resetPassword({
          email,
          code,
          newPassword: password,
        });

        setPassword('');
        setConfirmation('');
        setCode('');
        setEmail('');
        setRequested(false);
        setCompleted(true);

        navigate(location.pathname, {
          replace: true,
        });

        setSuccess(
          'Contraseña actualizada correctamente. Serás redirigido al inicio de sesión.'
        );
      } else if (mode === 'reset') {
        // Restablece la contraseña mediante el token del enlace.
        await resetPassword({
          token,
          newPassword: password,
        });

        setPassword('');
        setConfirmation('');
        setCode('');
        setEmail('');
        setCompleted(true);

        navigate(location.pathname, {
          replace: true,
        });

        setSuccess(
          'Contraseña actualizada correctamente. Serás redirigido al inicio de sesión.'
        );
      } else if (token) {
        // Verifica el correo electrónico mediante el token recibido.
        await verifyEmail(token);

        setSuccess(
          'Correo verificado. Ya podés iniciar sesión y completar tu perfil.'
        );
      }
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  // Redirige a la verificación por código si no existe un token.
  if (mode === 'verify' && !token) {
    return <Navigate to="/verificar-codigo" replace />;
  }

  // Define el título del formulario según el modo actual.
  const title =
    mode === 'forgot'
      ? requested
        ? 'Restablecer contraseña'
        : 'Recuperar contraseña'
      : mode === 'reset'
        ? 'Restablecer contraseña'
        : 'Verificar correo';

  return (
    <AuthForm title={title}>
      {/* Solicita confirmación antes de restablecer la contraseña. */}
      <ConfirmationModal
        open={confirmOpen}
        title="Restablecer contraseña"
        message="¿Querés guardar la nueva contraseña?"
        detail={
          <div className="text-muted small">
            Después podrás iniciar sesión con la contraseña nueva.
          </div>
        }
        confirmText="Restablecer contraseña"
        variant="warning"
        icon="bi-key"
        loading={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void submit(undefined, true);
        }}
      />

      {/* Formulario de recuperación o verificación. */}
      <form onSubmit={submit}>
        <fieldset disabled={busy || completed}>
          {/* Solicita el correo para iniciar la recuperación. */}
          {mode === 'forgot' && (
            <label className="form-label w-100">
              Correo electrónico

              <ValidatedInput
                className="form-control"
                type="email"
                autoComplete="email"
                required
                readOnly={requested}
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </label>
          )}

          {/* Solicita el código de recuperación recibido. */}
          {mode === 'forgot' && requested && (
            <>
              <label className="form-label w-100">
                Código de recuperación
              </label>

              <FourDigitCodeInput
                label="Código de recuperación"
                value={code}
                onChange={setCode}
                disabled={busy || completed}
              />

              <p className="small text-muted">
                El código vence en 15 minutos.
              </p>
            </>
          )}

          {/* Solicita la nueva contraseña y su confirmación. */}
          {((mode === 'forgot' && requested) || mode === 'reset') && (
            <>
              <div>
                <PasswordInput
                  id="recovery-password"
                  label="Nueva contraseña"
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
              </div>

              <div>
                <PasswordInput
                  id="recovery-confirmation"
                  label="Confirmar contraseña"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={event => setConfirmation(event.target.value)}
                />
              </div>

              <p className="small text-muted">
                Entre 8 y 128 caracteres, con mayúscula, minúscula,
                número y símbolo.
              </p>
            </>
          )}

          {/* Muestra los mensajes de error o confirmación. */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              {success}
            </div>
          )}

          {/* Ejecuta la acción correspondiente al modo actual. */}
          <button
            className="btn btn-primary w-100"
            disabled={busy || completed}
          >
            {busy
              ? 'Enviando…'
              : mode === 'forgot' && requested
                ? 'Restablecer contraseña'
                : title}
          </button>
        </fieldset>
      </form>

      {/* Permite regresar al inicio de sesión al finalizar. */}
      {completed && (
        <Link
          className="btn btn-outline-secondary w-100 mt-3"
          to="/login"
        >
          Iniciar sesión
        </Link>
      )}
    </AuthForm>
  );
}