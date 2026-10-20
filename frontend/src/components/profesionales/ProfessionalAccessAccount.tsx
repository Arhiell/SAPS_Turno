import { useState, type FormEvent } from 'react';

import { useAuth } from '../../context/AuthContext';

import PasswordInput from '../../pages/auth/PasswordInput';
import ValidatedInput from '../ui/ValidatedInput';

import { createInternalAccount } from '../../services/auth.service';

import type { Professional } from '../../types/profesional.types';
import type { AccountDisplay } from '../../types/account-display.types';

import { authError, passwordError } from '../../utils/auth-errors';

interface Props {
  professional: Professional;
  onCreated: (account: AccountDisplay) => void;
}

// Permite crear una cuenta de acceso para un profesional registrado.
export default function ProfessionalAccessAccount({
  professional,
  onCreated,
}: Props) {
  const { user } = useAuth();

  // Controla la visualización del formulario.
  const [open, setOpen] = useState(false);

  // Almacena las credenciales de la nueva cuenta.
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(
    professional.persona.email ?? ''
  );
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Controla el estado de la solicitud y los mensajes.
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Restringe el acceso a los administradores autorizados.
  if (
    user?.rol !== 'SUPER_ADMIN' &&
    user?.rol !== 'ADMIN_SALITA'
  ) {
    return null;
  }

  // Valida las credenciales y registra la cuenta del profesional.
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      busy ||
      professional.persona.cuenta ||
      !professional.activo
    ) {
      return;
    }

    // Verifica que la contraseña cumpla los requisitos.
    const validation = passwordError(
      password,
      confirmation
    );

    setError(validation);

    if (validation) {
      return;
    }

    setBusy(true);

    try {
      // Crea la cuenta vinculada al profesional.
      const account = await createInternalAccount(
        'professionals',
        {
          id_profesional: professional.id_profesional,
          nombre_usuario: username.trim(),
          email: email.trim(),
          password,
        }
      );

      // Limpia las contraseñas y cierra el formulario.
      setPassword('');
      setConfirmation('');
      setOpen(false);

      // Informa que la cuenta fue creada correctamente.
      setSuccess(
        `Cuenta creada para ${account.nombre_usuario}. El profesional debe verificar su correo (${account.email}) e ingresar con su usuario o correo y la contraseña asignada.`
      );

      onCreated(account);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className="card shadow-sm mb-4"
      aria-labelledby="professional-access-title"
    >
      <div className="card-body">
        <h3
          className="h5"
          id="professional-access-title"
        >
          Cuenta de acceso
        </h3>

        {/* Mensaje de confirmación de la cuenta creada. */}
        {success && (
          <p
            className="alert alert-success"
            role="status"
          >
            {success}
          </p>
        )}

        {professional.persona.cuenta ? (
          // Informa cuando el profesional ya tiene una cuenta.
          <p className="mb-0">
            Este profesional ya tiene una cuenta asociada.
            Puede ingresar con su usuario o correo y su
            contraseña. Si la olvidó, puede recuperarla
            desde el inicio de sesión.
          </p>
        ) : !professional.activo ? (
          // Impide crear cuentas para profesionales inactivos.
          <p className="text-muted mb-0">
            El profesional debe estar activo para crear
            su cuenta de acceso.
          </p>
        ) : (
          <>
            <p className="text-muted">
              Creá las credenciales para que este profesional
              pueda iniciar sesión. La cuenta quedará vinculada
              a sus datos registrados.
            </p>

            {/* Permite abrir o cerrar el formulario. */}
            <button
              type="button"
              className="btn btn-outline-success"
              disabled={busy}
              aria-expanded={open}
              aria-controls="professional-access-form"
              onClick={() => {
                setOpen(!open);
                setError('');
                setPassword('');
                setConfirmation('');
              }}
            >
              {open
                ? 'Cancelar'
                : 'Crear cuenta de acceso'}
            </button>

            {/* Formulario de creación de credenciales. */}
            {open && (
              <form
                id="professional-access-form"
                className="mt-3"
                onSubmit={submit}
              >
                {error && (
                  <p
                    className="alert alert-danger"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <fieldset disabled={busy}>
                  <div className="row g-3">
                    {/* Nombre de usuario. */}
                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="professional-username"
                        className="form-label"
                      >
                        Usuario *
                      </label>

                      <ValidatedInput
                        id="professional-username"
                        field="nombre_usuario"
                        className="form-control"
                        required
                        autoComplete="off"
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                      />
                    </div>

                    {/* Correo electrónico. */}
                    <div className="col-12 col-md-6">
                      <label
                        htmlFor="professional-email"
                        className="form-label"
                      >
                        Correo electrónico *
                      </label>

                      <ValidatedInput
                        id="professional-email"
                        type="email"
                        className="form-control"
                        required
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                      />
                    </div>

                    {/* Contraseña de acceso. */}
                    <div className="col-12 col-md-6">
                      <PasswordInput
                        id="professional-password"
                        label="Contraseña *"
                        required
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        value={password}
                        aria-describedby="professional-password-help"
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                      />
                    </div>

                    {/* Confirmación de contraseña. */}
                    <div className="col-12 col-md-6">
                      <PasswordInput
                        id="professional-confirmation"
                        label="Confirmar contraseña *"
                        required
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        value={confirmation}
                        aria-describedby="professional-password-help"
                        onChange={(event) =>
                          setConfirmation(event.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Requisitos de seguridad de la contraseña. */}
                  <p
                    id="professional-password-help"
                    className="small text-muted"
                  >
                    Entre 8 y 128 caracteres, con mayúscula,
                    minúscula, número y símbolo.
                  </p>

                  <p className="small">
                    El profesional recibirá un código para
                    verificar su correo. Comunicale el usuario
                    y la contraseña asignada para ingresar.
                  </p>

                  {/* Envía la solicitud de creación de cuenta. */}
                  <button
                    type="submit"
                    className="btn btn-success"
                  >
                    {busy
                      ? 'Creando cuenta...'
                      : 'Crear cuenta'}
                  </button>
                </fieldset>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}