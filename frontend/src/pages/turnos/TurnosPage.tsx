import { getEstadoClass } from '../../utils/turno-status';
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import ConnectionStatusBadge from '../../components/ui/ConnectionStatusBadge';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import { useAutoDismiss } from '../../utils/useAutoDismiss';

import {
  getTurnos,
  changeTurnoStatus,
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

import {
  getCatalogo,
} from '../../services/configuracion.service';

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
  CatalogoRegistro,
} from '../../types/configuracion.types';

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

  const [especialidades, setEspecialidades] =
    useState<CatalogoRegistro[]>([]);

  const [fecha, setFecha] =
    useState('');

  const [professionalId, setProfessionalId] =
    useState('');

  const [specialtyId, setSpecialtyId] =
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

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingFilters, setLoadingFilters] =
    useState(true);

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const { ultimoEvento, resyncTick } = useAgendaSocket();
  const initialLoadedRef = useRef(false);
  const requestId = useRef(0);
  const lastFiltersRef = useRef<string>('');

  useAutoDismiss(message, setMessage, 15_000, Boolean(message));
  useAutoDismiss(error, setError, 15_000, Boolean(error));

  const loadTurnos = async (
    page = 1,
    isBackground = false,
    salitaIdOverride?: string,
    force = false
  ) => {
    const currentSalita = salitaIdOverride !== undefined ? salitaIdOverride : salitaId;
    const filtersKey = `${page}-${fecha}-${professionalId}-${specialtyId}-${patientId}-${currentSalita}-${estado}-${appliedSearch}`;

    // Evita consultas duplicadas si los filtros y página no han cambiado, salvo que sea forzada por WebSocket/acción
    if (!force && lastFiltersRef.current === filtersKey) {
      return;
    }
    lastFiltersRef.current = filtersKey;

    const currentRequest = ++requestId.current;

    try {
      // Muestra spinner solo si no hay datos previos en pantalla; si ya hay datos, refresca suavemente
      if (!isBackground && turnos.length === 0) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');

      const response = await getTurnos(
        {
          fecha: fecha || undefined,
          id_profesional: professionalId || undefined,
          id_especialidad: specialtyId || undefined,
          id_paciente: patientId || undefined,
          id_salita: currentSalita || undefined,
          estado: estado || undefined,
          search: appliedSearch || undefined,
          page,
          limit: 20,
        },
        force
      );

      if (currentRequest !== requestId.current) {
        return;
      }

      setTurnos(response.data.turnos);
      setPagination(response.data.pagination);
    } catch (error) {
      if (currentRequest === requestId.current) {
        console.error(error);
        setError('No se pudieron cargar los turnos.');
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Carga inicial coordinada de catálogos y primera consulta única
  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        setLoadingFilters(true);
        setError('');

        const [
          professionalsResponse,
          salitasResponse,
          especialidadesResponse,
        ] = await Promise.all([
          getProfessionals(),
          getAdminSalitas(),
          getCatalogo('especialidades'),
        ]);

        if (!active) return;

        setProfessionals(professionalsResponse.data);
        setSalitas(salitasResponse.data);
        setEspecialidades(especialidadesResponse.filter((item) => item.activo));

        let initialSalita = salitaId;
        if (salitasResponse.data.length === 1 && !salitaId) {
          initialSalita = salitasResponse.data[0].id_salita;
          setSalitaId(initialSalita);
        }

        // Carga diferida en segundo plano para el dropdown de pacientes
        getPatients(1, 20)
          .then((res) => {
            if (active) setPatients(res.data.patients);
          })
          .catch(() => undefined);

        initialLoadedRef.current = true;
        setLoadingFilters(false);

        // Primera consulta única con la salita resuelta
        await loadTurnos(1, false, initialSalita);
      } catch (err) {
        if (active) {
          console.error(err);
          setError('No se pudieron cargar los datos iniciales.');
          setLoadingFilters(false);
          setLoading(false);
        }
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, []);

  // Consultas subsecuentes disparadas por cambios en filtros
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    void loadTurnos(1);
  }, [
    fecha,
    professionalId,
    specialtyId,
    patientId,
    salitaId,
    estado,
    appliedSearch,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  // Actualización reactiva granular ante eventos de WebSocket (sin spinner intrusivo)
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    if (ultimoEvento) {
      if (ultimoEvento.id_turno && ultimoEvento.estado) {
        setTurnos((prev) =>
          prev.map((t) =>
            t.id_turno === ultimoEvento.id_turno
              ? {
                  ...t,
                  estado: {
                    ...t.estado,
                    codigo: ultimoEvento.estado!,
                    nombre:
                      estadoOptions.find((e) => e.value === ultimoEvento.estado)?.label ||
                      ultimoEvento.estado!,
                  },
                }
              : t
          )
        );
      }
      void loadTurnos(pagination.page, true, undefined, true);
    }
  }, [ultimoEvento]);

  // Resincronización al reconectar
  useEffect(() => {
    if (resyncTick > 0 && initialLoadedRef.current) {
      void loadTurnos(pagination.page, true, undefined, true);
    }
  }, [resyncTick]);

  const handleQuickArrival = async (turnoId: string, pacienteNombre: string) => {
    try {
      setActionLoadingId(turnoId);
      setError('');
      await changeTurnoStatus(turnoId, { estado: 'EN_ESPERA' });
      setMessage(`Se registró la llegada de ${pacienteNombre}. El turno pasó a sala de espera.`);
      await loadTurnos(pagination.page, true, undefined, true);
    } catch (cause) {
      console.error(cause);
      setError('No se pudo registrar la llegada del paciente.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const clearFilters =
    () => {
      setFecha('');
      setProfessionalId('');
      setSpecialtyId('');
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
                />

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
                Especialidad
              </label>

              <select
                className="form-select"
                value={specialtyId}
                onChange={(event) =>
                  setSpecialtyId(event.target.value)
                }
                disabled={loadingFilters}
              >
                <option value="">Todas</option>
                {especialidades.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
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
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0 fw-bold">
              Turnos registrados
            </h5>

            <div className="d-flex align-items-center gap-2">
              <ConnectionStatusBadge />
              {refreshing && (
                <span className="text-muted small d-inline-flex align-items-center gap-1">
                  <span className="spinner-border spinner-border-sm text-success" role="status" />
                  Sincronizando...
                </span>
              )}
              <span className="badge bg-light text-dark">
                {pagination.total}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading && turnos.length === 0 ? (
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
                          <div className="d-inline-flex align-items-center gap-1 justify-content-end">
                            {(turno.estado.codigo === 'SOLICITADO' || turno.estado.codigo === 'CONFIRMADO') && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-warning text-dark d-inline-flex align-items-center"
                                title="Marcar llegada / en sala de espera"
                                disabled={actionLoadingId === turno.id_turno}
                                onClick={() =>
                                  void handleQuickArrival(
                                    turno.id_turno,
                                    `${turno.paciente.persona.apellidos}, ${turno.paciente.persona.nombres}`
                                  )
                                }
                              >
                                {actionLoadingId === turno.id_turno ? (
                                  <span className="spinner-border spinner-border-sm me-1" role="status" />
                                ) : (
                                  <i className="bi bi-box-arrow-in-right me-1 text-warning" />
                                )}
                                <span className="d-none d-md-inline">Llegó</span>
                              </button>
                            )}

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
