import React, { useState, useEffect, useCallback } from 'react';
import {
  listarJustificaciones,
  type JustificacionInasistencia,
} from '../../../../services/inasistencias.service';
import PaginationControls from '../../../../components/ui/PaginationControls';
import { FloatingFeedbackToast } from '../../../../components/ui/FormFeedback';
import {
  RECOVERABLE_ERROR_TIMEOUT_MS,
  useAutoDismiss,
} from '../../../../utils/useAutoDismiss';

interface Props {
  idSalitaFiltro?: string;
}

export const HistorialJustificacionesTab: React.FC<Props> = ({ idSalitaFiltro }) => {
  const [items, setItems] = useState<JustificacionInasistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | 'APROBADA' | 'RECHAZADA'>('TODOS');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');

  useAutoDismiss(error, () => setError(''), RECOVERABLE_ERROR_TIMEOUT_MS);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listarJustificaciones({
        estado: estadoFiltro === 'TODOS' ? undefined : estadoFiltro,
        id_salita: idSalitaFiltro || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      // El historial comprende evaluadas (APROBADA o RECHAZADA) salvo que se busque algo explícito
      const evaluadas = res.data.filter((j: JustificacionInasistencia) => j.estado !== 'PENDIENTE');
      setItems(evaluadas);
      setTotalPages(res.pagination.totalPages || 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar historial de justificaciones');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, estadoFiltro, fechaDesde, fechaHasta, search, page]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const formatFechaHora = (fechaIso?: string | null) => {
    if (!fechaIso) return '-';
    const d = new Date(fechaIso);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        {/* Filtros */}
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-4 col-lg-3">
            <label className="form-label small fw-semibold text-muted">Buscar paciente:</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="DNI, nombre o apellido..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="col-md-3 col-lg-2">
            <label className="form-label small fw-semibold text-muted">Resolución:</label>
            <select
              className="form-select"
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="TODOS">Todas las resoluciones</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
            </select>
          </div>
          <div className="col-md-2 col-lg-2">
            <label className="form-label small fw-semibold text-muted">Desde:</label>
            <input
              type="date"
              className="form-control"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="col-md-2 col-lg-2">
            <label className="form-label small fw-semibold text-muted">Hasta:</label>
            <input
              type="date"
              className="form-control"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="col-md-1 col-lg-3 text-md-end text-muted small">
            <span>Total evaluadas: {items.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando historial...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-journal-text text-muted" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No se registran resoluciones previas</h5>
            <p className="text-muted small">
              No hay justificaciones evaluadas que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Resolución</th>
                  <th>Paciente</th>
                  <th>Turno Afectado</th>
                  <th>Estado</th>
                  <th>Motivo y Documentación</th>
                  <th>Evaluado por</th>
                  <th>Motivo Resolución</th>
                </tr>
              </thead>
              <tbody>
                {items.map((j) => {
                  const pacNombre = j.paciente?.persona
                    ? `${j.paciente.persona.apellidos}, ${j.paciente.persona.nombres}`
                    : 'Paciente no identificado';
                  const pacDni = j.paciente?.persona?.dni || '-';
                  const turnoFecha = formatFechaHora(j.turno?.fecha_hora_inicio);
                  const espNombre = j.turno?.especialidad?.nombre || 'General';
                  const evaluadorNombre = j.evaluador?.persona
                    ? `${j.evaluador.persona.apellidos}, ${j.evaluador.persona.nombres}`
                    : j.evaluador?.nombre_usuario || 'Personal autorizado';

                  return (
                    <tr key={j.id_justificacion}>
                      <td className="text-nowrap small text-muted">
                        <i className="bi bi-clock-history me-1"></i>
                        {formatFechaHora(j.fecha_evaluacion)}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{pacNombre}</div>
                        <div className="text-muted small">DNI: {pacDni}</div>
                      </td>
                      <td>
                        <div className="fw-medium text-primary">{espNombre}</div>
                        <div className="text-muted small">{turnoFecha}</div>
                      </td>
                      <td>
                        {j.estado === 'APROBADA' ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                            <i className="bi bi-check-circle me-1"></i>
                            Aprobada
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="bi bi-x-circle me-1"></i>
                            Rechazada
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="text-truncate-2 small text-secondary" title={j.motivo}>
                          {j.motivo}
                        </div>
                        {j.documentacion_ref && (
                          <div className="mt-1">
                            <a
                              href={j.documentacion_ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="small text-decoration-none"
                            >
                              <i className="bi bi-paperclip me-1"></i>
                              Ver adjunto
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="small text-muted">
                        <div className="fw-medium text-dark">{evaluadorNombre}</div>
                      </td>
                      <td style={{ maxWidth: '250px' }}>
                        <div className="small text-muted" title={j.motivo_resolucion || ''}>
                          {j.motivo_resolucion || 'Sin observaciones registradas'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-4 d-flex justify-content-center">
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={(p: number) => setPage(p)}
            />
          </div>
        )}

        {error && <FloatingFeedbackToast variant="error" message={error} onDismiss={() => setError('')} />}
      </div>
    </div>
  );
};
