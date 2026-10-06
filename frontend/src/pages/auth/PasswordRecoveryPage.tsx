import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  Navigate,
  useSearchParams,
} from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';
import ValidatedInput from '../../components/ui/ValidatedInput';

import {
  requestPasswordRecovery,
  resetPassword,
  verifyEmail,
} from '../../services/auth.service';

import {
  authError,
  passwordError,
} from '../../utils/auth-errors';

import AuthForm from './AuthForm';
import FourDigitCodeInput from './FourDigitCodeInput';

interface PasswordRecoveryPageProps {
  mode:
    | 'forgot'
    | 'reset'
    | 'verify';
}

export default function PasswordRecoveryPage({
  mode,
}: PasswordRecoveryPageProps) {
  const [params] =
    useSearchParams();

  // Datos utilizados durante la recuperación.
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmation,
    setConfirmation,
  ] = useState('');

  const [code, setCode] =
    useState('');

  // Controla las distintas etapas del proceso.
  const [requested, setRequested] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [busy, setBusy] =
    useState(false);

  // Mensajes mostrados al usuario.
  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [
    confirmOpen,
    setConfirmOpen,
  ] = useState(false);

  const token =
    params.get('token') ?? '';

  // Valida y procesa la recuperación o verificación.
  const submit = async (
    event?: FormEvent,
    confirmed = false
  ) => {
    event?.preventDefault();

    if (busy) {
      return;
    }

    setError('');
    setSuccess('');

    // Valida el código y la nueva contraseña.
    if (
      mode === 'forgot' &&
      requested
    ) {
      if (code.length !== 4) {
        setError(
          'Ingresá los 4 dígitos del código.'
        );

        return;
      }

      const validation =
        passwordError(
          password,
          confirmation
        );

      if (validation) {
        setError(validation);
        return;
      }
    }

    // Valida la contraseña y el token del enlace.
    if (mode === 'reset') {
      const validation =
        passwordError(
          password,
          confirmation
        );

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

    // Solicita confirmación antes de cambiar la contraseña.
    if (
      !confirmed &&
      (
        mode === 'reset' ||
        (
          mode === 'forgot' &&
          requested
        )
      )
    ) {
      setConfirmOpen(true);
      return;
    }

    setBusy(true);

    try {
      // Solicita el código de recuperación.
      if (mode === 'forgot') {
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

        // Restablece la contraseña mediante código.
        await resetPassword({
          email,
          code,
          newPassword: password,
        });

        setPassword('');
        setConfirmation('');
        setCompleted(true);

        setSuccess(
          'Contraseña actualizada. Ya podés iniciar sesión.'
        );
      } else if (mode === 'reset') {
        // Restablece la contraseña mediante token.
        await resetPassword({
          token,
          newPassword: password,
        });

        setPassword('');
        setConfirmation('');
        setCompleted(true);

        setSuccess(
          'Contraseña actualizada. Ya podés iniciar sesión.'
        );
      } else if (token) {
        // Verifica el correo mediante token.
        await verifyEmail(token);

        setSuccess(
          'Correo verificado. Ya podés iniciar sesión y completar tu perfil.'
        );
      }
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  // Redirige a la verificación por código si falta el token.
  if (
    mode === 'verify' &&
    !token
  ) {
    return (
      <Navigate
        to="/verificar-codigo"
        replace
      />
    );
  }

  // Define el título según el proceso actual.
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
      <ConfirmationModal
        open={confirmOpen}
        title="Restablecer contraseña"
        message="¿Querés guardar la nueva contraseña?"
        detail={
          <div className="text-muted small">
            Después podrás iniciar sesión
            con la contraseña nueva.
          </div>
        }
        confirmText="Restablecer contraseña"
        variant="warning"
        icon="bi-key"
        loading={busy}
        onClose={() =>
          setConfirmOpen(false)
        }
        onConfirm={() => {
          setConfirmOpen(false);

          void submit(
            undefined,
            true
          );
        }}
      />

      <form onSubmit={submit}>
        <fieldset
          disabled={
            busy ||
            completed
          }
        >
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
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </label>
          )}

          {mode === 'forgot' &&
            requested && (
              <>
                <label className="form-label w-100">
                  Código de recuperación
                </label>

                <FourDigitCodeInput
                  label="Código de recuperación"
                  value={code}
                  onChange={setCode}
                  disabled={
                    busy ||
                    completed
                  }
                />

                <p className="small text-muted">
                  El código vence en
                  15 minutos.
                </p>
              </>
            )}

          {(
            (
              mode === 'forgot' &&
              requested
            ) ||
            mode === 'reset'
          ) && (
            <>
              <label className="form-label w-100">
                Nueva contraseña

                <input
                  className="form-control"
                  type="password"
                  autoComplete="new-password"
                  required
                  maxLength={128}
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="form-label w-100">
                Confirmar contraseña

                <input
                  className="form-control"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmation}
                  onChange={(event) =>
                    setConfirmation(
                      event.target.value
                    )
                  }
                />
              </label>

              <p className="small text-muted">
                Entre 8 y 12 caracteres,
                con mayúscula, minúscula,
                número y símbolo.
              </p>
            </>
          )}

          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              className="alert alert-success"
              role="status"
            >
              {success}
            </div>
          )}

          <button
            className="btn btn-primary w-100"
            disabled={
              busy ||
              completed
            }
          >
            {busy
              ? 'Enviando…'
              : mode === 'forgot' &&
                  requested
                ? 'Restablecer contraseña'
                : title}
          </button>
        </fieldset>
      </form>

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