import { getEstadoClass } from '../../utils/turno-status';
import {
  useEffect,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getTurnos,
} from '../../services/turnos.service';

import {
  getPatients,
} from '../../services/patients.service';

import {
  getProfessionals,
} from '../../services/profesionales.service';

import {
  getAdminSalitas,
} from '../../services/salitas.service';

import type {
  Patient,
} from '../../types/patient.types';

import type {
  Professional,
} from '../../types/profesional.types';

import type {
  Salita,
} from '../../types/salita.types';

import type {
  Turno,
  TurnosPagination,
} from '../../types/turno.types';

import '../../styles/turnos.css';

const estadoOptions = [
  {
    value: 'SOLICITADO',
    label: 'Solicitado',
  },
  {
    value: 'CONFIRMADO',
    label: 'Confirmado',
  },
  {
    value: 'EN_ESPERA',
    label: 'En espera',
  },
  {
    value: 'ATENDIDO',
    label: 'Atendido',
  },
  {
    value: 'NO_ASISTIO',
    label: 'No asistió',
  },
  {
    value: 'CANCELADO',
    label: 'Cancelado',
  },
  {
    value: 'REPROGRAMADO',
    label: 'Reprogramado',
  },
];


const formatDateTime = (
  value: string,
) => {
  return new Date(
    value,
  ).toLocaleString(
    'es-AR',
    {
      dateStyle: 'short',
      timeStyle: 'short',
    },
  );
};

const getToday = () => {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const TurnosPage = () => {
  const navigate =
    useNavigate();

  const [turnos, setTurnos] =
    useState<Turno[]>([]);

  const [pagination, setPagination] =
    useState<TurnosPagination>({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

  const [patients, setPatients] =
    useState<Patient[]>([]);

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  const [salitas, setSalitas] =
    useState<Salita[]>([]);

  const [fecha, setFecha] =
    useState('');

  const [professionalId, setProfessionalId] =
    useState('');

  const [patientId, setPatientId] =
    useState('');

  const [salitaId, setSalitaId] =
    useState('');

  const [estado, setEstado] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [appliedSearch, setAppliedSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [loadingFilters, setLoadingFilters] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const loadFilters =
    async () => {
      try {
        setLoadingFilters(true);
        setError('');

        const [
          patientsResponse,
          professionalsResponse,
          salitasResponse,
        ] = await Promise.all([
          getPatients(1, 100),
          getProfessionals(),
          getAdminSalitas(),
        ]);

        setPatients(
          patientsResponse.data.patients,
        );

        setProfessionals(
          professionalsResponse.data,
        );

        setSalitas(
          salitasResponse.data,
        );
      } catch (error) {
        console.error(error);

        setError(
          'No se pudieron cargar los filtros.',
        );
      } finally {
        setLoadingFilters(false);
      }
    };

  const loadTurnos =
    async (
      page = 1,
    ) => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getTurnos({
            fecha:
              fecha || undefined,
            id_profesional:
              professionalId ||
              undefined,
            id_paciente:
              patientId ||
              undefined,
            id_salita:
              salitaId ||
              undefined,
            estado:
              estado || undefined,
            search:
              appliedSearch ||
              undefined,
            page,
            limit: 20,
          });

        setTurnos(
          response.data.turnos,
        );

        setPagination(
          response.data.pagination,
        );
      } catch (error) {
        console.error(error);

        setError(
          'No se pudieron cargar los turnos.',
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadFilters();
  }, []);

  useEffect(() => {
    void loadTurnos(1);
  }, [
    fecha,
    professionalId,
    patientId,
    salitaId,
    estado,
    appliedSearch,
  ]);

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

  const clearFilters =
    () => {
      setFecha('');
      setProfessionalId('');
      setPatientId('');
      setSalitaId('');
      setEstado('');
      setSearch('');
      setAppliedSearch('');
    };

  const handleToday =
    () => {
      setFecha(
        getToday(),
      );
    };

  const handleSearch =
    () => {
      setAppliedSearch(
        search.trim(),
      );
    };

  const handleClearSearch =
    () => {
      setSearch('');
      setAppliedSearch('');
    };

  return (
    <div className="turnos-page">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Turnos
          </h2>

          <p className="text-muted mb-0">
            Gestión y seguimiento de
            turnos médicos.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate(
              '/turnos/nuevo',
            )
          }
        >
          <i className="bi bi-calendar-plus me-2" />
          Nuevo turno
        </button>
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

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-funnel me-2 text-success" />
              Filtros
            </h5>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={clearFilters}
            >
              <i className="bi bi-x-lg me-1" />
              Limpiar
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-lg-6">
              <label className="form-label">
                Buscar paciente
              </label>

              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>

                <input
                  type="search"
                  className="form-control"
                  placeholder="DNI, apellido o nombre completo"
                  aria-label="Buscar paciente por DNI, apellido o nombre completo"
                  maxLength={150}
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />

                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={handleSearch}
                >
                  Buscar
                </button>

                {appliedSearch && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleClearSearch}
                    title="Limpiar busqueda"
                  >
                    <i className="bi bi-x-lg" />
                  </button>
                )}
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                Fecha
              </label>

              <div className="input-group">
                <input
                  type="date"
                  className="form-control"
                  value={fecha}
                  onChange={(event) =>
                    setFecha(
                      event.target.value,
                    )
                  }
                />

                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={handleToday}
                  title="Hoy"
                >
                  Hoy
                </button>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                Profesional
              </label>

              <select
                className="form-select"
                value={professionalId}
                onChange={(event) =>
                  setProfessionalId(
                    event.target.value,
                  )
                }
                disabled={
                  loadingFilters
                }
              >
                <option value="">
                  Todos
                </option>

                {professionals
                  .filter(
                    (item) =>
                      item.activo,
                  )
                  .map(
                    (item) => (
                      <option
                        key={
                          item.id_profesional
                        }
                        value={
                          item.id_profesional
                        }
                      >
                        {
                          item.persona
                            .apellidos
                        }
                        ,{' '}
                        {
                          item.persona
                            .nombres
                        }
                      </option>
                    ),
                  )}
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                Paciente
              </label>

              <select
                className="form-select"
                value={patientId}
                onChange={(event) =>
                  setPatientId(
                    event.target.value,
                  )
                }
                disabled={
                  loadingFilters
                }
              >
                <option value="">
                  Todos
                </option>

                {patients
                  .filter(
                    (item) =>
                      item.activo,
                  )
                  .map(
                    (item) => (
                      <option
                        key={
                          item.id_paciente
                        }
                        value={
                          item.id_paciente
                        }
                      >
                        {item.apellidos},{' '}
                        {item.nombres} —{' '}
                        {item.dni}
                      </option>
                    ),
                  )}
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                Salita
              </label>

              <select
                className="form-select"
                value={salitaId}
                onChange={(event) =>
                  setSalitaId(
                    event.target.value,
                  )
                }
                disabled={
                  loadingFilters
                }
              >
                <option value="">
                  Todas
                </option>

                {salitas
                  .filter(
                    (item) =>
                      item.activo,
                  )
                  .map(
                    (item) => (
                      <option
                        key={
                          item.id_salita
                        }
                        value={
                          item.id_salita
                        }
                      >
                        {item.nombre}
                      </option>
                    ),
                  )}
              </select>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="form-label">
                Estado
              </label>

              <select
                className="form-select"
                value={estado}
                onChange={(event) =>
                  setEstado(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Todos
                </option>

                {estadoOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              Turnos registrados
            </h5>

            <span className="badge bg-light text-dark">
              {pagination.total}
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
          ) : turnos.length ===
            0 ? (
            <div className="turno-empty">
              <div className="turno-empty-icon">
                <i className="bi bi-calendar-x" />
              </div>

              <h5>
                No hay turnos
              </h5>

              <p className="text-muted mb-3">
                No se encontraron turnos
                con los filtros seleccionados.
              </p>

              <button
                type="button"
                className="btn btn-saps"
                onClick={() =>
                  navigate(
                    '/turnos/nuevo',
                  )
                }
              >
                Crear nuevo turno
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table saps-responsive-table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Fecha y hora</th>
                    <th scope="col">Paciente</th>
                    <th scope="col">Profesional</th>
                    <th scope="col">Especialidad</th>
                    <th scope="col">Salita</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="text-end">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {turnos.map(
                    (turno) => (
                      <tr
                        key={
                          turno.id_turno
                        }
                      >
                        <td data-label="Fecha y hora">
                          <strong>
                            {formatDateTime(
                              turno.fecha_hora_inicio,
                            )}
                          </strong>

                          <small className="d-block text-muted">
                            {turno.codigo_turno}
                          </small>
                        </td>

                        <td data-label="Paciente">
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

                          <small className="d-block text-muted">
                            DNI{' '}
                            {
                              turno
                                .paciente
                                .persona
                                .dni
                            }
                          </small>
                        </td>

                        <td data-label="Profesional">
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
                        </td>

                        <td data-label="Especialidad">
                          {
                            turno
                              .especialidad
                              .nombre
                          }
                        </td>

                        <td data-label="Salita">
                          {
                            turno
                              .salita
                              .nombre
                          }
                        </td>

                        <td data-label="Estado">
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
                        </td>

                        <td data-label="Acción" className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            title="Ver turno"
                            onClick={() =>
                              navigate(
                                `/turnos/${turno.id_turno}`,
                              )
                            }
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages >
          1 && (
          <div className="card-footer bg-white border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Página{' '}
                {pagination.page} de{' '}
                {pagination.totalPages}
              </small>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={
                    pagination.page <=
                    1
                  }
                  onClick={() =>
                    void loadTurnos(
                      pagination.page -
                        1,
                    )
                  }
                >
                  <i className="bi bi-chevron-left me-1" />
                  Anterior
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  disabled={
                    pagination.page >=
                    pagination.totalPages
                  }
                  onClick={() =>
                    void loadTurnos(
                      pagination.page +
                        1,
                    )
                  }
                >
                  Siguiente
                  <i className="bi bi-chevron-right ms-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnosPage;
