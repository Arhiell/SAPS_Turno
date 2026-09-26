import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerPatient } from '../../services/auth.service';

import {
  authError,
  passwordError,
} from '../../utils/auth-errors';

import AuthForm from './AuthForm';
import PasswordInput from './PasswordInput';
import GoogleButton from './GoogleButton';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy) return;

    const message = passwordError(
      password,
      confirmation
    );

    setValidation(message);
    setError('');

    if (message) return;

    setBusy(true);

    try {
      const result = await registerPatient({
        email,
        password,
      });

      navigate('/verificar-codigo', {
        replace: true,
        state: {
          email: email.trim(),
          verificationExpiresAt: result.verificationExpiresAt,
        },
      });
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthForm
      title="Creá tu cuenta"
      subtitle="Registro exclusivo para pacientes. Después podrás completar tus datos personales."
      footer={
        <p>
          ¿Ya tenés una cuenta?{' '}
          <Link to="/login">
            Iniciar sesión
          </Link>
        </p>
      }
    >
      <>
          <form
            onSubmit={submit}
            aria-busy={busy}
          >
            <fieldset disabled={busy}>
              <div className="mb-3">
                <label
                  className="form-label"
                  htmlFor="register-email"
                >
                  Correo electrónico
                </label>

                <input
                  id="register-email"
                  name="email"
                  className="form-control"
                  type="email"
                  required
                  maxLength={254}
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <PasswordInput
                id="register-password"
                label="Contraseña"
                required
                autoComplete="new-password"
                maxLength={128}
                aria-describedby="password-help"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setValidation('');
                }}
              />

              <p
                id="password-help"
                className="small text-muted"
              >
                Usá entre 8 y 128 caracteres, con mayúscula,
                minúscula, número y símbolo.
              </p>

              <PasswordInput
                id="register-confirmation"
                label="Confirmar contraseña"
                required
                autoComplete="new-password"
                maxLength={128}
                value={confirmation}
                error={validation}
                onChange={(e) => {
                  setConfirmation(e.target.value);
                  setValidation('');
                }}
              />

              {error && (
                <div
                  className="alert alert-danger"
                  role="alert"
                >
                  <i
                    className="bi bi-exclamation-circle me-2"
                    aria-hidden="true"
                  />

                  {error}
                </div>
              )}

              <button
                disabled={busy}
                className="btn btn-saps w-100"
                type="submit"
              >
                {busy && (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  />
                )}

                {busy
                  ? 'Creando cuenta…'
                  : 'Crear cuenta'}
              </button>
            </fieldset>
          </form>

          <div className="auth-divider">
            o registrate con
          </div>

          <GoogleButton disabled={busy} />
      </>
    </AuthForm>
  );
}