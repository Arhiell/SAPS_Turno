
import AccountSummary from '../../components/ui/AccountSummary';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '../../components/ui/ConfirmationModal';

import {
  getPatients,
  updatePatientStatus,
} from '../../services/patients.service';

import type {
  Patient,
  PatientPagination,
  PatientStatusFilter,
} from '../../types/patient.types';

const PacientesPage = () => {
  const navigate = useNavigate();

  // Recupera el mensaje guardado al registrar un paciente nuevo.
  const [success, setSuccess] = useState(() => {
    const savedMessage = sessionStorage.getItem('pacientes_success_message');

    if (savedMessage) {
      sessionStorage.removeItem('pacientes_success_message');
    }

    return savedMessage ?? '';
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [pagination, setPagination] =
    useState<PatientPagination | null>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<PatientStatusFilter>('activo');
  const requestId = useRef(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<Patient | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Oculta el mensaje automáticamente después de cinco segundos.
  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [success]);

  const loadPatients = async () => {
    const currentRequest = ++requestId.current;

    try {
      setLoading(true);
      setError('');

      const response = await getPatients(
        page,
        10,
        appliedSearch,
        statusFilter,
      );

      if (currentRequest !== requestId.current) return;

      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (error) {
      if (currentRequest !== requestId.current) return;

      console.error(error);
      setPatients([]);
      setPagination(null);
      setError(
        'No se pudieron cargar los pacientes.',
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    void loadPatients();

    return () => {
      requestId.current++;
    };
  }, [page, appliedSearch, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const handleStatusChange = async (
    patient: Patient,
  ) => {
    setConfirmTarget(patient);
  };

  const confirmStatusChange = async () => {
    if (!confirmTarget) {
      return;
    }

    try {
      setConfirming(true);
      setError('');

      await updatePatientStatus(
        confirmTarget.id_paciente,
        !confirmTarget.activo,
      );

      setConfirmTarget(null);
      await loadPatients();
    } catch (error) {
      console.error(error);

      setError(
        'No se pudo actualizar el estado del paciente.',
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleViewPatient = (id: string) => {
    navigate(`/pacientes/${id}`);
  };

  return (
    <div>
      {confirmTarget && (
        <ConfirmationModal
          open
          title={confirmTarget.activo ? 'Desactivar paciente' : 'Activar paciente'}
          subtitle="Esta acción requiere confirmación."
          message={confirmTarget.activo ? '¿Querés desactivar al paciente?' : '¿Querés volver a activar al paciente?'}
          detail={
            <>
              <div className="fw-semibold">
                {confirmTarget.apellidos}, {confirmTarget.nombres}
              </div>

              <div className="text-muted small mt-1">
                DNI: {confirmTarget.dni}
              </div>
            </>
          }
          confirmText={confirmTarget.activo ? 'Desactivar paciente' : 'Activar paciente'}
          cancelText="Cancelar"
          variant={confirmTarget.activo ? 'danger' : 'success'}
          icon={confirmTarget.activo ? 'bi-person-dash' : 'bi-person-check'}
          loading={confirming}
          onClose={() => setConfirmTarget(null)}
          onConfirm={() => void confirmStatusChange()}
        />
      )}

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

      {/* MENSAJE DE ÉXITO */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="status"
          aria-live="polite"
        >
          <i className="bi bi-check-circle me-2" />
          {success}

          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar mensaje"
            onClick={() => setSuccess('')}
          />
        </div>
      )}

      {/* BUSCADOR */}
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
                  type="search"
                  className="form-control"
                  placeholder="DNI, apellido o nombre completo"
                  aria-label="Buscar paciente por DNI, apellido o nombre completo"
                  maxLength={150}
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
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
                aria-label="Filtrar pacientes por estado"
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as PatientStatusFilter,
                  );
                  setPage(1);
                }}
              >
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
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
              <table className="table saps-responsive-table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">DNI</th>
                    <th scope="col">Paciente</th>
                    <th scope="col">Teléfono</th>
                    <th scope="col">Obra social</th>
                    <th scope="col">Estado</th>
                    <th scope="col" className="text-end">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {patients.map((patient) => (
                    <tr
                      key={patient.id_paciente}
                    >
                      <td data-label="DNI">
                        {patient.dni}
                      </td>

                      <td data-label="Paciente">
                        <strong>
                          {patient.apellidos},{' '}
                          {patient.nombres}
                        </strong>
                        <AccountSummary account={patient.cuenta} />
                      </td>

                      <td data-label="Teléfono">
                        {patient.telefono || '-'}
                      </td>

                      <td data-label="Obra social">
                        {patient.obra_social || '-'}
                      </td>

                      <td data-label="Estado">
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

                      <td data-label="Acciones" className="text-end">
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
