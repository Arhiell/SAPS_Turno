import { useEffect, useState } from 'react';

import PasswordInput from './PasswordInput';

import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AdminAccounts from '../../components/ui/AdminAccounts';
import AccountSummary from '../../components/ui/AccountSummary';
import ValidatedInput from '../../components/ui/ValidatedInput';

import { useAuth } from '../../context/AuthContext';
import { createInternalAccount } from '../../services/auth.service';
import { getAdminSalitas } from '../../services/salitas.service';
import { getProfessionals } from '../../services/profesionales.service';

import type { Salita } from '../../types/salita.types';
import type { Professional } from '../../types/profesional.types';

import { authError, passwordError } from '../../utils/auth-errors';

// Define los tipos de cuentas que pueden crearse.
type AccountKind = 'professionals' | 'ADMIN_SALITA' | 'SUPER_ADMIN';

// Gestiona la creación de cuentas de acceso para profesionales y administradores.
export default function AccountManagementPage() {
  const { user } = useAuth();

  // Controla el tipo de cuenta y los registros disponibles.
  const [kind, setKind] = useState<AccountKind>('professionals');
  const [salitas, setSalitas] = useState<Salita[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Almacena los datos necesarios para crear la cuenta.
  const [target, setTarget] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Controla la carga, el procesamiento y los mensajes.
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Controla la apertura del modal de confirmación.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Carga las salitas y los profesionales disponibles.
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
            p.data.filter(item => item.activo)
          );
        }
      })
      .catch(cause => {
        if (active) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    // Evita actualizar el estado si el componente se desmonta.
    return () => {
      active = false;
    };
  }, []);

  // Valida los datos y crea la cuenta de acceso.
  const submit = async () => {
    if (busy) {
      return;
    }

    const validation = passwordError(password, confirmation);

    setError(validation);
    setSuccess('');

    if (validation) {
      return;
    }

    setBusy(true);

    try {
      // El superadministrador tiene alcance global y no requiere salita.
      const account = await createInternalAccount(
        kind === 'professionals' ? 'professionals' : 'admins',
        {
          nombre_usuario: username,
          email,
          password,
          ...(kind === 'professionals'
            ? { id_profesional: target }
            : kind === 'ADMIN_SALITA'
              ? { rol: kind, id_salita: target }
              : { rol: kind }),
        }
      );

      // Actualiza la lista de administradores de la salita seleccionada.
      if (kind === 'ADMIN_SALITA') {
        setSalitas(current =>
          current.map(salita =>
            salita.id_salita === target
              ? {
                  ...salita,
                  administradores: [
                    ...(salita.administradores ?? []),
                    { cuenta: account },
                  ],
                }
              : salita
          )
        );
      } else if (kind === 'professionals') {
        // Vincula la cuenta creada con el profesional seleccionado.
        setProfessionals(current =>
          current.map(professional =>
            professional.id_profesional === target
              ? {
                  ...professional,
                  persona: {
                    ...professional.persona,
                    cuenta: account,
                  },
                }
              : professional
          )
        );
      }

      // Limpia las contraseñas y muestra el resultado.
      setPassword('');
      setConfirmation('');

      setSuccess(
        kind === 'professionals'
          ? 'Cuenta creada. Debe verificar su correo con el código recibido antes de ingresar.'
          : 'Cuenta creada. Debe verificar su correo y completar sus datos personales en el primer acceso.'
      );
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card shadow-sm">
      {/* Solicita confirmación antes de crear la cuenta. */}
      <ConfirmationModal
        open={confirmOpen}
        title="Crear cuenta de acceso"
        message="¿Querés crear esta cuenta de acceso?"
        detail={
          <div className="text-break">
            <strong>{username}</strong>

            <div>{email}</div>

            <div>
              {kind === 'SUPER_ADMIN'
                ? 'Superadministrador'
                : kind === 'ADMIN_SALITA'
                  ? 'Administrador de salita'
                  : 'Profesional'}
            </div>
          </div>
        }
        confirmText="Crear cuenta"
        cancelText="Cancelar"
        variant="primary"
        icon="bi-person-plus"
        loading={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void submit();
        }}
      />

      <div className="card-body p-3 p-md-4">
        <h1 className="h3">
          Crear cuenta de acceso
        </h1>

        <p>
          Las cuentas profesionales se vinculan a un profesional ya registrado.
          Los administradores completan sus propios datos personales al ingresar.
        </p>

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

        {/* Formulario de creación de cuentas. */}
        <form
          onSubmit={event => {
            event.preventDefault();

            const validation = passwordError(password, confirmation);

            setError(validation);

            if (!validation) {
              setConfirmOpen(true);
            }
          }}
        >
          <fieldset disabled={busy || loading}>
            {/* Permite seleccionar el tipo de cuenta. */}
            <label className="form-label w-100">
              Tipo de cuenta

              <select
                className="form-select"
                value={kind}
                onChange={event => {
                  setKind(event.target.value as AccountKind);
                  setTarget('');
                  setSuccess('');
                }}
              >
                <option value="professionals">
                  Profesional
                </option>

                {/* Solo el superadministrador puede crear cuentas administrativas. */}
                {user?.rol === 'SUPER_ADMIN' && (
                  <>
                    <option value="SUPER_ADMIN">
                      Superadministrador
                    </option>

                    <option value="ADMIN_SALITA">
                      Administrador de salita
                    </option>
                  </>
                )}
              </select>
            </label>

            {/* Selecciona la salita o el profesional asociado a la cuenta. */}
            {kind !== 'SUPER_ADMIN' && (
              <label className="form-label w-100">
                {kind === 'ADMIN_SALITA' ? 'Salita *' : 'Profesional *'}

                <select
                  className="form-select"
                  required
                  value={target}
                  onChange={event => setTarget(event.target.value)}
                >
                  <option value="">
                    Seleccioná una opción
                  </option>

                  {kind === 'ADMIN_SALITA'
                    ? salitas
                        .filter(salita => salita.activo)
                        .map(salita => (
                          <option
                            key={salita.id_salita}
                            value={salita.id_salita}
                          >
                            {salita.nombre}
                          </option>
                        ))
                    : professionals.map(professional => (
                        <option
                          key={professional.id_profesional}
                          value={professional.id_profesional}
                        >
                          {professional.persona.apellidos}{' '}
                          {professional.persona.nombres} — {professional.matricula}
                        </option>
                      ))}
                </select>
              </label>
            )}

            {/* Solicita el nombre de usuario. */}
            <label className="form-label w-100">
              Usuario

              <ValidatedInput
                field="nombre_usuario"
                className="form-control"
                required
                autoComplete="off"
                value={username}
                onChange={event => setUsername(event.target.value)}
              />
            </label>

            {/* Solicita el correo electrónico de acceso. */}
            <label className="form-label w-100">
              Correo electrónico

              <ValidatedInput
                className="form-control"
                required
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </label>

            {/* Solicita la contraseña de la nueva cuenta. */}
            <PasswordInput
              id="account-password"
              label="Contraseña"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={password}
              aria-describedby="account-password-help"
              onChange={event => setPassword(event.target.value)}
            />

            {/* Solicita la confirmación de la contraseña. */}
            <PasswordInput
              id="account-confirmation"
              label="Confirmar contraseña"
              required
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              value={confirmation}
              aria-describedby="account-password-help"
              onChange={event => setConfirmation(event.target.value)}
            />

            <p
              id="account-password-help"
              className="small text-muted"
            >
              Entre 8 y 128 caracteres, con mayúscula, minúscula,
              número y símbolo.
            </p>

            {/* Permite iniciar la creación de la cuenta. */}
            <button
              className="btn btn-primary"
              type="submit"
            >
              {busy ? 'Creando…' : 'Crear cuenta'}
            </button>
          </fieldset>
        </form>

        {/* Muestra la cuenta asociada al profesional seleccionado. */}
        {kind === 'professionals' && (
          <AccountSummary
            account={
              professionals.find(
                professional => professional.id_profesional === target
              )?.persona.cuenta
            }
          />
        )}

        {/* Muestra las cuentas administrativas de las salitas. */}
        <AdminAccounts
          salitas={salitas}
          loading={loading}
        />
      </div>
    </div>
  );
}