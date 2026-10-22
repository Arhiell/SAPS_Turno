import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  getNotificaciones,
  leerNotificacion,
  leerTodasNotificaciones,
} from '../../services/notificaciones.service';

import type {
  NotificacionesResponse,
} from '../../types/notificacion.types';

import {
  authError,
} from '../../utils/auth-errors';

import {
  fechaNotificacion,
} from '../../components/notificaciones/NotificacionesNav';

export default function MisNotificacionesPage() {
  const [
    data,
    setData,
  ] = useState<NotificacionesResponse | null>(null);

  const [
    filter,
    setFilter,
  ] = useState('todas');

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busy,
    setBusy,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  // Evita que una respuesta anterior sobrescriba una carga más reciente.
  const requestId = useRef(0);

  // Oculta automáticamente los mensajes de éxito después de 5 segundos.
  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess('');
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  // Carga la bandeja y conserva los datos actuales durante las actualizaciones.
  const loadNotifications = useCallback(async (
    showInitialLoading = false,
  ) => {
    const currentRequest = ++requestId.current;

    if (showInitialLoading && !data) {
      setLoading(true);
    }

    setError('');

    try {
      const result = await getNotificaciones(
        page,
        filter === 'todas'
          ? undefined
          : filter === 'leidas',
      );

      if (currentRequest !== requestId.current) {
        return;
      }

      // Si una eliminación o un filtro deja vacía la página, retrocede una página.
      if (
        !result.notificaciones.length &&
        page > 1
      ) {
        setPage((value) => value - 1);
      } else {
        setData(result);
      }
    } catch (loadError) {
      if (currentRequest === requestId.current) {
        setError(authError(loadError));
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [data, filter, page]);

  // Carga al entrar y cuando cambian el filtro o la página.
  useEffect(() => {
    void loadNotifications(true);

    return () => {
      // Invalida la solicitud si cambian los parámetros o se desmonta la página.
      requestId.current += 1;
    };
  }, [loadNotifications]);

  // Actualiza solo ante eventos relevantes o cuando el usuario vuelve a la pestaña.
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        void loadNotifications(false);
      }
    };

    window.addEventListener(
      'notificaciones-actualizadas',
      refresh,
    );

    document.addEventListener(
      'visibilitychange',
      refresh,
    );

    return () => {
      window.removeEventListener(
        'notificaciones-actualizadas',
        refresh,
      );

      document.removeEventListener(
        'visibilitychange',
        refresh,
      );
    };
  }, [loadNotifications]);

  // Marca una notificación o todas como leídas y actualiza la interfaz enseguida.
  const read = async (id?: string) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      if (id) {
        await leerNotificacion(id);

        setData((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            notificaciones: current.notificaciones.map((item) =>
              item.id_notificacion === id
                ? { ...item, leida: true }
                : item
            ),
          };
        });
      } else {
        await leerTodasNotificaciones();

        setData((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            notificaciones: current.notificaciones.map((item) => ({
              ...item,
              leida: true,
            })),
          };
        });
      }

      setSuccess(
        id
          ? 'Notificación marcada como leída.'
          : 'Todas las notificaciones fueron marcadas como leídas.',
      );

      // El servicio ya emite notificaciones-actualizadas al completar el PATCH.
      // No se vuelve a emitir aquí para evitar una petición duplicada.
    } catch (readError) {
      setError(authError(readError));
    } finally {
      setBusy(false);
    }
  };

  // Actualiza manualmente sin vaciar la lista ni mostrar un bloqueo innecesario.
  const refresh = () => {
    setError('');
    setSuccess('');
    void loadNotifications(false);
  };

  return (
    <section className="notificaciones-page">
      <h1 className="h3">
        Mis notificaciones
      </h1>

      <div className="d-flex flex-wrap gap-2 align-items-end mb-4">
        <div>
          <label
            htmlFor="notificacion-filtro"
            className="form-label"
          >
            Mostrar
          </label>

          <select
            id="notificacion-filtro"
            className="form-select"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
              setSuccess('');
              setError('');
            }}
          >
            <option value="todas">
              Todas
            </option>

            <option value="nuevas">
              No leídas
            </option>

            <option value="leidas">
              Leídas
            </option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-outline-success"
          disabled={busy || loading}
          onClick={() => void read()}
        >
          {busy
            ? 'Actualizando…'
            : 'Marcar todas como leídas'}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={loading}
          onClick={refresh}
        >
          Actualizar
        </button>
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
          aria-live="polite"
        >
          {success}
        </div>
      )}

      {loading && (
        <p role="status">
          {data
            ? 'Actualizando notificaciones…'
            : 'Cargando notificaciones…'}
        </p>
      )}

      {!loading &&
        !error &&
        !data?.notificaciones.length && (
          <p>
            No hay notificaciones para mostrar.
          </p>
        )}

      {!error && (
        <div className="d-grid gap-3">
          {data?.notificaciones.map((item) => (
            <article
              key={item.id_notificacion}
              className={`card p-3 shadow-sm ${
                item.leida
                  ? 'border-0'
                  : 'border-success'
              }`}
            >
              <div className="d-flex flex-wrap justify-content-between gap-2">
                <h2 className="h5">
                  {item.titulo}
                </h2>

                <span
                  className={`badge align-self-start ${
                    item.leida
                      ? 'bg-secondary'
                      : 'bg-success'
                  }`}
                >
                  {item.leida
                    ? 'Leída'
                    : 'Sin leer'}
                </span>
              </div>

              <p className="notification-message">
                {item.mensaje}
              </p>

              <p className="small text-muted">
                {fechaNotificacion(
                  item.fecha_envio ??
                    item.fecha_creacion,
                )}

                {' · Enviado por: '}

                {item.remitente ??
                  'CORA · Notificación automática'}
              </p>

              {!item.leida && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success align-self-start"
                  disabled={busy}
                  onClick={() =>
                    void read(item.id_notificacion)
                  }
                >
                  Marcar como leída
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {!!data && data.totalPages > 1 && (
        <nav
          className="d-flex justify-content-between align-items-center gap-2 mt-3"
          aria-label="Paginación de notificaciones"
        >
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={loading || page <= 1}
            onClick={() =>
              setPage((value) => value - 1)
            }
          >
            Anterior
          </button>

          <span>
            {page}
            {' / '}
            {data.totalPages}
          </span>

          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={
              loading ||
              page >= data.totalPages
            }
            onClick={() =>
              setPage((value) => value + 1)
            }
          >
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
