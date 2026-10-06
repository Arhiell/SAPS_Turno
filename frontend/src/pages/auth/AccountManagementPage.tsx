import PasswordInput from './PasswordInput';
import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AdminAccounts from '../../components/ui/AdminAccounts';
import AccountSummary from '../../components/ui/AccountSummary';
import ValidatedInput from '../../components/ui/ValidatedInput';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  createInternalAccount,
} from '../../services/auth.service';

import {
  getAdminSalitas,
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

  // Tipo de cuenta que se desea crear.
  const [kind, setKind] = useState<
    'admins' | 'professionals'
  >('professionals');

  // Listados disponibles para asociar la cuenta.
  const [salitas, setSalitas] =
    useState<Salita[]>([]);

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  // Identificador de la salita o profesional seleccionado.
  const [target, setTarget] =
    useState('');

  // Datos de acceso de la nueva cuenta.
  const [email, setEmail] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmation, setConfirmation] =
    useState('');

  // Estados de carga y mensajes.
  const [busy, setBusy] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  // Carga las salitas y profesionales activos.
  useEffect(() => {
    let active = true;

    void Promise.all([
      getAdminSalitas(),
      getProfessionals(),
    ])
      .then(([s, p]) => {
        if (active) {
          setSalitas(s.data);

          setProfessionals(
            p.data.filter(
              (item) => item.activo
            )
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setError(
            authError(cause)
          );
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

  // Valida y crea la nueva cuenta de acceso.
  const submit = async (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    if (busy) {
      return;
    }

    const validation =
      passwordError(
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
      const account = await createInternalAccount(
        kind,
        {
          nombre_usuario:
            username,

          email,

          password,

          [
            kind === 'admins'
              ? 'id_salita'
              : 'id_profesional'
          ]: target,
        }
      );

      // La respuesta del alta actualiza la vista sin repetir consultas.
      if (kind === 'admins') {
        setSalitas(current => current.map(salita => salita.id_salita === target
          ? { ...salita, administradores: [...(salita.administradores ?? []), { cuenta: account }] }
          : salita));
      } else {
        setProfessionals(current => current.map(professional => professional.id_profesional === target
          ? { ...professional, persona: { ...professional.persona, cuenta: account } }
          : professional));
      }
      setPassword('');
      setConfirmation('');

      setSuccess(
        'Cuenta creada. La persona recibió un código de 4 dígitos y debe verificar su correo antes de iniciar sesión.'
      );
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <ConfirmationModal
        open={confirmOpen}
        title="Crear cuenta de acceso"
        subtitle="Esta acción requiere confirmación."
        message="¿Querés crear esta cuenta de acceso?"
        detail={
          <>
            <div className="fw-semibold">
              {username ||
                'Usuario sin nombre'}
            </div>

            <div className="text-muted small mt-1">
              {email ||
                'Correo no informado'}
            </div>
          </>
        }
        confirmText="Crear cuenta"
        cancelText="Cancelar"
        variant="primary"
        icon="bi-person-plus"
        loading={busy}
        onClose={() =>
          setConfirmOpen(false)
        }
        onConfirm={() => {
          setConfirmOpen(false);
          void submit();
        }}
      />

      <div className="card-body p-4">
        <h1 className="h3">
          Crear cuenta de acceso
        </h1>

        <p>
          Las cuentas profesionales se vinculan
          a un profesional ya registrado.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <fieldset
            disabled={
              busy ||
              loading
            }
          >
            <label className="form-label w-100">
              Tipo de cuenta

              <select
                className="form-select"
                value={kind}
                onChange={(event) => {
                  setKind(
                    event.target.value ===
                      'admins'
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

                {user?.rol ===
                  'SUPER_ADMIN' && (
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
                onChange={(event) =>
                  setTarget(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Seleccioná una opción
                </option>

                {kind === 'admins'
                  ? salitas.filter(salita => salita.activo).map(
                      (salita) => (
                        <option
                          key={
                            salita.id_salita
                          }
                          value={
                            salita.id_salita
                          }
                        >
                          {salita.nombre}
                        </option>
                      )
                    )
                  : professionals.map(
                      (professional) => (
                        <option
                          key={
                            professional
                              .id_profesional
                          }
                          value={
                            professional
                              .id_profesional
                          }
                        >
                          {
                            professional
                              .persona
                              .apellidos
                          }{' '}
                          {
                            professional
                              .persona
                              .nombres
                          }{' '}
                          —{' '}
                          {
                            professional
                              .matricula
                          }
                        </option>
                      )
                    )}
              </select>
            </label>

            <label className="form-label w-100">
              Usuario

              <ValidatedInput
                field="nombre_usuario"
                className="form-control"
                required
                minLength={3}
                maxLength={60}
                autoComplete="off"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="form-label w-100">
              Correo electrónico

              <ValidatedInput
                className="form-control"
                required
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </label>

            {/* El mismo control de visibilidad se usa en todas las cuentas. */}
            <div>
              <PasswordInput
                id="account-password"
                label="Contraseña"
                aria-describedby="account-password-help"
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={12}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <small id="account-password-help" className="text-muted d-block mt-1">
                Entre 8 y 12 caracteres, con
                mayúscula, minúscula, número y
                símbolo.
              </small>
            </div>

            <div>
              <PasswordInput
                id="account-confirmation"
                label="Confirmar contraseña"
                aria-describedby="account-confirmation-help"
                required
                autoComplete="new-password"
                minLength={8}
                maxLength={12}
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value
                  )
                }
              />

              <small id="account-confirmation-help" className="text-muted d-block mt-1">
                Entre 8 y 12 caracteres, con
                mayúscula, minúscula, número y
                símbolo.
              </small>
            </div>

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
              className="btn btn-primary"
              type="submit"
            >
              {busy
                ? 'Creando…'
                : 'Crear cuenta'}
            </button>
          </fieldset>
        </form>
        {kind === 'professionals' && (
          <AccountSummary account={professionals.find(professional => professional.id_profesional === target)?.persona.cuenta} />
        )}
        <AdminAccounts salitas={salitas} loading={loading} />
      </div>
    </div>
  );
}
