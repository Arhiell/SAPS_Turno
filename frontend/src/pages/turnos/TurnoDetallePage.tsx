import { getEstadoClass } from '../../utils/turno-status';
import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import ConnectionStatusBadge from '../../components/ui/ConnectionStatusBadge';
import { useAutoDismiss } from '../../utils/useAutoDismiss';

import {
  getTurnoById,
  changeTurnoStatus,
} from '../../services/turnos.service';

import type {
  Turno,
} from '../../types/turno.types';

const formatDateTime = (
  value: string,
) => {
  return new Date(
    value,
  ).toLocaleString(
    'es-AR',
    {
      dateStyle: 'full',
      timeStyle: 'short',
    },
  );
};


const TurnoDetallePage = () => {
  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const [turno, setTurno] =
    useState<Turno | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [changingStatus, setChangingStatus] =
    useState(false);

  const [cancelOpen, setCancelOpen] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState('');

  const [statusTarget, setStatusTarget] =
    useState<string | null>(null);

  const { ultimoEvento, resyncTick } = useAgendaSocket();

  useAutoDismiss(message, setMessage, 15_000, Boolean(message));
  useAutoDismiss(error, setError, 15_000, Boolean(error));

  const loadTurno =
    async (isBackground = false) => {
      if (!id) {
        setError(
          'No se especificó el turno.',
        );
        setLoading(false);
        return;
      }

      try {
        if (!isBackground && !turno) {
          setLoading(true);
        }
        setError('');

        const response =
          await getTurnoById(
            id,
          );

        setTurno(
          response.data.turno,
        );
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo cargar el turno.',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadTurno();
  }, [id]);

  // Actualización reactiva ante eventos de WebSocket correspondientes a este turno
  useEffect(() => {
    if (!ultimoEvento || !id) return;

    if (ultimoEvento.id_turno === id) {
      if (ultimoEvento.estado) {
        setTurno((prev) =>
          prev
            ? {
                ...prev,
                estado: {
                  ...prev.estado,
                  codigo: ultimoEvento.estado!,
                  nombre: ultimoEvento.estado!,
                },
              }
            : null
        );
      }
      void loadTurno(true);
    }
  }, [ultimoEvento, id]);

  // Resincronización ante reconexión del socket
  useEffect(() => {
    if (resyncTick > 0 && id) {
      void loadTurno(true);
    }
  }, [resyncTick, id]);

  const handleCancel = () => {
    if (!id || !turno) return;
    setCancelReason('');
    setError('');
    setCancelOpen(true);
  };

  const confirmCancel = async () => {
    if (!id || !turno) return;

    const reason = cancelReason.trim();
    if (reason.length < 3) {
      setError('Debe indicar un motivo de cancelación de al menos 3 caracteres.');
      return;
    }

      try {
        setChangingStatus(
          true,
        );

        setError('');

        await changeTurnoStatus(
          id,
          {
            estado:
              'CANCELADO',
            motivo_cancelacion:
              reason,
          },
        );

        setCancelOpen(false);
        setMessage(
          'Turno cancelado correctamente.',
        );

        await loadTurno();
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo cancelar el turno.',
        );
      } finally {
        setChangingStatus(
          false,
        );
      }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusTarget(newStatus);
  };

  const confirmStatusChange = async () => {
    if (!id || !statusTarget) return;

      try {
        setChangingStatus(
          true,
        );

        setError('');

        await changeTurnoStatus(
          id,
          {
            estado:
              statusTarget,
          },
        );

        setStatusTarget(null);
        setMessage(
          'Estado actualizado correctamente.',
        );

        await loadTurno();
      } catch (error) {
        console.error(error);

        setError(
          'No se pudo actualizar el estado del turno.',
        );
      } finally {
        setChangingStatus(
          false,
        );
      }
  };

  const handleReprogramar =
    () => {
      if (!id || !turno) {
        return;
      }

      navigate(
        `/turnos/${id}/reprogramar`,
      );
    };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-success"
          role="status"
        >
          <span className="visually-hidden">
            Cargando...
          </span>
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div>
        <div className="alert alert-danger">
          {error ||
            'Turno no encontrado.'}
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate(
              '/turnos',
            )
          }
        >
          Volver a turnos
        </button>
      </div>
    );
  }

  const isFinal =
    turno.estado
      .es_estado_final;

  const getStatusModalInfo = () => {
    if (statusTarget === 'CONFIRMADO') {
      return {
        title: 'Confirmar turno',
        message: '¿Querés confirmar este turno?',
        confirmText: 'Confirmar turno',
        variant: 'primary' as const,
        icon: 'bi-check-circle',
      };
    }
    if (statusTarget === 'EN_ESPERA') {
      return {
        title: 'Pasar turno a espera',
        message: '¿El paciente ya se encuentra en la salita para su atención médica?',
        confirmText: 'Pasar a espera',
        variant: 'primary' as const,
        icon: 'bi-hourglass-split',
      };
    }
    if (statusTarget === 'NO_ASISTIO') {
      return {
        title: 'Registrar inasistencia',
        message: '¿Querés registrar que el paciente no asistió a su turno?',
        confirmText: 'Marcar inasistencia',
        variant: 'danger' as const,
        icon: 'bi-person-x',
      };
    }
    return {
      title: 'Actualizar estado',
      message: '¿Querés cambiar el estado de este turno?',
      confirmText: 'Aceptar',
      variant: 'primary' as const,
      icon: 'bi-check-circle',
    };
  };

  const statusModalInfo = getStatusModalInfo();

  return (
    <div className="turnos-page">
      {(message || error) && (
        <FloatingFeedbackToast
          message={message || error}
          variant={error ? 'error' : 'success'}
          onDismiss={() => {
            setMessage('');
            setError('');
          }}
        />
      )}

      <ConfirmationModal
        open={cancelOpen}
        title="Cancelar turno"
        message="¿Querés cancelar este turno? El horario quedará disponible para otra persona."
        detail={
          <>
            <div className="fw-semibold">Turno {turno.codigo_turno}</div>
            <label className="form-label w-100 mt-3">
              Motivo de cancelación
              <textarea
                className="form-control mt-1"
                required
                minLength={3}
                maxLength={2000}
                value={cancelReason}
                disabled={changingStatus}
                onChange={(event) => setCancelReason(event.target.value)}
              />
            </label>
            {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
          </>
        }
        confirmText="Cancelar turno"
        variant="danger"
        icon="bi-x-circle"
        loading={changingStatus}
        onClose={() => {
          setCancelOpen(false);
          setError('');
        }}
        onConfirm={() => void confirmCancel()}
      />

      <ConfirmationModal
        open={statusTarget !== null}
        title={statusModalInfo.title}
        message={statusModalInfo.message}
        detail={
          <>
            <div className="fw-semibold">Turno {turno.codigo_turno}</div>
            <div className="text-muted small mt-1">
              {turno.paciente.persona.apellidos}, {turno.paciente.persona.nombres}
            </div>
          </>
        }
        confirmText={statusModalInfo.confirmText}
        variant={statusModalInfo.variant}
        icon={statusModalInfo.icon}
        loading={changingStatus}
        onClose={() => setStatusTarget(null)}
        onConfirm={() => void confirmStatusChange()}
      />

      <div className="mb-4">
        <button
          type="button"
          className="btn btn-outline-secondary mb-3 d-inline-flex align-items-center"
          onClick={() =>
            navigate(
              '/turnos',
            )
          }
        >
          <i className="bi bi-arrow-left me-2" />
          Volver a turnos
        </button>

        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h2 className="fw-bold mb-1">
              Turno{' '}
              {turno.codigo_turno}
            </h2>

            <p className="text-muted mb-0">
              {formatDateTime(
                turno.fecha_hora_inicio,
              )}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <ConnectionStatusBadge />
            <span
              className={getEstadoClass(
                turno.estado
                  .codigo,
              )}
            >
              {
                turno.estado
                  .nombre
              }
            </span>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-8">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-calendar-event me-2 text-success" />
                Información del turno
              </h5>
            </div>

            <div className="card-body">
              <div className="turno-detail-grid">
                <div>
                  <span>Fecha y hora</span>

                  <strong>
                    {formatDateTime(
                      turno.fecha_hora_inicio,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Finalización</span>

                  <strong>
                    {formatDateTime(
                      turno.fecha_hora_fin,
                    )}
                  </strong>
                </div>

                <div>
                  <span>Paciente</span>

                  <strong>
                    {
                      turno
                        .paciente
                        .persona
                        .apellidos
                    }
                    ,{' '}
                    {
                      turno
                        .paciente
                        .persona
                        .nombres
                    }
                  </strong>

                  <small>
                    DNI{' '}
                    {
                      turno
                        .paciente
                        .persona
                        .dni
                    }
                  </small>
                </div>

                <div>
                  <span>Profesional</span>

                  <strong>
                    {
                      turno
                        .profesional
                        .persona
                        .apellidos
                    }
                    ,{' '}
                    {
                      turno
                        .profesional
                        .persona
                        .nombres
                    }
                  </strong>

                  <small>
                    Matrícula{' '}
                    {
                      turno
                        .profesional
                        .matricula
                    }
                  </small>
                </div>

                <div>
                  <span>Especialidad</span>

                  <strong>
                    {
                      turno
                        .especialidad
                        .nombre
                    }
                  </strong>
                </div>

                <div>
                  <span>Salita</span>

                  <strong>
                    {
                      turno
                        .salita
                        .nombre
                    }
                  </strong>

                  {turno.salita
                    .direccion && (
                    <small>
                      {
                        turno
                          .salita
                          .direccion
                      }
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-chat-left-text me-2 text-success" />
                Consulta
              </h5>
            </div>

            <div className="card-body">
              <div className="mb-4">
                <span className="turno-detail-label">
                  Motivo de consulta
                </span>

                <p className="mb-0">
                  {
                    turno.motivo_consulta ||
                    'Sin motivo informado.'
                  }
                </p>
              </div>

              <div>
                <span className="turno-detail-label">
                  Observaciones
                </span>

                <p className="mb-0">
                  {
                    turno.observaciones ||
                    'Sin observaciones.'
                  }
                </p>
              </div>

              {turno.motivo_cancelacion && (
                <div className="alert alert-danger mt-4 mb-0">
                  <strong>
                    Motivo de cancelación:
                  </strong>{' '}
                  {
                    turno.motivo_cancelacion
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightning me-2 text-success" />
                Acciones
              </h5>
            </div>

            <div className="card-body d-flex flex-column gap-2">
              {!isFinal && (
                <>
                  {turno.estado.codigo === 'SOLICITADO' && (
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      disabled={
                        changingStatus
                      }
                      onClick={() =>
                        void handleStatusChange(
                          'CONFIRMADO',
                        )
                      }
                    >
                      <i className="bi bi-check-circle me-2" />
                      Confirmar turno
                    </button>
                  )}

                  {turno.estado.codigo !== 'EN_ESPERA' && (
                    <button
                      type="button"
                      className="btn btn-outline-warning"
                      disabled={
                        changingStatus
                      }
                      onClick={() =>
                        void handleStatusChange(
                          'EN_ESPERA',
                        )
                      }
                    >
                      <i className="bi bi-hourglass-split me-2" />
                      Pasar a espera
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={
                      changingStatus
                    }
                    onClick={() =>
                      void handleStatusChange(
                        'NO_ASISTIO',
                      )
                    }
                  >
                    <i className="bi bi-person-x me-2" />
                    Registrar inasistencia
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    disabled={
                      changingStatus
                    }
                    onClick={
                      handleReprogramar
                    }
                  >
                    <i className="bi bi-calendar2-week me-2" />
                    Reprogramar turno
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    disabled={
                      changingStatus
                    }
                    onClick={() =>
                      void handleCancel()
                    }
                  >
                    <i className="bi bi-x-circle me-2" />
                    Cancelar turno
                  </button>
                </>
              )}

              {isFinal && (
                <div className="turno-final-message">
                  <i className="bi bi-lock me-2" />
                  Este turno tiene un estado
                  final y no admite
                  modificaciones.
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-info-circle me-2 text-success" />
                Estado
              </h5>
            </div>

            <div className="card-body">
              <div className="turno-state-card">
                <span
                  className={getEstadoClass(
                    turno.estado
                      .codigo,
                  )}
                >
                  {
                    turno.estado
                      .nombre
                  }
                </span>

                <p className="text-muted mb-0 mt-3">
                  {
                    turno.estado
                      .es_estado_final
                      ? 'El estado actual es final.'
                      : 'El turno todavía puede ser modificado.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnoDetallePage;