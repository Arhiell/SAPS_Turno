import { getEstadoClass } from '../../utils/turno-status';
import { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

import {
  getTurnos,
  changeTurnoStatus,
} from '../../services/turnos.service';

import {
  descargarAgendaDiaria,
} from '../../services/reportes.service';

import { authError } from '../../utils/auth-errors';

import type { Turno } from '../../types/turno.types';

export default function MisTurnosPage() {
  const { user } = useAuth();

  const professional = user?.rol === 'PROFESIONAL';

  const [fecha, setFecha] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date())
  );

  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setTurnos([]);

    void getTurnos({
      ...(professional ? { fecha } : {}),
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
  }, [professional, fecha, page, revision]);

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

  const download = async () => {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await descargarAgendaDiaria(
        {
          fecha,
        },
        'pdf'
      );
    } catch {
      setError(
        'No se pudo descargar la agenda. Volvé a intentar.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="h3">
        {professional
          ? 'Mi agenda y pacientes del día'
          : 'Mis turnos'}
      </h1>

      {professional ? (
        <div className="d-flex flex-wrap gap-3 my-3 align-items-end">
          <label>
            Fecha

            <input
              className="form-control"
              type="date"
              value={fecha}
              disabled={busy}
              onChange={(e) => {
                if (e.target.value) {
                  setFecha(e.target.value);
                  setPage(1);
                }
              }}
            />
          </label>

          <button
            className="btn btn-outline-primary"
            disabled={busy || loading}
            onClick={() => void download()}
          >
            Descargar lista diaria PDF
          </button>
        </div>
      ) : (
        <p className="text-muted">
          Para solicitar, cancelar o reprogramar un turno,
          contactá a tu salita.
        </p>
      )}

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
      ) : (
        <div className="table-responsive">
          <table className="table saps-responsive-table table-striped align-middle">
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
                <tr key={t.id_turno}>
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

          {!turnos.length && !error && (
            <p>
              No hay turnos para mostrar.
            </p>
          )}
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
