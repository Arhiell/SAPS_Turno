import ValidatedInput from './ValidatedInput';
import {
  useState,
  type FormEvent,
} from 'react';

import ConfirmationModal from './ConfirmationModal';

import {
  useAuth,
} from '../../context/AuthContext';

import {
  changeUsername,
} from '../../services/auth.service';

import {
  authError,
} from '../../utils/auth-errors';

export default function PatientUsernameForm() {
  // Obtiene el usuario actual y la función
  // para recargar sus datos.
  const {
    user,
    reloadProfile,
  } = useAuth();

  // Controla si el formulario está en edición.
  const [
    editing,
    setEditing,
  ] = useState(false);

  // Nombre de usuario ingresado.
  const [
    name,
    setName,
  ] = useState(
    user?.nombre_usuario ?? ''
  );

  // Estado de procesamiento.
  const [
    busy,
    setBusy,
  ] = useState(false);

  // Mensajes de respuesta.
  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);

  // GUARDAR NOMBRE DE USUARIO
  const save = async (
    event?: FormEvent
  ) => {
    event?.preventDefault();

    // Evita solicitudes duplicadas.
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      // Solicita el cambio de nombre de usuario.
      await changeUsername(
        name.trim()
      );

      // Actualiza también el saludo y el navbar
      // con el usuario guardado.
      await reloadProfile();

      setEditing(false);

      setSuccess(
        'Nombre de usuario actualizado.'
      );
    } catch (cause) {
      setError(
        authError(cause)
      );
    } finally {
      setBusy(false);
    }
  };

  // INTERFAZ
  return (
    <section className="patient-section h-100">
      <ConfirmationModal
        open={confirmOpen}
        title="Cambiar nombre de usuario"
        subtitle="Esta acción requiere confirmación."
        message="¿Querés guardar este nombre de usuario?"
        detail={
          <>
            <div className="fw-semibold">{name.trim() || 'Sin nombre'}</div>
            <div className="text-muted small mt-1">Quedará visible en la app y tu perfil.</div>
          </>
        }
        confirmText="Guardar usuario"
        cancelText="Cancelar"
        variant="primary"
        icon="bi-person-check"
        loading={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void save();
        }}
      />

      <h2 className="h5">
        Nombre de usuario
      </h2>

      {/* Nombre de usuario actualmente registrado. */}
      <p className="patient-username">
        {user?.nombre_usuario}
      </p>

      {/* Mensaje de éxito. */}
      {success && (
        <p
          className="text-success"
          role="status"
        >
          {success}
        </p>
      )}

      {/* Mensaje de error. */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {!editing ? (
        // Activa el formulario de edición.
        <button
          className="btn btn-outline-success"
          onClick={() => {
            setName(
              user?.nombre_usuario ?? ''
            );
            setEditing(true);
            setSuccess('');
          }}
        >
          Cambiar usuario
        </button>
      ) : (
        // Formulario para modificar el usuario.
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setConfirmOpen(true);
          }}
        >
          <fieldset disabled={busy}>
            {/* Nuevo nombre de usuario. */}
            <label className="form-label w-100">
              Nuevo nombre de usuario

              <ValidatedInput field="nombre_usuario"
                className="form-control mt-1"
                autoComplete="username"
                required
                minLength={3}
                maxLength={60}
                pattern="[a-zA-Z0-9._\-]+"
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                aria-describedby="username-help"
              />
            </label>

            {/* Reglas permitidas para el usuario. */}
            <p
              className="small text-muted"
              id="username-help"
            >
              Entre 3 y 10 caracteres. Letras sin
              acentos, números, punto, guion o guion
              bajo.
            </p>

            {/* Acciones del formulario. */}
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-saps">
                {busy
                  ? 'Guardando…'
                  : 'Guardar usuario'}
              </button>

              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError('');
                }}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
