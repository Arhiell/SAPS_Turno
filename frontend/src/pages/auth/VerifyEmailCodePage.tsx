import axios from 'axios';
import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  requestEmailVerification,
  verifyEmail,
} from '../../services/auth.service';
import AuthForm from './AuthForm';

interface VerificationLocationState {
  email?: string;
  verificationExpiresAt?: string;
  resendAvailableAt?: string;
}

const CODE_LENGTH = 4;
const RESEND_COOLDOWN_MS = 60_000;

const formatTime = (totalSeconds: number) =>
  `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;

const messageForError = (cause: unknown) => {
  if (!axios.isAxiosError<{ message?: string }>(cause)) {
    return 'No pudimos completar la operación. Volvé a intentar.';
  }

  const message = cause.response?.data?.message?.toLowerCase() ?? '';
  if (cause.response?.status === 429 && message.includes('intentos')) {
    return 'Superaste los intentos. Solicitá un nuevo código.';
  }
  if (cause.response?.status === 429) {
    return 'Esperá a que el código expire para solicitar uno nuevo.';
  }
  if (message.includes('expir')) {
    return 'El código expiró. Solicitá uno nuevo.';
  }
  if (cause.response?.status === 400) {
    return 'Código incorrecto.';
  }
  return 'No pudimos completar la operación. Volvé a intentar.';
};

export default function VerifyEmailCodePage() {
  const location = useLocation();
  const initialState = location.state as VerificationLocationState | null;
  const [email, setEmail] = useState(initialState?.email ?? '');
  const [requested, setRequested] = useState(Boolean(initialState?.email));
  const [expiresAt, setExpiresAt] = useState(() => {
    if (initialState?.verificationExpiresAt) {
      return new Date(initialState.verificationExpiresAt).getTime();
    }
    return initialState?.email ? Date.now() + 10 * 60_000 : 0;
  });
  const [resendAvailableAt, setResendAvailableAt] = useState(() => {
    if (initialState?.resendAvailableAt) {
      return new Date(initialState.resendAvailableAt).getTime();
    }
    return initialState?.email ? Date.now() + RESEND_COOLDOWN_MS : 0;
  });
  const [now, setNow] = useState(Date.now());
  const [code, setCode] = useState(['', '', '', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendAfterAttempts, setResendAfterAttempts] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft = requested
    ? Math.max(0, Math.ceil((expiresAt - now) / 1000))
    : 0;
  const resendSecondsLeft = requested
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0;
  const formattedTime = formatTime(secondsLeft);
  const formattedResendTime = formatTime(resendSecondsLeft);

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setCode((current) => current.map((item, position) =>
      position === index ? digit : item));
    setError('');
    if (digit && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH - index);
    if (!pasted) return;
    event.preventDefault();
    setCode((current) => current.map((digit, position) =>
      position >= index && position < index + pasted.length
        ? pasted[position - index]
        : digit));
    inputs.current[Math.min(index + pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (!requested) {
        const result = await requestEmailVerification(email.trim());
        setRequested(true);
        setExpiresAt(result.verificationExpiresAt
          ? new Date(result.verificationExpiresAt).getTime()
          : Date.now() + 10 * 60_000);
        setResendAvailableAt(result.resendAvailableAt
          ? new Date(result.resendAvailableAt).getTime()
          : Date.now() + RESEND_COOLDOWN_MS);
        setNotice('Si corresponde, te enviamos un código a ese correo.');
        return;
      }

      if (code.join('').length !== CODE_LENGTH) {
        setError('Ingresá los 4 dígitos del código.');
        return;
      }

      await verifyEmail({ email: email.trim(), code: code.join('') });
      setVerified(true);
      setNotice('Correo verificado correctamente.');
    } catch (cause) {
      const message = messageForError(cause);
      setError(message);
      if (message.startsWith('Superaste los intentos')) {
        setResendAfterAttempts(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || (resendSecondsLeft > 0 && !resendAfterAttempts)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await requestEmailVerification(email.trim());
      setExpiresAt(result.verificationExpiresAt
        ? new Date(result.verificationExpiresAt).getTime()
        : Date.now() + 10 * 60_000);
      setResendAvailableAt(result.resendAvailableAt
        ? new Date(result.resendAvailableAt).getTime()
        : Date.now() + RESEND_COOLDOWN_MS);
      setNow(Date.now());
      setCode(['', '', '', '']);
      setResendAfterAttempts(false);
      setNotice('Si corresponde, te enviamos un nuevo código.');
      inputs.current[0]?.focus();
    } catch (cause) {
      setError(messageForError(cause));
    } finally {
      setBusy(false);
    }
  };

  if (verified) {
    return (
      <AuthForm title="Correo verificado" subtitle="Ya podés iniciar sesión y completar tu perfil.">
        <div role="status" className="text-center">
          <i className="bi bi-envelope-check auth-success-icon" aria-hidden="true" />
          <p className="mt-3">Correo verificado correctamente.</p>
          <Link className="btn btn-saps w-100" to="/login">Iniciar sesión</Link>
        </div>
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Verificar correo electrónico"
      subtitle={requested ? 'Ingresá el código de 4 dígitos que te enviamos.' : 'Te enviaremos un código de verificación.'}
    >
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          {!requested ? (
            <div className="mb-3">
              <label className="form-label" htmlFor="verify-email">Correo electrónico</label>
              <input
                id="verify-email"
                className="form-control"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          ) : (
            <>
              <p className="mb-2">Enviamos un código a:</p>
              <p className="fw-semibold text-break">{email}</p>
              <div className="auth-code-inputs" aria-label="Código de verificación">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { inputs.current[index] = element; }}
                    className="form-control auth-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    aria-label={`Dígito ${index + 1} del código`}
                    value={digit}
                    onChange={(event) => handleCodeChange(index, event.target.value)}
                    onPaste={(event) => handlePaste(event, index)}
                    onKeyDown={(event) => handleKeyDown(event, index)}
                  />
                ))}
              </div>
              {secondsLeft > 0 ? (
                <p className="small text-muted">
                  El código vence en <span className="auth-code-timer">{formattedTime}</span>.
                </p>
              ) : (
                <p className="small text-muted">El código expiró. Solicitá uno nuevo.</p>
              )}
            </>
          )}

          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}

          <button className="btn btn-saps w-100" type="submit">
            {busy ? 'Procesando…' : requested ? 'Verificar' : 'Enviar código'}
          </button>
        </fieldset>
      </form>

      {requested && (
        <button
          className="btn btn-outline-secondary w-100 mt-3"
          type="button"
          disabled={busy || (resendSecondsLeft > 0 && !resendAfterAttempts)}
          onClick={() => void resend()}
        >
          Reenviar código{resendSecondsLeft > 0 && !resendAfterAttempts ? ` (${formattedResendTime})` : ''}
        </button>
      )}
    </AuthForm>
  );
}