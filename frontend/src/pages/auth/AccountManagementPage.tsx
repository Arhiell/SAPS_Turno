import { useEffect, useState } from 'react';
import PasswordCreationFields from '../../components/auth/PasswordCreationFields';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AccessManagementPanel from '../../components/ui/AccessManagementPanel';
import ValidatedInput from '../../components/ui/ValidatedInput';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import { useAutoDismiss } from '../../utils/useAutoDismiss';
import { useAuth } from '../../context/AuthContext';
import { createInternalAccount } from '../../services/auth.service';
import { getAdminSalitas } from '../../services/salitas.service';
import type { Salita } from '../../types/salita.types';
import { authError } from '../../utils/auth-errors';
import { validatePassword, validateConfirmation } from '../../utils/password-policy';

type AccountKind = 'ADMIN_SALITA' | 'SUPER_ADMIN';

export default function AccountManagementPage() {
  const { user } = useAuth();
  const [kind, setKind] = useState<AccountKind>('ADMIN_SALITA');
  const [salitas, setSalitas] = useState<Salita[]>([]);
  const [target, setTarget] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [accountsRevision, setAccountsRevision] = useState(0);

  useAutoDismiss(error, () => setError(''), 15000);
  useAutoDismiss(success, () => setSuccess(''), 15000);

  useEffect(() => {
    let active = true;
    void getAdminSalitas().then((result) => { if (active) setSalitas(result.data); })
      .catch((cause) => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const validateAdminForm = () => {
    if (!username.trim()) {
      document.getElementById('account-username')?.focus();
      return false;
    }
    if (!email.trim()) {
      document.getElementById('account-email')?.focus();
      return false;
    }
    setShowPasswordErrors(true);
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      document.getElementById('account-password')?.focus();
      return false;
    }
    const confErr = validateConfirmation(password, confirmation);
    if (confErr) {
      document.getElementById('account-confirmation')?.focus();
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (busy || user?.rol !== 'SUPER_ADMIN') return;
    if (!validateAdminForm()) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await createInternalAccount('admins', {
        nombre_usuario: username, email, password, rol: kind,
        ...(kind === 'ADMIN_SALITA' ? { id_salita: target } : {}),
      });
      setPassword(''); setConfirmation(''); setUsername(''); setEmail(''); setTarget('');
      setShowPasswordErrors(false);
      setFormOpen(false); setAccountsRevision((value) => value + 1);
      setSuccess('Cuenta administrativa creada. Debe verificar su correo y completar sus datos personales al ingresar.');
    } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); setConfirmOpen(false); }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-3">
          <h1 className="h3 mb-0">Cuentas administrativas</h1>
          {user?.rol === 'SUPER_ADMIN' && (
            <button type="button" className="btn btn-success" disabled={busy}
              aria-expanded={formOpen} aria-controls="alta-administrador"
              onClick={() => {
                setFormOpen((value) => !value);
                setShowPasswordErrors(false);
                setError('');
                setPassword('');
                setConfirmation('');
              }}>
              {formOpen ? 'Cerrar formulario' : 'Agregar persona'}
            </button>
          )}
        </div>
        <FloatingFeedbackToast
          message={error || success}
          variant={error ? 'error' : 'success'}
          onDismiss={() => {
            setError('');
            setSuccess('');
          }}
        />
        {user?.rol === 'SUPER_ADMIN' && formOpen && (
          <form id="alta-administrador" className="border rounded p-3 mb-4" onSubmit={(event) => {
            event.preventDefault();
            if (validateAdminForm()) {
              setConfirmOpen(true);
            }
          }}>
            <h2 className="h5">Agregar persona · Cuenta administrativa</h2>
            <p className="text-muted">La persona completará sus datos personales al ingresar.</p>
            <fieldset disabled={busy || loading}>
              <div className="row g-3 mb-3">
                <label className="form-label col-12 col-md-6">Cargo
                  <select className="form-select" value={kind} onChange={(event) => {
                    setKind(event.target.value as AccountKind); setTarget('');
                  }}>
                    <option value="ADMIN_SALITA">Administrador de sala</option>
                    <option value="SUPER_ADMIN">Superadministrador</option>
                  </select>
                </label>
                {kind === 'ADMIN_SALITA' && (
                  <label className="form-label col-12 col-md-6">Sala *
                    <select className="form-select" required value={target} onChange={(event) => setTarget(event.target.value)}>
                      <option value="">Seleccionar sala</option>
                      {salitas.filter((salita) => salita.activo).map((salita) => (
                        <option key={salita.id_salita} value={salita.id_salita}>{salita.nombre}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            {/* Solicita el nombre de usuario. */}
            <label className="form-label w-100">
              Usuario

              <ValidatedInput
                id="account-username"
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
                id="account-email"
                className="form-control"
                required
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </label>

            {/* Componente unificado de contraseña con requisitos en vivo y errores contextuales */}
            <PasswordCreationFields
              password={password}
              confirmation={confirmation}
              onPasswordChange={(val) => {
                setPassword(val);
                setError('');
              }}
              onConfirmationChange={(val) => {
                setConfirmation(val);
                setError('');
              }}
              passwordId="account-password"
              confirmationId="account-confirmation"
              disabled={busy}
              showErrors={showPasswordErrors}
            />

            {/* Permite iniciar la creación de la cuenta. */}
            <button
              className="btn btn-primary mt-3"
              type="submit"
            >
              {busy ? 'Creando…' : 'Crear cuenta'}
            </button>

            </fieldset>
          </form>
        )}
        <AccessManagementPanel key={accountsRevision} revision={accountsRevision} salitas={salitas} />
      </div>
      <ConfirmationModal open={confirmOpen} title="Crear cuenta administrativa"
        message={`¿Querés crear la cuenta de ${username}?`} confirmText="Crear cuenta" loading={busy}
        onClose={() => { if (!busy) setConfirmOpen(false); }} onConfirm={() => void submit()} />
    </div>
  );
}
