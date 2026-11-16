import { useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import {
  extractClinicalApiError,
  getHistoriaClinicaContext,
  searchClinicalPatients,
} from '../../services/historia-clinica.service';
import {
  CLINICAL_PERMISSIONS,
  type ClinicalPatientSearchItem,
  type HistoriaClinicaContextData,
} from '../../types/historia-clinica.types';
import {
  calculateAgeLabel,
  formatArgentinaDate,
} from '../../utils/historia-clinica-format';
import {
  buildBuscadorUrl,
  type ClinicalNavState,
} from '../../utils/historia-clinica-navigation';
import {
  RECOVERABLE_ERROR_TIMEOUT_MS,
  useAutoDismiss,
} from '../../utils/useAutoDismiss';

export default function HistoriaClinicaBuscadorPage() {
  const { hasPermission, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isProfessional = user?.rol === 'PROFESIONAL';
  const canCreateConsulta = isProfessional && hasPermission(CLINICAL_PERMISSIONS.CREAR_CONSULTA_CLINICA);
  const canManageDerivaciones = hasPermission(
    CLINICAL_PERMISSIONS.GESTIONAR_DERIVACIONES_CLINICAS
  );

  const initialSearch = searchParams.get('search') || '';
  const initialSalita = searchParams.get('salita') || '';
  const initialPage = Math.max(1, Number(searchParams.get('page') || '1') || 1);

  const [context, setContext] = useState<HistoriaClinicaContextData | null>(null);
  const [selectedSalita, setSelectedSalita] = useState(initialSalita);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [appliedSearch, setAppliedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  const [patients, setPatients] = useState<ClinicalPatientSearchItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [loadingContext, setLoadingContext] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useAutoDismiss(
    error,
    () => setError(null),
    RECOVERABLE_ERROR_TIMEOUT_MS,
    Boolean(error) && Boolean(context)
  );

  const syncUrlParams = (nextSearch: string, nextSalita: string, nextPage: number) => {
    const next = new URLSearchParams();
    if (nextSearch.trim()) next.set('search', nextSearch.trim());
    if (nextSalita) next.set('salita', nextSalita);
    if (nextPage > 1) next.set('page', String(nextPage));
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let active = true;
    const loadContext = async () => {
      setLoadingContext(true);
      setError(null);
      try {
        const ctx = await getHistoriaClinicaContext();
        if (!active) return;
        setContext(ctx);
        if (!initialSalita && ctx.salitas_autorizadas.length === 1) {
          setSelectedSalita(ctx.salitas_autorizadas[0].id_salita);
        }
      } catch (err) {
        if (active) setError(extractClinicalApiError(err).message);
      } finally {
        if (active) setLoadingContext(false);
      }
    };
    void loadContext();
    return () => {
      active = false;
    };
  }, [initialSalita]);

  useEffect(() => {
    if (!context) return;
    if (context.salitas_autorizadas.length === 0) {
      setPatients([]);
      setTotal(0);
      setTotalPages(0);
      return;
    }

    let active = true;
    const loadPatients = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const data = await searchClinicalPatients({
          search: appliedSearch,
          id_salita: selectedSalita || undefined,
          page,
          limit: 12,
        });
        if (!active) return;
        setPatients(data.patients);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        if (active) setError(extractClinicalApiError(err).message);
      } finally {
        if (active) setLoadingList(false);
      }
    };
    void loadPatients();
    return () => {
      active = false;
    };
  }, [context, selectedSalita, appliedSearch, page]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = searchInput.trim();
    setPage(1);
    setAppliedSearch(trimmed);
    syncUrlParams(trimmed, selectedSalita, 1);
  };

  const defaultSalitaForLink =
    selectedSalita || context?.salitas_autorizadas[0]?.id_salita || '';

  const currentBuscadorUrl = buildBuscadorUrl({
    search: appliedSearch,
    salita: selectedSalita,
    page,
  });

  const navStateFromBuscador: ClinicalNavState = {
    origin: 'buscador',
    returnTo: currentBuscadorUrl,
    returnLabel: 'Volver al buscador',
  };

  return (
    <div className="hc-page">
      <div className="hc-hero d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div>
          <h1 className="h3 mb-1">
            <i className="bi bi-journal-medical text-success me-2" />
            Historia Clínica
          </h1>
          <p className="text-muted small mb-0">
            Consultá el expediente clínico de tus pacientes autorizados.
          </p>
        </div>

        <div className="hc-hero-actions">
          {canManageDerivaciones && (
            <Link
              to="/historia-clinica/derivaciones"
              state={navStateFromBuscador}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-arrow-left-right me-1" />
              Derivaciones clínicas
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-0" role="alert">
          <i className="bi bi-exclamation-octagon me-2" />
          {error}
          {context && (
            <button
              type="button"
              className="btn-close"
              aria-label="Cerrar"
              onClick={() => setError(null)}
            />
          )}
        </div>
      )}

      <div className="hc-card p-3">
        <form className="row g-3 align-items-end" onSubmit={handleSearch}>
          <div className="col-12 col-md-5">
            <label className="form-label fw-semibold" htmlFor="hc-search-input">
              Buscar por DNI, nombre o apellido
            </label>
            <input
              id="hc-search-input"
              type="search"
              className="form-control"
              placeholder="Ej.: 35123456 o Pérez"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label fw-semibold" htmlFor="hc-search-salita">
              Salita autorizada
            </label>
            <select
              id="hc-search-salita"
              className="form-select"
              value={selectedSalita}
              disabled={loadingContext || !context?.salitas_autorizadas.length}
              onChange={(e) => {
                const nextSalita = e.target.value;
                setSelectedSalita(nextSalita);
                setPage(1);
                syncUrlParams(appliedSearch, nextSalita, 1);
              }}
            >
              <option value="">Todas mis salitas vigentes</option>
              {context?.salitas_autorizadas.map((s) => (
                <option key={s.id_salita} value={s.id_salita}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3 d-flex gap-2">
            <button type="submit" className="btn btn-success flex-grow-1" disabled={loadingList}>
              <i className="bi bi-search me-1" />
              Buscar
            </button>
            {appliedSearch && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchInput('');
                  setAppliedSearch('');
                  setPage(1);
                  syncUrlParams('', selectedSalita, 1);
                }}
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {loadingContext || loadingList ? (
        <div className="hc-card p-5 text-center text-muted">
          <div className="spinner-border text-success mb-2" role="status" />
          <div>Consultando pacientes autorizados...</div>
        </div>
      ) : context && context.salitas_autorizadas.length === 0 ? (
        <div className="hc-empty-state">
          <i className="bi bi-hospital fs-1 text-muted d-block mb-2" />
          <h5>Sin salitas vigentes asignadas</h5>
          <p className="mb-0">
            Tu perfil profesional no cuenta actualmente con una asignación vigente en salitas activas.
          </p>
        </div>
      ) : patients.length === 0 ? (
        <div className="hc-empty-state">
          <i className="bi bi-person-x fs-1 text-muted d-block mb-2" />
          <h5>No se encontraron pacientes</h5>
          <p className="mb-0">
            Intentá ajustar los criterios de búsqueda o verificá si el paciente corresponde a tu salita o requiere una derivación autorizada.
          </p>
        </div>
      ) : (
        <div className="d-grid gap-3">
          <div className="hc-card px-3 py-2 bg-light d-flex flex-wrap justify-content-between align-items-center gap-2 small text-muted">
            <span>
              Mostrando {patients.length} de {total} paciente(s) dentro de tu alcance
            </span>
            <span>Página {page} de {Math.max(totalPages, 1)}</span>
          </div>

          {/* Vista móvil en tarjetas (pantallas < md) */}
          <div className="hc-mobile-list d-md-none">
            {patients.map((patient) => {
              const salitaForPatient =
                selectedSalita ||
                (patient.via_acceso_estimada === 'SALITA_ASIGNADA' &&
                patient.id_salita_asignada
                  ? patient.id_salita_asignada
                  : defaultSalitaForLink);

                  const patientSummary = {
                    id_paciente: patient.id_paciente,
                    dni: patient.dni,
                    nombres: patient.nombres,
                    apellidos: patient.apellidos,
                  };
                  const dossierUrl = `/historia-clinica/pacientes/${patient.id_paciente}${
                salitaForPatient ? `?salita=${encodeURIComponent(salitaForPatient)}` : ''
              }`;

              const newConsultaUrl = `/historia-clinica/pacientes/${patient.id_paciente}/nueva-consulta${
                salitaForPatient ? `?salita=${encodeURIComponent(salitaForPatient)}` : ''
              }`;

              return (
                <article key={patient.id_paciente} className="hc-mobile-item">
                  <div className="hc-mobile-item-head">
                    <div>
                      <div className="hc-mobile-item-title">
                        {patient.apellidos}, {patient.nombres}
                      </div>
                      <div className="small text-muted">
                        DNI {patient.dni} · {calculateAgeLabel(patient.fecha_nacimiento)}
                      </div>
                    </div>
                    {patient.via_acceso_estimada === 'DERIVACION_AUTORIZADA' ? (
                      <span className="badge text-bg-info flex-shrink-0">Derivación</span>
                    ) : (
                      <span className="badge text-bg-success-subtle text-success border border-success-subtle flex-shrink-0">
                        Salita
                      </span>
                    )}
                  </div>

                  <div className="hc-mobile-item-meta">
                    <div>
                      <span className="hc-meta-label">Salita asignada</span>
                      <span>{patient.salita_nombre || 'Sin salita'}</span>
                    </div>
                    <div>
                      <span className="hc-meta-label">Nacimiento</span>
                      <span>{formatArgentinaDate(patient.fecha_nacimiento)}</span>
                    </div>
                  </div>

                  <div className="hc-mobile-item-actions">
                    <Link
                      to={dossierUrl}
                      state={{ ...navStateFromBuscador, patientSummary }}
                      className="btn btn-success btn-sm"
                    >
                      <i className="bi bi-folder2-open me-1" />
                      Ver HC
                    </Link>
                    {canCreateConsulta && (
                      <Link
                        to={newConsultaUrl}
                        state={{ ...navStateFromBuscador, patientSummary }}
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-plus-circle me-1" />
                        Nueva consulta
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tabla tradicional en escritorio (>= md) */}
          <div className="hc-card overflow-hidden d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Paciente</th>
                    <th>DNI</th>
                    <th>Edad / Nacimiento</th>
                    <th>Salita asignada</th>
                    <th>Alcance de acceso</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => {
                    const salitaForPatient =
                      selectedSalita ||
                      (patient.via_acceso_estimada === 'SALITA_ASIGNADA' &&
                      patient.id_salita_asignada
                        ? patient.id_salita_asignada
                        : defaultSalitaForLink);

                        const patientSummary = {
                    id_paciente: patient.id_paciente,
                    dni: patient.dni,
                    nombres: patient.nombres,
                    apellidos: patient.apellidos,
                  };
                  const dossierUrl = `/historia-clinica/pacientes/${patient.id_paciente}${
                      salitaForPatient ? `?salita=${encodeURIComponent(salitaForPatient)}` : ''
                    }`;

                    const newConsultaUrl = `/historia-clinica/pacientes/${patient.id_paciente}/nueva-consulta${
                      salitaForPatient ? `?salita=${encodeURIComponent(salitaForPatient)}` : ''
                    }`;

                    return (
                      <tr key={patient.id_paciente}>
                        <td>
                          <div className="fw-semibold">
                            {patient.apellidos}, {patient.nombres}
                          </div>
                          <div className="small text-muted">
                            {patient.activo ? 'Paciente activo' : 'Inactivo'}
                          </div>
                        </td>
                        <td className="fw-medium">
                          {patient.dni}
                        </td>
                        <td>
                          <div>{calculateAgeLabel(patient.fecha_nacimiento)}</div>
                          <div className="small text-muted">
                            {formatArgentinaDate(patient.fecha_nacimiento)}
                          </div>
                        </td>
                        <td>{patient.salita_nombre || 'Sin salita asignada'}</td>
                        <td>
                          {patient.via_acceso_estimada === 'DERIVACION_AUTORIZADA' ? (
                            <span className="badge text-bg-info">
                              <i className="bi bi-arrow-left-right me-1" />
                              Derivación autorizada
                            </span>
                          ) : (
                            <span className="badge text-bg-success-subtle text-success border border-success-subtle">
                              <i className="bi bi-check2-circle me-1" />
                              Salita asignada
                            </span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex flex-wrap gap-2 justify-content-end">
                            <Link
                              to={dossierUrl}
                              state={{ ...navStateFromBuscador, patientSummary }}
                              className="btn btn-sm btn-success"
                            >
                              <i className="bi bi-folder2-open me-1" />
                              Ver HC
                            </Link>
                            {canCreateConsulta && (
                              <Link
                                to={newConsultaUrl}
                                state={{ ...navStateFromBuscador, patientSummary }}
                                className="btn btn-sm btn-outline-primary"
                              >
                                <i className="bi bi-plus-circle me-1" />
                                Nueva consulta
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="hc-card p-3 d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => {
                  const nextPage = Math.max(1, page - 1);
                  setPage(nextPage);
                  syncUrlParams(appliedSearch, selectedSalita, nextPage);
                }}
              >
                Anterior
              </button>
              <span className="small text-muted">
                Página {page} de {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => {
                  const nextPage = Math.min(totalPages, page + 1);
                  setPage(nextPage);
                  syncUrlParams(appliedSearch, selectedSalita, nextPage);
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
