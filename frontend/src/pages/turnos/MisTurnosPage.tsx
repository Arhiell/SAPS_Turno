import { getEstadoClass } from '../../utils/turno-status';
import { useEffect, useState } from 'react';

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
import ProfessionalTurnoHistory from '../../components/turnos/ProfessionalTurnoHistory';
import '../../styles/professional-agenda.css';

export default function MisTurnosPage({ mode = 'history' }: { mode?: 'history' | 'today' }) {
  const { user } = useAuth();

  const professional = user?.rol === 'PROFESIONAL';

  const [fecha, setFecha] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date())
  );

  const [fechaHasta, setFechaHasta] = useState(fecha);
  const [filterRange, setFilterRange] = useState(false);
  const [today, setToday] = useState(fecha);
  const daily = professional && mode === 'today';
  const validRange = !!fecha && !!fechaHasta && fecha <= fechaHasta;

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!daily) return;
    const timer = window.setInterval(() => {
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
      if (date !== today) { setToday(date); setPage(1); }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [daily, today]);
  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setTurnos([]);
    setTotalPages(0);
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
        if (active) {
          setTurnos(response.data.turnos);

          setTotalPages(
            response.data.pagination.totalPages
          );
        }
      })
      .catch((cause) => {
        if (active) {
          setError(authError(cause));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [professional, daily, today, filterRange, fecha, fechaHasta, validRange, page, revision]);

  const mark = async (
    turno: Turno,
    estado: string
  ) => {
    if (busy) return;

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      await changeTurnoStatus(
        turno.id_turno,
        {
          estado,
        }
      );

      setSuccess('Estado actualizado.');

      setRevision((value) => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  const download = async (formato: ReporteFormato) => {
    if (busy || (!daily && (!filterRange || !validRange))) return;

    setBusy(true);
    setError('');

    try {
      await descargarAgendaDiaria(
        daily ? { fecha: today } : {
          fecha_desde: fecha,
          fecha_hasta: fechaHasta,
        },
        formato
      );
    } catch (cause) {
      setError(await reporteDownloadError(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="h3">
        {professional
          ? daily ? 'Pacientes del día' : 'Mi agenda'
          : 'Mis turnos'}
      </h1>
      {professional && <p className="text-muted">{daily
        ? `Atención de hoy (${today.split('-').reverse().join('/')}).`
        : 'Historial completo de tus turnos, con su estado actual y los cambios registrados.'}</p>}
      {professional && !daily && <>
        <ProfessionalCalendar revision={revision} selected={filterRange && fecha === fechaHasta ? fecha : ''}
          onSelect={day => { setFecha(day); setFechaHasta(day); setFilterRange(true); setPage(1); }} />
        <label className="form-check my-3">
          <input className="form-check-input" type="checkbox" checked={filterRange} disabled={busy}
            onChange={event => { setFilterRange(event.target.checked); setPage(1); }} />
          <span className="form-check-label">Filtrar por período (desmarcá para ver todos los turnos)</span>
        </label>
      </>}

      {professional ? (
        <div className="d-flex flex-wrap gap-3 my-3 align-items-end">
          {!daily && <>
          <label>
            Desde

            <input
              className="form-control"
              type="date"
              value={fecha}
              max={fechaHasta}
              disabled={busy || !filterRange}
              onChange={(e) => {
                if (e.target.value) {
                  setFecha(e.target.value);
                  setPage(1);
                }
              }}
            />
          </label>

          <label>
            Hasta
            <input className="form-control" type="date" value={fechaHasta}
              min={fecha} disabled={busy || !filterRange} onChange={event => {
                setFechaHasta(event.target.value);
                setPage(1);
              }} />
          </label>
          </>}
          {(['pdf', 'docx', 'xlsx'] as const).map(formato => (
            <button key={formato} className="btn btn-outline-primary"
              disabled={busy || loading || (!daily && (!filterRange || !validRange))}
              onClick={() => void download(formato)}>
              <i className={`bi bi-file-earmark-${formato === 'pdf' ? 'pdf' : formato === 'docx' ? 'word' : 'excel'} me-2`} aria-hidden="true" />
              Descargar {formato === 'pdf' ? 'PDF' : formato === 'docx' ? 'Word' : 'Excel'}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-muted">
          Para solicitar, cancelar o reprogramar un turno,
          contactá a tu salita.
        </p>
      )}

      {professional && <p className="text-muted small">
        Las descargas incluyen todos los turnos del período con su estado actual,
        agrupadas por fecha, salita y especialidad. {!daily && 'Seleccioná un período para descargar.'}
      </p>}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert alert-success"
          role="status"
        >
          {success}
        </div>
      )}

      {loading ? (
        <p role="status">
          Cargando turnos…
        </p>
      ) : !turnos.length && !error ? (
        <p>
          {professional
            ? daily
              ? `No hay turnos para el día ${today.split('-').reverse().join('/')}.`
              : filterRange
                ? `No hay turnos entre el ${fecha.split('-').reverse().join('/')} y el ${fechaHasta.split('-').reverse().join('/')}.`
                : 'No hay turnos registrados para mostrar.'
            : 'No hay turnos para mostrar.'}
        </p>
      ) : (
        <div className="table-responsive">
          <table className={`table saps-responsive-table table-striped align-middle${professional ? ' professional-agenda-table' : ''}`}>
            <thead>
              <tr>
                <th scope="col">Fecha y hora</th>

                {professional && (
                  <>
                    <th scope="col">Paciente</th>
                    <th scope="col">DNI</th>
                  </>
                )}

                <th scope="col">Profesional</th><th scope="col">Salita</th>
                <th scope="col">Especialidad</th>
                <th scope="col">Estado</th>
                <th scope="col">Motivo</th>

                {professional && (
                  <th scope="col">Acciones</th>
                )}
              </tr>
            </thead>

            <tbody>
              {turnos.map((t) => (
                <tr key={t.id_turno} className={professional ? `professional-turno--${t.estado.codigo}` : undefined}>
                  <td data-label="Fecha y hora">
                    {new Date(
                      t.fecha_hora_inicio
                    ).toLocaleString(
                      'es-AR',
                      {
                        timeZone:
                          'America/Argentina/Buenos_Aires',
                      }
                    )}
                  </td>

                  {professional && (
                    <>
                      <td data-label="Paciente">
                        {t.paciente?.persona?.apellidos}{' '}
                        {t.paciente?.persona?.nombres}
                      </td>

                      <td data-label="DNI">
                        {t.paciente?.persona?.dni}
                      </td>
                    </>
                  )}

                  <td data-label="Profesional">{t.profesional?.persona?.apellidos} {t.profesional?.persona?.nombres}</td><td data-label="Salita">
                    {t.salita?.nombre}
                  </td>

                  <td data-label="Especialidad">
                    {t.especialidad?.nombre}
                  </td>

                  <td data-label="Estado">
                    <span className={getEstadoClass(t.estado.codigo)}>{t.estado.nombre}</span>
                  </td>

                  <td data-label="Motivo">
                    {t.motivo_consulta || '—'}
                  </td>

                  {professional && (
                    <td data-label="Acciones">
                      <ProfessionalTurnoHistory turnoId={t.id_turno} revision={revision} />
                      {!t.estado.es_estado_final && (
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className="btn btn-sm btn-success"
                            disabled={busy}
                            onClick={() =>
                              void mark(
                                t,
                                'ATENDIDO'
                              )
                            }
                          >
                            Atendido
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={busy}
                            onClick={() =>
                              void mark(
                                t,
                                'NO_ASISTIO'
                              )
                            }
                          >
                            No asistió
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="d-flex flex-wrap gap-3 align-items-center">
        <button
          className="btn btn-outline-secondary"
          disabled={
            loading ||
            busy ||
            page <= 1
          }
          onClick={() =>
            setPage(page - 1)
          }
        >
          Anterior
        </button>

        <span>
          Página {page} de {Math.max(1, totalPages)}
        </span>

        <button
          className="btn btn-outline-secondary"
          disabled={
            loading ||
            busy ||
            page >= totalPages
          }
          onClick={() =>
            setPage(page + 1)
          }
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
