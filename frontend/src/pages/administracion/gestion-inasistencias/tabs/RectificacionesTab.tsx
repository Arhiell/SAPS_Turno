import React, { useState, useEffect, useCallback } from 'react';
import { getTurnos } from '../../../../services/turnos.service';
import type { Turno } from '../../../../types/turno.types';
import PaginationControls from '../../../../components/ui/PaginationControls';
import { FloatingFeedbackToast } from '../../../../components/ui/FormFeedback';
import {
  RECOVERABLE_ERROR_TIMEOUT_MS,
  useAutoDismiss,
} from '../../../../utils/useAutoDismiss';

interface Props {
  idSalitaFiltro?: string;
}

export const RectificacionesTab: React.FC<Props> = ({ idSalitaFiltro }) => {
  const [items, setItems] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useAutoDismiss(error, () => setError(''), RECOVERABLE_ERROR_TIMEOUT_MS);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTurnos({
        id_salita: idSalitaFiltro || undefined,
        rectificado: 'true',
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      setItems(res.data.turnos);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotal(res.data.pagination.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al consultar rectificaciones');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, fechaDesde, fechaHasta, search, page]);

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
          <div className="col-md-4 col-lg-5 text-md-end text-muted small">
            <span>Total rectificados: {total}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando historial de rectificaciones...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-pencil-square text-muted" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No hay turnos rectificados</h5>
            <p className="text-muted small">
              No se han registrado correcciones de inasistencia en los turnos consultados.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Turno</th>
                  <th>Paciente</th>
                  <th>Estado Actual</th>
                  <th>Fecha Rectificación</th>
                  <th>Motivo Explicado</th>
                  <th>Salita</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const pacNombre = t.paciente?.persona
                    ? `${t.paciente.persona.apellidos}, ${t.paciente.persona.nombres}`
                    : 'Paciente no identificado';
                  const pacDni = t.paciente?.persona?.dni || '-';

                  return (
                    <tr key={t.id_turno}>
                      <td className="text-nowrap small">
                        <div className="fw-medium text-dark">{formatFechaHora(t.fecha_hora_inicio)}</div>
                        <div className="text-muted small font-monospace">{t.codigo_turno}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{pacNombre}</div>
                        <div className="text-muted small">DNI: {pacDni}</div>
                      </td>
                      <td>
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          <i className="bi bi-check2-circle me-1"></i>
                          {t.estado?.nombre || 'ATENDIDO'}
                        </span>
                        <div className="text-muted small">Corregido desde NO_ASISTIO</div>
                      </td>
                      <td className="text-nowrap small text-muted">
                        <i className="bi bi-clock-history me-1"></i>
                        {formatFechaHora(t.fecha_rectificacion)}
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div className="small text-secondary" title={t.motivo_rectificacion || ''}>
                          {t.motivo_rectificacion || 'Corrección de registro efectuada por personal autorizado.'}
                        </div>
                      </td>
                      <td className="small text-muted">{t.salita?.nombre || '-'}</td>
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
