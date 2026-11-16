import { getEstadoClass } from '../../utils/turno-status';
import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  buildAgendaReturnUrl,
  type ClinicalNavState,
} from '../../utils/historia-clinica-navigation';
import { CLINICAL_PERMISSIONS } from '../../types/historia-clinica.types';
import { useAuth } from '../../context/AuthContext';
import {
  getTurnos,
  changeTurnoStatus,
} from '../../services/turnos.service';
import {
  descargarAgendaDiaria,
  reporteDownloadError,
} from '../../services/reportes.service';
import { authError } from '../../utils/auth-errors';
import type { Turno } from '../../types/turno.types';
import type { ReporteFormato } from '../../types/reporte.types';
import ProfessionalCalendar from '../../components/turnos/ProfessionalCalendar';
import PatientTurnoDetailModal from '../../components/turnos/PatientTurnoDetailModal';
import { FloatingFeedbackToast } from '../../components/ui/FormFeedback';
import { useAgendaSocket } from '../../context/AgendaSocketContext';
import { PROFESSIONAL_MESSAGE_TIMEOUT_MS, useAutoDismiss } from '../../utils/useAutoDismiss';
import '../../styles/professional-agenda.css';

export default function MisTurnosPage({ mode = 'history' }: { mode?: 'history' | 'today' }) {
  const { user, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const validEstados = ['TODOS', 'PENDIENTES', 'CONFIRMADOS', 'ATENDIDOS', 'AUSENTES', 'CANCELADOS'] as const;
  const paramFecha = searchParams.get('fecha');
  const paramHasta = searchParams.get('hasta');
  const paramRango = searchParams.get('rango');
  const paramEstado = searchParams.get('estado');
  const paramPage = Number(searchParams.get('page') || '1');
  const hasValidParamFecha = !!paramFecha && /^\d{4}-\d{2}-\d{2}$/.test(paramFecha);
  const hasValidParamHasta = !!paramHasta && /^\d{4}-\d{2}-\d{2}$/.test(paramHasta);
  const canViewHC = hasPermission(CLINICAL_PERMISSIONS.VER_HISTORIA_CLINICA);
  const canCreateConsulta = hasPermission(CLINICAL_PERMISSIONS.CREAR_CONSULTA_CLINICA);
  const professional = user?.rol === 'PROFESIONAL';

  const [fecha, setFecha] = useState(() =>
    professional && mode === 'history' && hasValidParamFecha ? paramFecha : new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date())
  );

  const [fechaHasta, setFechaHasta] = useState(() => {
    if (professional && mode === 'history') {
      if (hasValidParamHasta && (!hasValidParamFecha || paramHasta >= paramFecha)) {
        return paramHasta;
      }
      if (hasValidParamFecha) return paramFecha;
    }
    return fecha;
  });
  const [filterRange, setFilterRange] = useState(() =>
    professional && mode === 'history' && (paramRango === '1' || hasValidParamFecha || hasValidParamHasta)
  );
  const [today, setToday] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date())
  );
  const daily = professional && mode === 'today';
  const validRange = !!fecha && !!fechaHasta && fecha <= fechaHasta;

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [page, setPage] = useState(() =>
    professional && Number.isFinite(paramPage) && paramPage >= 1 ? Math.floor(paramPage) : 1
  );
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);
  const { ultimoEvento } = useAgendaSocket();

  type EstadoFilter = 'TODOS' | 'PENDIENTES' | 'CONFIRMADOS' | 'ATENDIDOS' | 'AUSENTES' | 'CANCELADOS';
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>(() =>
    professional && paramEstado && validEstados.includes(paramEstado as EstadoFilter)
      ? (paramEstado as EstadoFilter)
      : 'TODOS'
  );
  const [selectedTurnoModal, setSelectedTurnoModal] = useState<Turno | null>(null);
  const [openMenuTurnoId, setOpenMenuTurnoId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuTurnoId) return;
    const closeMenu = () => setOpenMenuTurnoId(null);
    document.addEventListener('click', closeMenu);
    return () => {
      document.removeEventListener('click', closeMenu);
    };
  }, [openMenuTurnoId]);

  const buildTurnoClinicalState = (turnoItem: Turno): ClinicalNavState => ({
    origin: daily ? 'mis-pacientes' : 'mi-agenda',
    returnTo: buildAgendaReturnUrl({
      mode,
      fecha,
      fechaHasta,
      filterRange,
      estadoFilter,
      page,
    }),
    returnLabel: daily ? 'Volver a Pacientes del día' : 'Volver a Mi agenda',
    turnoId: turnoItem.id_turno,
    ...(turnoItem.paciente?.persona
      ? {
          patientSummary: {
            id_paciente: turnoItem.paciente.id_paciente,
            dni: turnoItem.paciente.persona.dni,
            nombres: turnoItem.paciente.persona.nombres,
            apellidos: turnoItem.paciente.persona.apellidos,
          },
        }
      : {}),
  });

  useEffect(() => {
    if (!professional) return;
    const nextUrl = buildAgendaReturnUrl({
      mode,
      fecha,
      fechaHasta,
      filterRange,
      estadoFilter,
      page,
    });
    const nextQuery = nextUrl.includes('?') ? nextUrl.split('?')[1] : '';
    if (nextQuery !== searchParams.toString()) {
      setSearchParams(new URLSearchParams(nextQuery), { replace: true });
    }
  }, [professional, mode, fecha, fechaHasta, filterRange, estadoFilter, page, searchParams, setSearchParams]);

  const turnosPendientes = turnos.filter((t) => !t.estado.es_estado_final).length;
  const turnosAtendidos = turnos.filter((t) => t.estado.codigo === 'ATENDIDO').length;
  const pacientesAusentes = turnos.filter((t) => t.estado.codigo === 'NO_ASISTIO').length;
  const turnosConfirmados = turnos.filter(
    (t) => t.estado.codigo === 'CONFIRMADO' || t.estado.codigo === 'EN_ESPERA'
  ).length;
  const turnosCancelados = turnos.filter((t) => t.estado.codigo === 'CANCELADO').length;

  const upcomingTurnos = turnos
    .filter((t) => !t.estado.es_estado_final && new Date(t.fecha_hora_inicio).getTime() >= Date.now())
    .sort((a, b) => Date.parse(a.fecha_hora_inicio) - Date.parse(b.fecha_hora_inicio));

  const nextTurno = upcomingTurnos.length > 0 ? upcomingTurnos[0] : null;

  const filteredTurnos = turnos.filter((t) => {
    switch (estadoFilter) {
      case 'PENDIENTES':
        return !t.estado.es_estado_final;
      case 'CONFIRMADOS':
        return t.estado.codigo === 'CONFIRMADO' || t.estado.codigo === 'EN_ESPERA';
      case 'ATENDIDOS':
        return t.estado.codigo === 'ATENDIDO';
      case 'AUSENTES':
        return t.estado.codigo === 'NO_ASISTIO';
      case 'CANCELADOS':
        return t.estado.codigo === 'CANCELADO';
      default:
        return true;
    }
  });

  const lastEventIdRef = useRef<string | null>(ultimoEvento?.id ?? null);
  const requestIdRef = useRef(0);

  useAutoDismiss(success, setSuccess, PROFESSIONAL_MESSAGE_TIMEOUT_MS, professional);
  useAutoDismiss(error, setError, PROFESSIONAL_MESSAGE_TIMEOUT_MS, professional);

  useEffect(() => {
    if (ultimoEvento && ultimoEvento.id !== lastEventIdRef.current) {
      lastEventIdRef.current = ultimoEvento.id;
      setRevision((prev) => prev + 1);
    }
  }, [ultimoEvento]);

  useEffect(() => {
    if (!daily) return;
    const timer = window.setInterval(() => {
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
      if (date !== today) { setToday(date); setPage(1); }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [daily, today]);

  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;

    if (turnos.length === 0) {
      setLoading(true);
    }
    setError('');

    if (professional && !daily && filterRange && !validRange) {
      setError('Seleccioná un rango válido: Desde no puede ser posterior a Hasta.');
      setLoading(false);
      return;
    }

    void getTurnos({
      ...(professional ? daily ? { fecha: today } : filterRange
        ? { fecha_desde: fecha, fecha_hasta: fechaHasta, orden: 'desc' as const }
        : { orden: 'desc' as const } : {}),
      page,
      limit: 20,
    })
      .then((response) => {
        if (currentRequestId === requestIdRef.current) {
          setTurnos(response.data.turnos);
          setTotalPages(response.data.pagination.totalPages);
        }
      })
      .catch((cause) => {
        if (currentRequestId === requestIdRef.current) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [professional, daily, today, filterRange, fecha, fechaHasta, validRange, page, revision]);

  const mark = async (turno: Turno, estado: string) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await changeTurnoStatus(turno.id_turno, { estado });
      setSuccess('Estado actualizado correctamente.');
      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  const download = async (formato: ReporteFormato) => {
    if (busy || (!daily && filterRange && !validRange)) return;

    setBusy(true);
    setError('');

    try {
      await descargarAgendaDiaria(
        daily
          ? { fecha: today }
          : filterRange
          ? { fecha_desde: fecha, fecha_hasta: fechaHasta }
          : {},
        formato
      );
    } catch (cause) {
      setError(await reporteDownloadError(cause));
    } finally {
      setBusy(false);
    }
  };

  const renderKpiCards = () => (
    <div className="prof-kpi-grid">
      <div className="prof-kpi-card">
        <div className="prof-kpi-icon pending">
          <i className="bi bi-calendar-event" aria-hidden="true" />
        </div>
        <div className="prof-kpi-info">
          <span className="prof-kpi-label">Pendientes</span>
          <span className="prof-kpi-val">{turnosPendientes}</span>
          <span className="prof-kpi-sub">Por atender</span>
        </div>
      </div>

      <div className="prof-kpi-card">
        <div className="prof-kpi-icon attended">
          <i className="bi bi-check2-circle" aria-hidden="true" />
        </div>
        <div className="prof-kpi-info">
          <span className="prof-kpi-label">Atendidos</span>
          <span className="prof-kpi-val">{turnosAtendidos}</span>
          <span className="prof-kpi-sub">Completados</span>
        </div>
      </div>

      <div className="prof-kpi-card">
        <div className="prof-kpi-icon absent">
          <i className="bi bi-person-x" aria-hidden="true" />
        </div>
        <div className="prof-kpi-info">
          <span className="prof-kpi-label">Ausentes</span>
          <span className="prof-kpi-val">{pacientesAusentes}</span>
          <span className="prof-kpi-sub">Inasistencias</span>
        </div>
      </div>

      <div className="prof-kpi-card">
        <div className="prof-kpi-icon total">
          <i className="bi bi-people" aria-hidden="true" />
        </div>
        <div className="prof-kpi-info">
          <span className="prof-kpi-label">
            {daily || (filterRange && fecha === fechaHasta) ? 'Total del día' : 'Total del período'}
          </span>
          <span className="prof-kpi-val">{turnos.length}</span>
          <span className="prof-kpi-sub">Turnos agendados</span>
        </div>
      </div>
    </div>
  );

  const renderFilterToolbar = () => (
    <div className="prof-filter-toolbar">
      <span className="text-secondary small fw-bold me-1">
        Estado:
      </span>
      {[
        { id: 'TODOS', label: 'Todos', count: turnos.length },
        { id: 'PENDIENTES', label: 'Pendientes', count: turnosPendientes },
        { id: 'CONFIRMADOS', label: 'Confirmados', count: turnosConfirmados },
        { id: 'ATENDIDOS', label: 'Atendidos', count: turnosAtendidos },
        { id: 'AUSENTES', label: 'Ausentes', count: pacientesAusentes },
        { id: 'CANCELADOS', label: 'Cancelados', count: turnosCancelados },
      ].map((f) => (
        <button
          key={f.id}
          type="button"
          className={`prof-filter-btn ${estadoFilter === f.id ? 'active' : ''}`}
          onClick={() => setEstadoFilter(f.id as EstadoFilter)}
        >
          <span>{f.label}</span>
          <span className="badge rounded-pill px-2 py-0">
            {f.count}
          </span>
        </button>
      ))}
    </div>
  );

  const renderNextHero = () => {
    if (!daily || !nextTurno) return null;
    return (
      <div className="prof-next-hero">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <span className="prof-next-badge-pulse">
            <span className="dot" /> Próximo paciente a atender
          </span>
          <span className="badge bg-white text-dark border px-2 py-1 font-monospace">
            <i className="bi bi-clock me-1 text-success" />
            {new Date(nextTurno.fecha_hora_inicio).toLocaleTimeString('es-AR', {
              timeZone: 'America/Argentina/Buenos_Aires',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            hs
          </span>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <h3 className="h5 mb-1 fw-bold text-dark">
              {nextTurno.paciente?.persona?.apellidos}{' '}
              {nextTurno.paciente?.persona?.nombres}
            </h3>
            <div className="text-secondary small">
              <span className="me-3">
                <strong>DNI:</strong> {nextTurno.paciente?.persona?.dni || 'Sin DNI'}
              </span>
              <span className="me-3">
                <strong>Especialidad:</strong> {nextTurno.especialidad?.nombre || 'General'}
              </span>
              <span>
                <strong>Salita:</strong> {nextTurno.salita?.nombre}
              </span>
            </div>
            {nextTurno.motivo_consulta && (
              <div className="mt-1 small text-dark">
                <strong>Motivo:</strong> {nextTurno.motivo_consulta}
              </div>
            )}
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm px-3"
              onClick={() => setSelectedTurnoModal(nextTurno)}
            >
              <i className="bi bi-person-vcard me-1" />
              Ver ficha
            </button>
            <button
              type="button"
              className="btn btn-success btn-sm px-3 shadow-sm"
              disabled={busy}
              onClick={() => void mark(nextTurno, 'ATENDIDO')}
            >
              <i className="bi bi-check2 me-1" />
              Atendido
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              disabled={busy}
              onClick={() => void mark(nextTurno, 'NO_ASISTIO')}
            >
              No asistió
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFeedbackAlerts = () => (
    <>
      {error && turnos.length === 0 && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between gap-2 mb-0" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
            {error}
          </div>
          <button
            type="button"
            className="btn-close flex-shrink-0"
            aria-label="Cerrar aviso"
            onClick={() => setError('')}
          />
        </div>
      )}

      {error && turnos.length > 0 && (
        <FloatingFeedbackToast
          variant="error"
          message={error}
          onDismiss={() => setError('')}
        />
      )}

      {success && (
        <FloatingFeedbackToast
          variant="success"
          message={success}
          onDismiss={() => setSuccess('')}
        />
      )}
    </>
  );

  const renderMobileCards = () => (
    <div className="prof-mobile-agenda-cards d-md-none">
      {!filteredTurnos.length ? (
        <div className="text-center py-4 text-muted small">
          <i className="bi bi-funnel fs-4 d-block mb-2" aria-hidden="true" />
          No hay turnos para mostrar con el filtro seleccionado (<strong>{estadoFilter.toLowerCase()}</strong>).
        </div>
      ) : (
        filteredTurnos.map((t) => (
          <article key={t.id_turno} className="prof-mobile-agenda-card">
            <div className="d-flex justify-content-between align-items-center gap-2">
              <div className="fw-bold text-dark">
                {!daily && (
                  <span className="text-muted fw-normal me-2">
                    {new Date(t.fecha_hora_inicio).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      timeZone: 'America/Argentina/Buenos_Aires',
                    })}
                  </span>
                )}
                {new Date(t.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}{' '}
                hs
              </div>
              <span className={getEstadoClass(t.estado.codigo)}>{t.estado.nombre}</span>
            </div>

            <div>
              <button
                type="button"
                className="prof-table-patient-link text-start"
                onClick={() => setSelectedTurnoModal(t)}
              >
                <i className="bi bi-person text-secondary me-1" aria-hidden="true" />
                <span className="fw-bold text-dark">
                  {t.paciente?.persona?.apellidos} {t.paciente?.persona?.nombres}
                </span>
              </button>
              <div className="text-muted small">DNI: {t.paciente?.persona?.dni || '—'}</div>
            </div>

            <div className="small">
              <div className="fw-medium text-dark">{t.especialidad?.nombre || 'General'}</div>
              <div className="text-muted">
                <i className="bi bi-geo-alt me-1" />
                {t.salita?.nombre}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="prof-btn-view-card"
                onClick={() => setSelectedTurnoModal(t)}
              >
                <i className="bi bi-eye" aria-hidden="true" />
                <span>Ver ficha</span>
              </button>
              {canViewHC && t.paciente?.id_paciente && (
                <Link
                  to={`/historia-clinica/pacientes/${t.paciente.id_paciente}${t.salita?.id_salita ? `?salita=${encodeURIComponent(t.salita.id_salita)}` : ''}`}
                  state={buildTurnoClinicalState(t)}
                  className="prof-btn-action-secondary text-decoration-none"
                >
                  <i className="bi bi-journal-medical" aria-hidden="true" />
                  <span>HC</span>
                </Link>
              )}
              {canCreateConsulta && t.paciente?.id_paciente && (
                <Link
                  to={`/historia-clinica/pacientes/${t.paciente.id_paciente}/nueva-consulta?${new URLSearchParams({
                    ...(t.salita?.id_salita ? { salita: t.salita.id_salita } : {}),
                    turno: t.id_turno,
                  }).toString()}`}
                  state={buildTurnoClinicalState(t)}
                  className="prof-btn-action-secondary text-decoration-none"
                >
                  <i className="bi bi-file-earmark-plus" aria-hidden="true" />
                  <span>Consulta</span>
                </Link>
              )}
              {!t.estado.es_estado_final && (
                <>
                  <button
                    type="button"
                    className="prof-btn-action-icon btn-attended"
                    disabled={busy}
                    onClick={() => void mark(t, 'ATENDIDO')}
                    title="Marcar como atendido"
                    aria-label="Marcar como atendido"
                  >
                    <i className="bi bi-check2" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="prof-btn-action-icon btn-absent"
                    disabled={busy}
                    onClick={() => void mark(t, 'NO_ASISTIO')}
                    title="Marcar como no asistió"
                    aria-label="Marcar como no asistió"
                  >
                    <i className="bi bi-person-x" aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );

  const renderTurnosTable = () => {
    if (loading && turnos.length === 0) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted mt-2 mb-0">Cargando turnos…</p>
        </div>
      );
    }

    if (!turnos.length && !error) {
      return (
        <div className="agenda-empty-state">
          <div className="agenda-empty-icon">
            <i className="bi bi-calendar-x" />
          </div>
          <h4 className="h6 fw-bold mb-1">No hay turnos registrados</h4>
          <p className="text-muted small mb-0">
            {professional
              ? daily
                ? `No hay turnos agendados para hoy (${today.split('-').reverse().join('/')}).`
                : filterRange
                  ? `No se encontraron turnos entre el ${fecha.split('-').reverse().join('/')} y el ${fechaHasta.split('-').reverse().join('/')}.`
                  : 'Aún no tenés turnos registrados en el sistema.'
              : 'No hay turnos para mostrar.'}
          </p>
        </div>
      );
    }

    return (
      <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}>
        {professional && renderMobileCards()}
        <div className={professional ? 'd-none d-md-block' : 'table-responsive'}>
          <table className={`table saps-responsive-table table-hover align-middle${professional ? ' professional-agenda-table mb-0' : ''}`}>
            <thead>
              <tr>
                <th scope="col" className="prof-agenda-col-tight">Hora</th>
                {professional ? (
                  <>
                    <th scope="col" className="prof-agenda-patient-cell">Paciente</th>
                    <th scope="col">Especialidad</th>
                    <th scope="col" className="prof-agenda-col-tight">Estado</th>
                    <th scope="col" className="text-end prof-agenda-col-tight">Acciones</th>
                  </>
                ) : (
                  <>
                    <th scope="col">Profesional</th>
                    <th scope="col">Salita</th>
                    <th scope="col">Especialidad</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Motivo</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {!filteredTurnos.length ? (
                <tr>
                  <td colSpan={professional ? 5 : 6} className="text-center py-5">
                    <div className="text-muted">
                      <i className="bi bi-funnel fs-4 d-block mb-2" aria-hidden="true" />
                      No hay turnos para mostrar con el filtro seleccionado (<strong>{estadoFilter.toLowerCase()}</strong>).
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTurnos.map((t) => (
                  <tr key={t.id_turno} className={professional ? `professional-turno--${t.estado.codigo}` : undefined}>
                    <td data-label="Hora" className="fw-semibold text-dark text-nowrap">
                      {!daily ? (
                        <>
                          <div className="small text-muted fw-normal">
                            {new Date(t.fecha_hora_inicio).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              timeZone: 'America/Argentina/Buenos_Aires',
                            })}
                          </div>
                          <div>
                            {new Date(t.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                              timeZone: 'America/Argentina/Buenos_Aires',
                            })}
                          </div>
                        </>
                      ) : (
                        new Date(t.fecha_hora_inicio).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'America/Argentina/Buenos_Aires',
                        })
                      )}
                    </td>

                    {professional ? (
                      <>
                        <td data-label="Paciente">
                          <button
                            type="button"
                            className="prof-table-patient-link text-start"
                            onClick={() => setSelectedTurnoModal(t)}
                            title="Ver ficha completa del paciente"
                          >
                            <i className="bi bi-person text-secondary me-1 flex-shrink-0" aria-hidden="true" />
                            <span className="fw-bold text-dark">
                              {t.paciente?.persona?.apellidos} {t.paciente?.persona?.nombres}
                            </span>
                          </button>
                          <div className="text-muted small">
                            DNI: {t.paciente?.persona?.dni || '—'}
                          </div>
                        </td>

                        <td data-label="Especialidad">
                          <div className="text-dark fw-medium">
                            {t.especialidad?.nombre || 'General'}
                          </div>
                          <div className="text-muted small prof-salita-truncate" title={t.salita?.nombre || undefined}>
                            <i className="bi bi-geo-alt me-1" />
                            {t.salita?.nombre}
                          </div>
                        </td>

                        <td data-label="Estado">
                          <span className={getEstadoClass(t.estado.codigo)}>
                            {t.estado.nombre}
                          </span>
                        </td>

                        <td data-label="Acciones" className="text-end">
                          <div className="prof-actions-cell">
                            <button
                              type="button"
                              className="prof-btn-view-card"
                              onClick={() => setSelectedTurnoModal(t)}
                              title="Ver ficha completa del paciente"
                              aria-label="Ver ficha completa del paciente"
                            >
                              <i className="bi bi-eye" aria-hidden="true" />
                              <span>Ver ficha</span>
                            </button>

                            {canViewHC && t.paciente?.id_paciente && (
                              <Link
                                to={`/historia-clinica/pacientes/${t.paciente.id_paciente}${t.salita?.id_salita ? `?salita=${encodeURIComponent(t.salita.id_salita)}` : ''}`}
                                state={buildTurnoClinicalState(t)}
                                className="prof-btn-action-secondary text-decoration-none"
                                title="Abrir historia clínica del paciente"
                              >
                                <i className="bi bi-journal-medical" aria-hidden="true" />
                                <span>HC</span>
                              </Link>
                            )}
                            {canCreateConsulta && t.paciente?.id_paciente && (
                              <Link
                                to={`/historia-clinica/pacientes/${t.paciente.id_paciente}/nueva-consulta?${new URLSearchParams({
                                  ...(t.salita?.id_salita ? { salita: t.salita.id_salita } : {}),
                                  turno: t.id_turno,
                                }).toString()}`}
                                state={buildTurnoClinicalState(t)}
                                className="prof-btn-action-secondary text-decoration-none"
                                title="Registrar consulta clínica desde este turno"
                              >
                                <i className="bi bi-file-earmark-plus" aria-hidden="true" />
                                <span>Consulta</span>
                              </Link>
                            )}
                            {!t.estado.es_estado_final && (
                              <div className="prof-actions-menu-wrap">
                                <button
                                  type="button"
                                  className="prof-btn-action-secondary"
                                  disabled={busy}
                                  aria-expanded={openMenuTurnoId === t.id_turno}
                                  aria-label="Más acciones del turno"
                                  title="Más acciones del turno"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuTurnoId((prev) =>
                                      prev === t.id_turno ? null : t.id_turno
                                    );
                                  }}
                                >
                                  <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                                </button>
                                {openMenuTurnoId === t.id_turno && (
                                  <div
                                    className="prof-actions-dropdown"
                                    role="menu"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="prof-actions-dropdown-item is-success"
                                      role="menuitem"
                                      disabled={busy}
                                      onClick={() => {
                                        setOpenMenuTurnoId(null);
                                        void mark(t, 'ATENDIDO');
                                      }}
                                    >
                                      <i className="bi bi-check2-circle" aria-hidden="true" />
                                      <span>Marcar atendido</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="prof-actions-dropdown-item is-danger"
                                      role="menuitem"
                                      disabled={busy}
                                      onClick={() => {
                                        setOpenMenuTurnoId(null);
                                        void mark(t, 'NO_ASISTIO');
                                      }}
                                    >
                                      <i className="bi bi-person-x" aria-hidden="true" />
                                      <span>Marcar no asistió</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td data-label="Profesional">
                          {t.profesional?.persona?.apellidos} {t.profesional?.persona?.nombres}
                        </td>
                        <td data-label="Salita">{t.salita?.nombre}</td>
                        <td data-label="Especialidad">{t.especialidad?.nombre}</td>
                        <td data-label="Estado">
                          <span className={getEstadoClass(t.estado.codigo)}>{t.estado.nombre}</span>
                        </td>
                        <td data-label="Motivo">{t.motivo_consulta || '—'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between pt-2">
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={loading || busy || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <i className="bi bi-chevron-left me-1" />
          Anterior
        </button>
        <span className="text-muted small">
          Página <strong>{page}</strong> de <strong>{Math.max(1, totalPages)}</strong>
        </span>
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={loading || busy || page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
          <i className="bi bi-chevron-right ms-1" />
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Encabezado de página */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1 d-flex align-items-center gap-2">
            <i className={`bi ${daily ? 'bi-people' : 'bi-calendar2-check'} text-success`} />
            {professional
              ? daily ? 'Pacientes del día' : 'Mi agenda'
              : 'Mis turnos'}
          </h1>
          <p className="text-muted small mb-0">
            {professional
              ? daily
                ? `Atención de hoy (${today.split('-').reverse().join('/')}) con actualización continua.`
                : 'Consultá y gestioná tus turnos.'
              : 'Para solicitar, cancelar o reprogramar un turno, contactá a tu salita.'}
          </p>
        </div>
        {professional && (
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={loading || busy}
              onClick={() => setRevision((r) => r + 1)}
              title="Actualizar agenda manualmente"
            >
              <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`} aria-hidden="true" />
              Actualizar
            </button>
          </div>
        )}
      </div>

      {/* Disposición según rol y modo */}
      {professional ? (
        !daily ? (
          /* VISTA INTEGRADA: MI AGENDA (2 COLUMNAS EN ESCRITORIO) */
          <div className="agenda-layout-grid">
            {/* Columna lateral: Calendario, Filtros por período y Descargas */}
            <aside className="agenda-sidebar-panel">
              <div className="agenda-control-card">
                <div className="agenda-control-body p-3">
                  <ProfessionalCalendar
                    revision={revision}
                    selected={filterRange && fecha === fechaHasta ? fecha : ''}
                    onSelect={(day) => {
                      setFecha(day);
                      setFechaHasta(day);
                      setFilterRange(true);
                      setPage(1);
                    }}
                  />

                  <hr className="my-3 text-secondary-subtle" />

                  {/* Botón para alternar período */}
                  <button
                    type="button"
                    className={`btn w-100 mb-2 d-flex align-items-center justify-content-center gap-2 ${
                      filterRange && fecha !== fechaHasta ? 'btn-success text-white' : 'btn-outline-secondary'
                    }`}
                    onClick={() => {
                      setFilterRange(!filterRange);
                      setPage(1);
                    }}
                  >
                    <i className="bi bi-funnel" />
                    <span>Filtrar por período</span>
                  </button>

                  {filterRange && (
                    <div className="bg-light p-2 rounded-3 border mb-3">
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label small text-muted mb-1">Desde</label>
                          <input
                            className="form-control form-control-sm"
                            type="date"
                            value={fecha}
                            max={fechaHasta}
                            disabled={busy}
                            onChange={(e) => {
                              if (e.target.value) {
                                setFecha(e.target.value);
                                setPage(1);
                              }
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label small text-muted mb-1">Hasta</label>
                          <input
                            className="form-control form-control-sm"
                            type="date"
                            value={fechaHasta}
                            min={fecha}
                            disabled={busy}
                            onChange={(e) => {
                              setFechaHasta(e.target.value);
                              setPage(1);
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-link btn-sm text-secondary p-0 mt-2 text-decoration-none"
                        onClick={() => {
                          setFilterRange(false);
                          setPage(1);
                        }}
                      >
                        <i className="bi bi-x-circle me-1" />
                        Limpiar filtro de período
                      </button>
                    </div>
                  )}

                  {/* Descargas */}
                  <div className="pt-2 border-top">
                    <span className="small fw-semibold text-secondary d-block mb-2">
                      <i className="bi bi-file-earmark-arrow-down me-1 text-success" />
                      Exportar reporte
                    </span>
                    <div className="btn-group btn-group-sm w-100" role="group">
                      {(['pdf', 'docx', 'xlsx'] as const).map((formato) => (
                        <button
                          key={formato}
                          type="button"
                          className="btn btn-outline-secondary"
                          disabled={busy || loading || (filterRange && !validRange)}
                          onClick={() => void download(formato)}
                          title={`Descargar ${formato.toUpperCase()}`}
                        >
                          <i
                            className={`bi bi-file-earmark-${
                              formato === 'pdf'
                                ? 'pdf text-danger'
                                : formato === 'docx'
                                ? 'word text-primary'
                                : 'excel text-success'
                            } me-1`}
                          />
                          {formato.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Columna principal: Indicadores, Filtros y Lista de turnos */}
            <main className="agenda-main-panel">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="agenda-period-badge">
                  <i className="bi bi-calendar-event text-success" />
                  <span>
                    {filterRange
                      ? fecha === fechaHasta
                        ? `Turnos del ${fecha.split('-').reverse().join('/')}`
                        : `Período: ${fecha.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`
                      : 'Todos los turnos históricos registrados'}
                  </span>
                </div>
                {turnos.length > 0 && (
                  <span className="text-muted small">
                    Página {page} de {Math.max(1, totalPages)} ({filteredTurnos.length} visibles)
                  </span>
                )}
              </div>

              {renderFeedbackAlerts()}

              {renderKpiCards()}
              {renderFilterToolbar()}
              {renderTurnosTable()}
              {renderPagination()}
            </main>
          </div>
        ) : (
          /* VISTA PACIENTES DEL DÍA: ENFOCADA EN OPERACIÓN INMEDIATA */
          <div className="d-flex flex-column gap-3 mt-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="agenda-period-badge">
                <i className="bi bi-calendar-check text-success" />
                <span>Jornada de hoy: {today.split('-').reverse().join('/')}</span>
              </div>
              <div className="btn-group btn-group-sm" role="group">
                {(['pdf', 'docx', 'xlsx'] as const).map((formato) => (
                  <button
                    key={formato}
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={busy || loading}
                    onClick={() => void download(formato)}
                    title={`Descargar agenda de hoy en ${formato.toUpperCase()}`}
                  >
                    <i
                      className={`bi bi-file-earmark-${
                        formato === 'pdf'
                          ? 'pdf text-danger'
                          : formato === 'docx'
                          ? 'word text-primary'
                          : 'excel text-success'
                      } me-1`}
                    />
                    {formato.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {renderFeedbackAlerts()}

            {renderKpiCards()}
            {renderNextHero()}
            {renderFilterToolbar()}
            {renderTurnosTable()}
            {renderPagination()}
          </div>
        )
      ) : (
        /* VISTA NO PROFESIONAL */
        <div className="mt-3">
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}
          {renderTurnosTable()}
          {renderPagination()}
        </div>
      )}

      {/* Modal accesible de Ficha y detalle de paciente */}
      <PatientTurnoDetailModal
        turno={selectedTurnoModal}
        onClose={() => setSelectedTurnoModal(null)}
        onStatusChanged={() => setRevision((r) => r + 1)}
        clinicalOriginState={
          selectedTurnoModal ? buildTurnoClinicalState(selectedTurnoModal) : undefined
        }
      />
    </div>
  );
}
