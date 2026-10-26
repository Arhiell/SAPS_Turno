import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  getTurnos,
} from '../../services/turnos.service';

import type {
  Turno,
  TurnosFilters,
} from '../../types/turno.types';

import TurnoCard from '../../components/ui/TurnoCard';
import useManagedPatients from '../../context/useManagedPatients';
import ManagedPatientSelector from '../../components/ui/ManagedPatientSelector';

import {
  getEstadoClass,
} from '../../utils/turno-status';

export default function PatientAppointmentsPage() {
  const selection = useManagedPatients();
  useEffect(() => { setPage(1); }, [selection.id]);
  // FILTROS

  // Período seleccionado:
  // próximos, anteriores o historial completo.
  const [
    periodo,
    setPeriodo,
  ] = useState<TurnosFilters['periodo']>();

  // Estado seleccionado para filtrar los turnos.
  const [
    estado,
    setEstado,
  ] = useState('');

  //PAGINACIÓN

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pages,
    setPages,
  ] = useState(0);

  // ESTADO DE LA PÁGINA

  const [
    items,
    setItems,
  ] = useState<Turno[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  // Permite volver a cargar los turnos.
  const [
    revision,
    setRevision,
  ] = useState(0);

  //  CARGA DE TURNOS

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');
    setItems([]);
    if (selection.loading || selection.error || !selection.selected) {
      setLoading(selection.loading);
      return;
    }

    // La API filtra por la identidad
    // de sesión antes de paginar.
    void getTurnos({
      id_paciente: selection.id,
      periodo,
      ...(
        estado === 'REPROGRAMADO'
          ? {
              reprogramados: 'true',
            }
          : estado
            ? {
                estado,
              }
            : {}
      ),
      orden: 'desc',
      page,
      limit: 10,
    })
      .then((response) => {
        if (active) {
          setItems(
            response.data.turnos
          );

          setPages(
            response.data.pagination.totalPages
          );
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'No se pudieron cargar tus turnos.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    // Evita actualizar el estado después
    // de desmontar el componente.
    return () => {
      active = false;
    };
  }, [
    periodo,
    estado,
    page,
    revision,
    selection.id, selection.loading, selection.error,
  ]);

  // INTERFAZ

  return (
    <section>
      {/* Encabezado y acción principal. */}
      <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
        <div>
          <h1 className="h3">
            Mis turnos
          </h1>

          <p className="text-muted">
            Consultá próximos turnos y tu historial
            de atención.
          </p>
        </div>

        <Link
          className="btn btn-saps align-self-start"
          to={`/solicitar-turno?paciente=${selection.id}`}
        >
          Solicitar turno
        </Link>
      </div>

      {/* FILTROS */}
      <ManagedPatientSelector selection={selection} />

      <div className="row g-3 mb-4">
        {/* Filtro por período. */}
        <div className="col-12 col-sm-6">
          <label className="form-label w-100">
            Período

            <select
              className="form-select mt-1"
              value={periodo ?? ''}
              onChange={(event) => {
                setPeriodo(
                  (
                    event.target.value ||
                    undefined
                  ) as TurnosFilters['periodo']
                );

                // Regresa a la primera página
                // cuando cambia el filtro.
                setPage(1);
              }}
            >
              <option value="">
                Historial de turnos completo
              </option>

              <option value="proximos">
                Próximos
              </option>

              <option value="anteriores">
                Anteriores
              </option>
            </select>
          </label>
        </div>

        {/* Filtro por estado. */}
        <div className="col-12 col-sm-6">
          <label className="form-label w-100">
            Estado

            <select
              className="form-select mt-1"
              value={estado}
              onChange={(event) => {
                setEstado(
                  event.target.value
                );

                // Regresa a la primera página
                // cuando cambia el filtro.
                setPage(1);
              }}
            >
              <option value="">
                Todos los estados
              </option>

              {Object.entries({
                SOLICITADO: 'Solicitados',
                CONFIRMADO: 'Confirmados',
                EN_ESPERA: 'En espera',
                CANCELADO: 'Cancelados',
                REPROGRAMADO: 'Reprogramados',
                ATENDIDO: 'Atendidos',
                NO_ASISTIO: 'No asistió',
              }).map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="alert alert-danger"
          role="alert"
        >
          {error}{' '}

          <button
            className="btn btn-outline-danger"
            onClick={() =>
              setRevision(
                (v) => v + 1
              )
            }
          >
            Reintentar
          </button>
        </div>
      )}

      {/* LISTADO DE TURNOS */}

      {loading ? (
        <p role="status">
          Cargando turnos…
        </p>
      ) : !error && (
        <>
          {!items.length ? (
            // No existen turnos para los filtros.
            <div className="patient-section">
              <p className="mb-0">
                No tenés turnos registrados para
                estos filtros.
              </p>
            </div>
          ) : (
            <>
              {/* VISTA MÓVIL */}

              <div className="d-grid d-md-none gap-3">
                {items.map(
                  (turno) => (
                    <TurnoCard
                      key={turno.id_turno}
                      turno={turno}
                      patient
                      onChanged={() =>
                        setRevision(
                          (v) => v + 1
                        )
                      }
                    />
                  )
                )}
              </div>

              {/* VISTA ESCRITORIO*/}

              <div className="table-responsive d-none d-md-block">
                <table className="table align-middle table-striped">
                  <thead>
                    <tr>
                      {[
                        'Fecha y hora',
                        'Profesional / Especialidad',
                        'Salita',
                        'Estado',
                        'Motivo / Código',
                        'Detalle',
                      ].map(
                        (label) => (
                          <th
                            scope="col"
                            key={label}
                          >
                            {label}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {items.map(
                      (t) => (
                        <tr key={t.id_turno}>
                          {/* Fecha y hora del turno. */}
                          <td>
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

                          {/* Profesional y especialidad. */}
                          <td>
                            {
                              t.profesional?.persona
                                ?.apellidos
                            }{' '}
                            {
                              t.profesional?.persona
                                ?.nombres
                            }

                            <br />

                            <small>
                              {
                                t.especialidad
                                  ?.nombre
                              }
                            </small>
                          </td>

                          {/* Salita asignada. */}
                          <td>
                            {t.salita?.nombre}
                          </td>

                          {/* Estado actual del turno. */}
                          <td>
                            <span
                              className={getEstadoClass(
                                t.estado.codigo
                              )}
                            >
                              {t.estado.nombre}
                            </span>
                          </td>

                          {/* Motivo y código del turno. */}
                          <td>
                            {t.motivo_consulta ||
                              'Sin informar'}

                            <br />

                            <small>
                              {t.codigo_turno}
                            </small>
                          </td>

                          {/* Acceso al detalle. */}
                          <td>
                            <Link
                              className="btn btn-sm btn-outline-success"
                              to={`/mis-turnos/${t.id_turno}`}
                            >
                              Ver detalle
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/*  PAGINACIÓN */}

      {pages > 1 && (
        <div className="d-flex flex-wrap gap-3 align-items-center mt-4">
          <button
            className="btn btn-outline-secondary"
            disabled={
              loading ||
              page <= 1
            }
            onClick={() =>
              setPage(
                (v) => v - 1
              )
            }
          >
            Anterior
          </button>

          <span>
            Página {page} de {pages}
          </span>

          <button
            className="btn btn-outline-secondary"
            disabled={
              loading ||
              page >= pages
            }
            onClick={() =>
              setPage(
                (v) => v + 1
              )
            }
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
