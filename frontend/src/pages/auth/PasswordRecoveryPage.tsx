import { useState, type FormEvent } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

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

export default function PasswordRecoveryPage({
  mode,
}: {
  mode: 'forgot' | 'reset' | 'verify';
}) {
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [requested, setRequested] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = params.get('token') ?? '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy) return;

    setError('');
    setSuccess('');

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

    if (mode === 'reset') {
      const validation = passwordError(
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

    setBusy(true);

    try {
      if (mode === 'forgot') {
        if (!requested) {
          await requestPasswordRecovery({ email });
          setRequested(true);
          setSuccess(
            'Si el correo está registrado, recibirás un código de 4 dígitos. Ingresalo para elegir una nueva contraseña.'
          );
          return;
        }

        await resetPassword({
          email,
          code,
          newPassword: password,
        });
        setPassword('');
        setConfirmation('');
        setCompleted(true);
        setSuccess('Contraseña actualizada. Ya podés iniciar sesión.');
      } else if (mode === 'reset') {
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

  if (mode === 'verify' && !token) {
    return <Navigate to="/verificar-codigo" replace />;
  }

  const title =
    mode === 'forgot'
      ? requested ? 'Restablecer contraseña' : 'Recuperar contraseña'
      : mode === 'reset'
        ? 'Restablecer contraseña'
        : 'Verificar correo';

  return (
    <AuthForm title={title}>
      <form onSubmit={submit}>
        <fieldset disabled={busy || completed}>
        {mode === 'forgot' && (
          <label className="form-label w-100">
            Correo electrónico

            <input
              className="form-control"
              type="email"
              autoComplete="email"
              required
              readOnly={requested}
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </label>
        )}

        {mode === 'forgot' && requested && (
          <>
            <label className="form-label w-100">Código de recuperación</label>
            <FourDigitCodeInput
              label="Código de recuperación"
              value={code}
              onChange={setCode}
              disabled={busy || completed}
            />
            <p className="small text-muted">El código vence en 15 minutos.</p>
          </>
        )}

        {((mode === 'forgot' && requested) || mode === 'reset') && (
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
                onChange={(e) =>
                  setPassword(e.target.value)
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
                onChange={(e) =>
                  setConfirmation(e.target.value)
                }
              />
            </label>

            <p className="small text-muted">
              Entre 8 y 128 caracteres, con mayúscula,
              minúscula, número y símbolo.
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
          disabled={busy || completed}
        >
          {busy
            ? 'Enviando…'
            : mode === 'forgot' && requested ? 'Restablecer contraseña' : title}
        </button>
        </fieldset>
      </form>
      {completed && (
        <Link className="btn btn-outline-secondary w-100 mt-3" to="/login">
          Iniciar sesión
        </Link>
      )}
    </AuthForm>
  );
}
