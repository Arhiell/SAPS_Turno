import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  getNotificaciones,
  leerNotificacion,
  leerTodasNotificaciones,
} from '../../services/notificaciones.service';

import type {
  Notificacion,
} from '../../types/notificacion.types';

// Íconos utilizados según el tipo de notificación.
const icons: Record<string, string> = {
  TURNO_CREADO: 'bi-calendar-plus',
  TURNO_CANCELADO: 'bi-calendar-x',
  TURNO_REPROGRAMADO: 'bi-calendar2-week',
  CAMBIO_PROFESIONAL: 'bi-person-badge',
};

export default function NotificationBell() {
  // Controla la apertura del panel.
  const [open, setOpen] = useState(false);

  // Notificaciones visibles.
  const [items, setItems] = useState<Notificacion[]>([]);

  // Cantidad total de notificaciones sin leer.
  const [unread, setUnread] = useState<number | null>(null);

  // Control de paginación.
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  // Estados de carga y acciones.
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Mensajes de respuesta.
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Permite recargar las notificaciones.
  const [revision, setRevision] = useState(0);

  // Referencias para controlar el panel y el botón.
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const navigate = useNavigate();

  // ========================================
  // CARGA DE NOTIFICACIONES
  // ========================================

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setItems([]);

    // Cuenta todas las pendientes,
    // no solo las de la página visible.
    void Promise.all([
      getNotificaciones(page),
      getNotificaciones(1, false),
    ])
      .then(([list, pending]) => {
        if (!active) {
          return;
        }

        setItems(list.notificaciones);
        setPages(list.totalPages);
        setUnread(pending.total);
      })
      .catch(() => {
        if (active) {
          setError(
            'No se pudieron cargar las notificaciones.'
          );
          setUnread(null);
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
  }, [page, revision]);

  // ========================================
  // ACTUALIZACIÓN AUTOMÁTICA
  // ========================================

  useEffect(() => {
    // Actualiza las notificaciones cada minuto
    // cuando la página está visible y el panel cerrado.
    const timer = window.setInterval(() => {
      if (
        !document.hidden &&
        !open
      ) {
        setRevision(
          (v) => v + 1
        );
      }
    }, 60000);

    return () =>
      window.clearInterval(timer);
  }, [open]);

  // ========================================
  // CIERRE DEL PANEL
  // ========================================

  useEffect(() => {
    if (!open) {
      return;
    }

    // Cierra el panel al hacer clic fuera.
    const closeOutside = (
      event: PointerEvent
    ) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    // Cierra el panel con Escape y devuelve el foco.
    const escape = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };

    document.addEventListener(
      'pointerdown',
      closeOutside
    );

    document.addEventListener(
      'keydown',
      escape
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        closeOutside
      );

      document.removeEventListener(
        'keydown',
        escape
      );
    };
  }, [open]);

  // ========================================
  // MARCAR COMO LEÍDA
  // ========================================

  const read = async (
    item?: Notificacion
  ) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      // Marca una notificación individual como leída.
      if (item) {
        if (!item.leida) {
          await leerNotificacion(
            item.id_notificacion
          );
        }
      } else {
        // Marca todas las notificaciones como leídas.
        await leerTodasNotificaciones();
      }

      // Fuerza la actualización de la lista.
      setRevision(
        (v) => v + 1
      );

      setSuccess(
        item
          ? 'Notificación leída.'
          : 'Todas las notificaciones fueron marcadas como leídas.'
      );

      // Si está relacionada con un turno,
      // navega hacia el detalle correspondiente.
      if (item?.id_turno) {
        setOpen(false);

        navigate(
          `/mis-turnos/${item.id_turno}`
        );
      }
    } catch {
      setError(
        'No se pudo marcar como leída. Volvé a intentar.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div
      className="notification-bell"
      ref={container}
    >
      {/* Botón principal de notificaciones. */}
      <button
        ref={trigger}
        className="btn btn-outline-success position-relative"
        type="button"
        aria-label={`Notificaciones${
          unread === null
            ? ''
            : `, ${unread} sin leer`
        }`}
        aria-expanded={open}
        aria-controls="patient-notifications"
        onClick={() => {
          setOpen(!open);

          if (!open) {
            setRevision(
              (v) => v + 1
            );
          }
        }}
      >
        <i
          className="bi bi-bell"
          aria-hidden="true"
        />

        {/* Contador de notificaciones pendientes. */}
        {!!unread && (
          <span
            className="notification-count"
            aria-hidden="true"
          >
            {unread > 99
              ? '99+'
              : unread}
          </span>
        )}
      </button>

      {/* Panel desplegable de notificaciones. */}
      {open && (
        <section
          id="patient-notifications"
          className="notification-panel"
          aria-label="Notificaciones"
        >
          {/* Encabezado del panel. */}
          <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
            <h2 className="h5 mb-0">
              Notificaciones
            </h2>

            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Cerrar
            </button>
          </div>

          {/* Marca todas las notificaciones como leídas. */}
          <button
            className="btn btn-sm btn-outline-primary mb-3"
            disabled={
              busy ||
              loading ||
              !unread
            }
            onClick={() =>
              void read()
            }
          >
            Marcar todas como leídas
          </button>

          {/* Mensaje de error. */}
          {error && (
            <div
              className="alert alert-danger"
              role="alert"
            >
              {error}{' '}

              <button
                className="btn btn-sm btn-outline-danger"
                disabled={busy}
                onClick={() =>
                  setRevision(
                    (v) => v + 1
                  )
                }
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Mensaje de éxito. */}
          {success && (
            <p
              role="status"
              className="text-success"
            >
              {success}
            </p>
          )}

          {/* Estado de carga o listado de notificaciones. */}
          {loading ? (
            <p role="status">
              Cargando notificaciones…
            </p>
          ) : (
            <>
              {!error &&
                !items.length && (
                  <p>
                    No tenés notificaciones nuevas.
                  </p>
                )}

              {/* Listado de notificaciones. */}
              <div className="d-grid gap-2">
                {items.map(
                  (item) => (
                    <button
                      key={item.id_notificacion}
                      type="button"
                      className={`notification-item text-start ${
                        item.leida
                          ? ''
                          : 'is-unread'
                      }`}
                      disabled={busy}
                      onClick={() =>
                        void read(item)
                      }
                    >
                      <strong>
                        <i
                          className={`bi ${
                            icons[item.tipo] ??
                            'bi-envelope'
                          } me-2`}
                          aria-hidden="true"
                        />

                        {item.titulo}
                      </strong>

                      <span>
                        {item.mensaje}
                      </span>

                      <small>
                        {new Date(
                          item.fecha_creacion
                        ).toLocaleString(
                          'es-AR'
                        )}
                        {' · '}
                        {item.leida
                          ? 'Leída'
                          : 'Sin leer'}
                      </small>
                    </button>
                  )
                )}
              </div>
            </>
          )}

          {/* Controles de paginación. */}
          {pages > 1 && (
            <div className="d-flex justify-content-between gap-2 mt-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={
                  loading ||
                  busy ||
                  page <= 1
                }
                onClick={() =>
                  setPage(
                    (v) => v - 1
                  )
                }
              >
                Anterior
              </button>

              <span>
                {page} / {pages}
              </span>

              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={
                  loading ||
                  busy ||
                  page >= pages
                }
                onClick={() =>
                  setPage(
                    (v) => v + 1
                  )
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}