import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getPatientByDni,
  getPatients,
  updatePatientStatus,
} from '../../services/patients.service';

import type {
  Patient,
  PatientPagination,
} from '../../types/patient.types';

const PacientesPage = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] =
    useState<PatientPagination | null>(null);

  const [page, setPage] = useState(1);
  const [dni, setDni] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getPatients(page, 10);

      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error(error);
      setError(
        'No se pudieron cargar los pacientes.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();
  }, [page]);

  const handleSearch = async () => {
    const dniValue = dni.trim();

    if (!dniValue) {
      setPage(1);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await getPatientByDni(dniValue);

      setPatients([response.data.patient]);

      setPagination({
        page: 1,
        limit: 1,
        total: 1,
        totalPages: 1,
      });
    } catch (error) {
      console.error(error);

      setPatients([]);
      setPagination(null);
      setError(
        'No se encontró un paciente con ese DNI.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setDni('');
    setPage(1);
  };

  const handleStatusChange = async (
    patient: Patient,
  ) => {
    const action = patient.activo
      ? 'desactivar'
      : 'activar';

    const confirmed = window.confirm(
      `¿Está seguro de que desea ${action} al paciente ${patient.apellidos}, ${patient.nombres}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      await updatePatientStatus(
        patient.id_paciente,
        !patient.activo,
      );

      await loadPatients();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo actualizar el estado del paciente.',
      );
    }
  };

  const handleViewPatient = (id: string) => {
    navigate(`/pacientes/${id}`);
  };

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Pacientes
          </h2>

          <p className="text-muted mb-0">
            Administración de pacientes registrados.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-saps"
          onClick={() =>
            navigate('/pacientes/nuevo')
          }
        >
          <i className="bi bi-person-plus me-2" />
          Nuevo paciente
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-2">

            <div className="col-md-8">
              <input
                type="text"
                className="form-control"
                placeholder="Buscar paciente por DNI"
                value={dni}
                onChange={(event) =>
                  setDni(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSearch();
                  }
                }}
              />
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-saps w-100"
                onClick={() =>
                  void handleSearch()
                }
              >
                <i className="bi bi-search me-2" />
                Buscar
              </button>
            </div>

            <div className="col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearSearch}
              >
                Limpiar
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* TABLA */}
      <div className="card border-0 shadow-sm">
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
          ) : patients.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No hay pacientes para mostrar.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Paciente</th>
                    <th>Teléfono</th>
                    <th>Obra social</th>
                    <th>Estado</th>
                    <th className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id_paciente}
                    >
                      <td>
                        {patient.dni}
                      </td>

                      <td>
                        <strong>
                          {patient.apellidos},{' '}
                          {patient.nombres}
                        </strong>
                      </td>

                      <td>
                        {patient.telefono || '-'}
                      </td>

                      <td>
                        {patient.obra_social || '-'}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            patient.activo
                              ? 'text-bg-success'
                              : 'text-bg-secondary'
                          }`}
                        >
                          {patient.activo
                            ? 'Activo'
                            : 'Inactivo'}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">

                          {/* VER */}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            title="Ver paciente"
                            onClick={() =>
                              handleViewPatient(
                                patient.id_paciente,
                              )
                            }
                          >
                            <i className="bi bi-eye" />
                          </button>

                          {/* ACTIVAR / DESACTIVAR */}
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              patient.activo
                                ? 'btn-outline-danger'
                                : 'btn-outline-success'
                            }`}
                            title={
                              patient.activo
                                ? 'Desactivar paciente'
                                : 'Activar paciente'
                            }
                            onClick={() =>
                              void handleStatusChange(
                                patient,
                              )
                            }
                          >
                            <i
                              className={`bi ${
                                patient.activo
                                  ? 'bi-person-dash'
                                  : 'bi-person-check'
                              }`}
                            />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINACIÓN */}
        {pagination &&
          pagination.totalPages > 1 && (
            <div className="card-footer bg-white">
              <div className="d-flex justify-content-between align-items-center">

                <small className="text-muted">
                  Total: {pagination.total}
                </small>

                <div className="d-flex gap-2 align-items-center">

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage(
                        (current) =>
                          current - 1,
                      )
                    }
                  >
                    Anterior
                  </button>

                  <span>
                    Página {pagination.page} de{' '}
                    {pagination.totalPages}
                  </span>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={
                      page >=
                      pagination.totalPages
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1,
                      )
                    }
                  >
                    Siguiente
                  </button>

                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default PacientesPage;