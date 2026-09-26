import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

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

export default function PasswordRecoveryPage({
  mode,
}: {
  mode: 'forgot' | 'reset' | 'verify';
}) {
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = params.get('token') ?? '';

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy) return;

    setError('');
    setSuccess('');

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
        await requestPasswordRecovery({
          email,
        });

        setSuccess(
          'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.'
        );
      } else if (mode === 'reset') {
        await resetPassword({
          token,
          newPassword: password,
        });

        setPassword('');
        setConfirmation('');

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
      ? 'Recuperar contraseña'
      : mode === 'reset'
        ? 'Restablecer contraseña'
        : 'Verificar correo';

  return (
    <AuthForm title={title}>
      <form onSubmit={submit}>
        {mode === 'forgot' && (
          <label className="form-label w-100">
            Correo electrónico

            <input
              className="form-control"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </label>
        )}

        {mode === 'reset' && (
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
          disabled={busy || Boolean(success)}
        >
          {busy
            ? 'Enviando…'
            : title}
        </button>
      </form>
    </AuthForm>
  );
}
