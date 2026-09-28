import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  deleteProfessional,
  getProfessionals,
} from '../../services/profesionales.service';

import type {
  Professional,
} from '../../types/profesional.types';

import '../../styles/profesionales.css';

const ProfesionalesPage = () => {
  const navigate = useNavigate();

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
  const [message, setMessage] = useState('');

  const loadProfessionals = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfessionals();
  }, []);

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

  const handleDelete = async (
    professional: Professional,
  ) => {
    const fullName =
      `${professional.persona.apellidos}, ${professional.persona.nombres}`;

    const confirmed = window.confirm(
      `¿Está seguro de que desea desactivar al profesional ${fullName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await deleteProfessional(
        professional.id_profesional,
      );

      setMessage(
        'Profesional desactivado correctamente.',
      );

      await loadProfessionals();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo actualizar el estado del profesional.',
      );
    }
  };

  return (
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
          className="alert alert-success"
          role="alert"
        >
          <i className="bi bi-check-circle me-2" />
          {message}
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
                                )
                              }
                            >
                              <i className="bi bi-pencil" />
                            </button>

                            {professional.activo && (
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
  );
};

export default ProfesionalesPage;