import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  createInternalAccount,
} from '../../services/auth.service';

import {
  getSalitas,
} from '../../services/salitas.service';

import {
  getProfessionals,
} from '../../services/profesionales.service';

import type {
  Salita,
} from '../../types/salita.types';

import type {
  Professional,
} from '../../types/profesional.types';

import {
  authError,
  passwordError,
} from '../../utils/auth-errors';

export default function AccountManagementPage() {
  const { user } = useAuth();

  const [kind, setKind] = useState<'admins' | 'professionals'>(
    'professionals'
  );

  const [salitas, setSalitas] = useState<Salita[]>([]);

  const [professionals, setProfessionals] = useState<Professional[]>([]);

  const [target, setTarget] = useState('');

  const [email, setEmail] = useState('');

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [confirmation, setConfirmation] = useState('');

  const [busy, setBusy] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    void Promise.all([
      getSalitas(),
      getProfessionals(),
    ])
      .then(([s, p]) => {
        if (active) {
          setSalitas(
            s.data.filter((item) => item.activo)
          );

          setProfessionals(
            p.data.filter((item) => item.activo)
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (busy) return;

    const validation = passwordError(
      password,
      confirmation
    );

    setError(validation);
    setSuccess('');

    if (validation) {
      return;
    }

    setBusy(true);

    try {
      await createInternalAccount(
        kind,
        {
          nombre_usuario: username,
          email,
          password,
          [
            kind === 'admins'
              ? 'id_salita'
              : 'id_profesional'
          ]: target,
        }
      );

      setPassword('');
      setConfirmation('');

      setSuccess(
        'Cuenta creada. La persona debe verificar su correo antes de iniciar sesión.'
      );
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <h1 className="h3">
          Crear cuenta de acceso
        </h1>

        <p>
          Las cuentas profesionales se vinculan a un profesional ya registrado.
        </p>

        <form onSubmit={submit}>
          <fieldset disabled={busy || loading}>
            <label className="form-label w-100">
              Tipo de cuenta

              <select
                className="form-select"
                value={kind}
                onChange={(e) => {
                  setKind(
                    e.target.value === 'admins'
                      ? 'admins'
                      : 'professionals'
                  );

                  setTarget('');
                  setSuccess('');
                }}
              >
                <option value="professionals">
                  Profesional
                </option>

                {user?.rol === 'SUPER_ADMIN' && (
                  <option value="admins">
                    Administrador de salita
                  </option>
                )}
              </select>
            </label>

            <label className="form-label w-100">
              {kind === 'admins'
                ? 'Salita'
                : 'Profesional'}

              <select
                className="form-select"
                required
                value={target}
                onChange={(e) =>
                  setTarget(e.target.value)
                }
              >
                <option value="">
                  Seleccioná una opción
                </option>

                {kind === 'admins'
                  ? salitas.map((s) => (
                      <option
                        key={s.id_salita}
                        value={s.id_salita}
                      >
                        {s.nombre}
                      </option>
                    ))
                  : professionals.map((p) => (
                      <option
                        key={p.id_profesional}
                        value={p.id_profesional}
                      >
                        {p.persona.apellidos}{' '}
                        {p.persona.nombres} — {p.matricula}
                      </option>
                    ))}
              </select>
            </label>

            <label className="form-label w-100">
              Usuario

              <input
                className="form-control"
                required
                minLength={3}
                maxLength={60}
                autoComplete="off"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
              />
            </label>

            <label className="form-label w-100">
              Correo electrónico

              <input
                className="form-control"
                required
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </label>

            <label className="form-label w-100">
              Contraseña inicial

              <input
                className="form-control"
                required
                type="password"
                autoComplete="new-password"
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
                required
                type="password"
                autoComplete="new-password"
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

            <button className="btn btn-primary">
              {busy
                ? 'Creando…'
                : 'Crear cuenta'}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}