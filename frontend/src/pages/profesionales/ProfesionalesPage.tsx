import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  deleteProfessional,
  getProfessionals,
  updateProfessional,
} from '../../services/profesionales.service';

import type {
  Professional,
} from '../../types/profesional.types';

import '../../styles/profesionales.css';

interface ProfesionalesLocationState {
  message?: string;
  messageTitle?: string;
  professional?: Professional;
}

const ProfesionalesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationState =
    (location.state as ProfesionalesLocationState | null) ??
    null;

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>(
      'TODOS',
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState('');
  const [message, setMessage] = useState(
    navigationState?.message ?? '',
  );

  const [messageTitle, setMessageTitle] = useState(
    navigationState?.messageTitle ?? 'Operación completada',
  );

  const [deactivationTarget, setDeactivationTarget] =
    useState<Professional | null>(null);

  const [deactivating, setDeactivating] =
    useState(false);

  const [activationTarget, setActivationTarget] =
    useState<Professional | null>(null);

  const [activating, setActivating] =
    useState(false);

  const loadProfessionals = async (
    showLoading = true,
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError('');

      const response =
        await getProfessionals();

      setProfessionals(response.data);
    } catch (error) {
      console.error(error);

      setError(
        'No se pudieron cargar los profesionales.',
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadProfessionals();
  }, []);

  useEffect(() => {
    if (navigationState?.message) {
      setMessage(navigationState.message);
      setMessageTitle(
        navigationState.messageTitle ??
          'Operación completada',
      );
    }
  }, [navigationState?.message, navigationState?.messageTitle]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage('');
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  const filteredProfessionals =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      return professionals.filter(
        (professional) => {
          const person =
            professional.persona;

          const matchesSearch =
            !value ||
            person.dni
              .toLowerCase()
              .includes(value) ||
            person.nombres
              .toLowerCase()
              .includes(value) ||
            person.apellidos
              .toLowerCase()
              .includes(value) ||
            professional.matricula
              .toLowerCase()
              .includes(value);

          const matchesStatus =
            statusFilter === 'TODOS' ||
            (statusFilter === 'ACTIVOS' &&
              professional.activo) ||
            (statusFilter === 'INACTIVOS' &&
              !professional.activo);

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      professionals,
      search,
      statusFilter,
    ]);

  const handleDelete = (
    professional: Professional,
  ) => {
    setDeactivationTarget(professional);
  };

  const confirmDeactivation = async () => {
    if (
      !deactivationTarget ||
      deactivating
    ) {
      return;
    }

    const professionalId =
      deactivationTarget.id_profesional;

    try {
      setDeactivating(true);
      setError('');

      await deleteProfessional(
        professionalId,
      );

      setDeactivationTarget(null);

      setMessageTitle(
        'Profesional desactivado',
      );

      setMessage(
        'El profesional se desactivó correctamente.',
      );

      await loadProfessionals(false);
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo actualizar el estado del profesional.',
      );
    } finally {
      setDeactivating(false);
    }
  };

  const handleActivate = (
    professional: Professional,
  ) => {
    setActivationTarget(professional);
  };

  const confirmActivation = async () => {
    if (
      !activationTarget ||
      activating
    ) {
      return;
    }

    const professionalId =
      activationTarget.id_profesional;

    try {
      setActivating(true);
      setError('');

      await updateProfessional(
        professionalId,
        {
          activo: true,
          fecha_baja: null,
        },
      );

      setActivationTarget(null);

      setMessageTitle(
        'Profesional activado',
      );

      setMessage(
        'El profesional se activó correctamente.',
      );

      await loadProfessionals(false);
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo activar al profesional.',
      );
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      {activationTarget && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{
              zIndex: 1050,
            }}
          />

          <div
            className="modal d-block fade show"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activate-professional-title"
            style={{
              zIndex: 1055,
            }}
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !activating
              ) {
                setActivationTarget(null);
              }
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              style={{
                width: '100%',
                maxWidth: '520px',
                margin: '1rem auto',
              }}
            >
              <div className="modal-content border-0 shadow-lg">
                <div
                  className="modal-header border-0 pb-2 position-relative"
                  style={{
                    padding:
                      '20px 56px 10px 20px',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-success-subtle text-success"
                      style={{
                        width: '48px',
                        height: '48px',
                        flexShrink: 0,
                      }}
                    >
                      <i className="bi bi-person-check fs-5" />
                    </div>

                    <div>
                      <h5
                        className="modal-title fw-bold mb-1"
                        id="activate-professional-title"
                      >
                        Activar profesional
                      </h5>

                      <p className="text-muted mb-0 small">
                        Esta acción requiere confirmación.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close position-absolute"
                    aria-label="Cerrar"
                    disabled={activating}
                    onClick={() =>
                      setActivationTarget(null)
                    }
                    style={{
                      top: '18px',
                      right: '18px',
                    }}
                  />
                </div>

                <div
                  className="modal-body pt-2"
                  style={{
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  <p className="mb-2">
                    ¿Querés volver a activar al profesional?
                  </p>

                  <div className="bg-light border rounded p-3">
                    <div className="fw-semibold">
                      {
                        activationTarget.persona
                          .apellidos
                      }
                      ,{' '}
                      {
                        activationTarget.persona
                          .nombres
                      }
                    </div>

                    <div className="text-muted small mt-1">
                      Matrícula:{' '}
                      {
                        activationTarget.matricula
                      }
                    </div>
                  </div>

                  <div className="alert alert-success d-flex align-items-start gap-2 mt-3 mb-0 py-2">
                    <i className="bi bi-info-circle-fill mt-1" />

                    <small>
                      El profesional volverá a figurar como
                      activo y podrá ser utilizado en las
                      operaciones correspondientes del sistema.
                    </small>
                  </div>
                </div>

                <div
                  className="modal-footer border-0 pt-0"
                  style={{
                    padding:
                      '8px 20px 20px',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={activating}
                    style={{
                      minWidth: '96px',
                    }}
                    onClick={() =>
                      setActivationTarget(null)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    disabled={activating}
                    style={{
                      minWidth: '170px',
                    }}
                    onClick={() =>
                      void confirmActivation()
                    }
                  >
                    {activating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Activando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-check me-2" />
                        Activar profesional
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {deactivationTarget && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{
              zIndex: 1050,
            }}
          />

          <div
            className="modal d-block fade show"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-professional-title"
            style={{
              zIndex: 1055,
            }}
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !deactivating
              ) {
                setDeactivationTarget(null);
              }
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              style={{
                width: '100%',
                maxWidth: '520px',
                margin: '1rem auto',
              }}
            >
              <div className="modal-content border-0 shadow-lg">

                <div
                  className="modal-header border-0 pb-2 position-relative"
                  style={{
                    padding:
                      '20px 56px 10px 20px',
                  }}
                >
                  <div className="d-flex align-items-center gap-3">

                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center bg-warning-subtle text-warning"
                      style={{
                        width: '48px',
                        height: '48px',
                        flexShrink: 0,
                      }}
                    >
                      <i className="bi bi-person-dash fs-5" />
                    </div>

                    <div>
                      <h5
                        className="modal-title fw-bold mb-1"
                        id="deactivate-professional-title"
                      >
                        Desactivar profesional
                      </h5>

                      <p className="text-muted mb-0 small">
                        Esta acción requiere confirmación.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-close position-absolute"
                    aria-label="Cerrar"
                    disabled={deactivating}
                    onClick={() =>
                      setDeactivationTarget(null)
                    }
                    style={{
                      top: '18px',
                      right: '18px',
                    }}
                  />
                </div>

                <div
                  className="modal-body pt-2"
                  style={{
                    paddingLeft: '20px',
                    paddingRight: '20px',
                  }}
                >
                  <p className="mb-2">
                    ¿Querés desactivar al profesional?
                  </p>

                  <div className="bg-light border rounded p-3">
                    <div className="fw-semibold">
                      {
                        deactivationTarget.persona
                          .apellidos
                      }
                      ,{' '}
                      {
                        deactivationTarget.persona
                          .nombres
                      }
                    </div>

                    <div className="text-muted small mt-1">
                      Matrícula:{' '}
                      {
                        deactivationTarget.matricula
                      }
                    </div>
                  </div>

                  <div className="alert alert-warning d-flex align-items-start gap-2 mt-3 mb-0 py-2">
                    <i className="bi bi-info-circle-fill mt-1" />

                    <small>
                      El profesional quedará inactivo,
                      pero sus datos e historial se
                      conservarán en el sistema.
                    </small>
                  </div>
                </div>

                <div
                  className="modal-footer border-0 pt-0"
                  style={{
                    padding:
                      '8px 20px 20px',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={deactivating}
                    style={{
                      minWidth: '96px',
                    }}
                    onClick={() =>
                      setDeactivationTarget(null)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={deactivating}
                    style={{
                      minWidth: '180px',
                    }}
                    onClick={() =>
                      void confirmDeactivation()
                    }
                  >
                    {deactivating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        />
                        Desactivando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-dash me-2" />
                        Desactivar profesional
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

      <div className="profesionales-page">
      <div className="d-flex justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            Profesionales
          </h2>

          <p className="text-muted mb-0">
            Administración de profesionales de
            las salitas.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate(
              '/profesionales/nuevo',
            )
          }
        >
          <i className="bi bi-person-plus me-2" />
          Nuevo profesional
        </button>
      </div>

      {message && (
        <div
          className="alert alert-success d-flex align-items-start gap-3"
          role="alert"
        >
          <i className="bi bi-check-circle-fill mt-1" />

          <div className="flex-grow-1">
            <div className="fw-semibold mb-1">
              {messageTitle}
            </div>

            <div>
              {message}
            </div>
          </div>

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() => setMessage('')}
          />
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-8">
              <label className="form-label">
                Buscar
              </label>

              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search" />
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="DNI, nombre, apellido o matrícula"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                />
              </div>
            </div>

            <div className="col-lg-4">
              <label className="form-label">
                Estado
              </label>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'TODOS'
                      | 'ACTIVOS'
                      | 'INACTIVOS',
                  )
                }
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="ACTIVOS">
                  Activos
                </option>

                <option value="INACTIVOS">
                  Inactivos
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              Profesionales registrados
            </h5>

            <span className="badge bg-light text-dark">
              {filteredProfessionals.length}
            </span>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
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
          ) : filteredProfessionals.length ===
            0 ? (
            <div className="professional-empty">
              <div className="professional-empty-icon">
                <i className="bi bi-person-badge" />
              </div>

              <h5>
                No hay profesionales
              </h5>

              <p className="text-muted mb-3">
                No se encontraron profesionales
                con los filtros actuales.
              </p>

              <button
                type="button"
                className="btn btn-saps"
                onClick={() =>
                  navigate(
                    '/profesionales/nuevo',
                  )
                }
              >
                Registrar profesional
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table saps-responsive-table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Profesional</th>
                    <th scope="col">DNI</th>
                    <th scope="col">Matrícula</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProfessionals.map(
                    (professional) => (
                      <tr
                        key={
                          professional.id_profesional
                        }
                      >
                        <td data-label="Profesional">
                          <div className="professional-name-cell">
                            <div className="professional-avatar">
                              <i className="bi bi-person" />
                            </div>

                            <div>
                              <strong>
                                {
                                  professional
                                    .persona
                                    .apellidos
                                }
                                ,{' '}
                                {
                                  professional
                                    .persona
                                    .nombres
                                }
                              </strong>

                              <small>
                                {
                                  professional
                                    .persona
                                    .email
                                }
                              </small>
                            </div>
                          </div>
                        </td>

                        <td data-label="DNI">
                          {
                            professional.persona
                              .dni
                          }
                        </td>

                        <td data-label="Matrícula">
                          <span className="professional-license">
                            {professional.matricula}
                          </span>
                        </td>

                        <td data-label="Teléfono">
                          {professional.persona
                            .telefono ||
                            '—'}
                        </td>

                        <td data-label="Estado">
                          {professional.activo ? (
                            <span className="badge bg-success-subtle text-success">
                              Activo
                            </span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary">
                              Inactivo
                            </span>
                          )}
                        </td>

                        <td data-label="Acciones">
                          <div className="d-flex justify-content-end gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              title="Ver detalle"
                              onClick={() =>
                                navigate(
                                  `/profesionales/${professional.id_profesional}`,
                                )
                              }
                            >
                              <i className="bi bi-eye" />
                            </button>

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Editar"
                              onClick={() =>
                                navigate(
                                  `/profesionales/${professional.id_profesional}/editar`,
                                  {
                                    state: {
                                      professional,
                                      returnTo:
                                        '/profesionales',
                                      returnLabel:
                                        'Volver a profesionales',
                                    },
                                  },
                                )
                              }
                            >
                              <i className="bi bi-pencil" />
                            </button>

                            {professional.activo ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title="Desactivar"
                                onClick={() =>
                                  void handleDelete(
                                    professional,
                                  )
                                }
                              >
                                <i className="bi bi-person-dash" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                title="Activar"
                                onClick={() =>
                                  void handleActivate(
                                    professional,
                                  )
                                }
                              >
                                <i className="bi bi-person-check" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default ProfesionalesPage;