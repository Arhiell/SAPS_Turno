import { getEstadoClass } from '../../utils/turno-status';
import {
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

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

  const loadTurno =
    async () => {
      if (!id) {
        setError(
          'No se especificó el turno.',
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
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

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setMessage('');
        },
        3500,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [message]);

  const handleCancel =
    async () => {
      if (!id || !turno) {
        return;
      }

      const motivo =
        window.prompt(
          'Ingrese el motivo de cancelación:',
        );

      if (
        motivo === null
      ) {
        return;
      }

      if (
        !motivo.trim()
      ) {
        setError(
          'Debe indicar un motivo de cancelación.',
        );
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
              motivo.trim(),
          },
        );

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

  const handleStatusChange =
    async (
      newStatus: string,
    ) => {
      if (!id) {
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
              newStatus,
          },
        );

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

  return (
    <div className="turnos-page">
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-link text-decoration-none p-0 mb-3"
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

      {message && (
        <div className="alert alert-success">
          <i className="bi bi-check-circle me-2" />
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

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