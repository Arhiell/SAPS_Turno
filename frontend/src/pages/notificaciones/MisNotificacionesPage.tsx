
import {
  useEffect,
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
    revision,
    setRevision,
  ] = useState(0);

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

  // Carga las notificaciones según el filtro y la página seleccionada.
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    void getNotificaciones(
      page,
      filter === 'todas'
        ? undefined
        : filter === 'leidas',
    )
      .then((result) => {
        if (!active) {
          return;
        }

        // Retrocede una página si la actual quedó vacía.
        if (
          !result.notificaciones.length &&
          page > 1
        ) {
          setPage((value) => value - 1);
        } else {
          setData(result);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(authError(loadError));
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
  }, [
    filter,
    page,
    revision,
  ]);

  // Actualiza la bandeja ante eventos del sistema y cada minuto.
  useEffect(() => {
    const refresh = () => {
      setRevision((value) => value + 1);
    };

    window.addEventListener(
      'notificaciones-actualizadas',
      refresh,
    );

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        refresh();
      }
    }, 60000);

    return () => {
      window.removeEventListener(
        'notificaciones-actualizadas',
        refresh,
      );

      window.clearInterval(timer);
    };
  }, []);

  // Marca una notificación o todas las notificaciones como leídas.
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
      } else {
        await leerTodasNotificaciones();
      }

      setSuccess(
        id
          ? 'Notificación marcada como leída.'
          : 'Todas las notificaciones fueron marcadas como leídas.',
      );

      // Actualiza la lista y avisa al resto de los componentes.
      window.dispatchEvent(
        new Event('notificaciones-actualizadas'),
      );
    } catch (readError) {
      setError(authError(readError));
    } finally {
      setBusy(false);
    }
  };

  // Fuerza una actualización manual de la bandeja.
  const refresh = () => {
    setError('');
    setSuccess('');
    setRevision((value) => value + 1);
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
          Cargando notificaciones…
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
