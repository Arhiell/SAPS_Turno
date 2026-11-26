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

export const CancelacionesTab: React.FC<Props> = ({ idSalitaFiltro }) => {
  const [items, setItems] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<'TODAS' | 'ANTICIPADA' | 'TARDIA' | 'ADMINISTRATIVA'>('TODAS');
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
        estado: 'CANCELADO',
        id_salita: idSalitaFiltro || undefined,
        tipo_cancelacion: tipoFiltro === 'TODAS' ? undefined : tipoFiltro,
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
      setError(err?.response?.data?.message || 'Error al consultar cancelaciones de turnos');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, tipoFiltro, fechaDesde, fechaHasta, search, page]);

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

  const renderBadgeTipo = (tipo?: 'ANTICIPADA' | 'TARDIA' | 'ADMINISTRATIVA' | null) => {
    switch (tipo) {
      case 'ANTICIPADA':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
            <i className="bi bi-clock-check me-1"></i>
            Anticipada (≥ 24h)
          </span>
        );
      case 'TARDIA':
        return (
          <span
            className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1"
            title="Cancelación informativa de auditoría. No genera sanciones según la política vigente."
          >
            <i className="bi bi-clock-history me-1"></i>
            Tardía (&lt; 24h)
          </span>
        );
      case 'ADMINISTRATIVA':
        return (
          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1">
            <i className="bi bi-person-gear me-1"></i>
            Administrativa
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-muted border px-2 py-1">
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        {/* Aviso informativo de auditoría */}
        <div className="alert alert-info py-2 px-3 mb-4 d-flex align-items-center small">
          <i className="bi bi-info-circle-fill me-2 fs-5"></i>
          <div>
            <strong>Registro de cancelaciones:</strong> Las cancelaciones tardías se registran exclusivamente
            con fines estadísticos y de auditoría. <strong>No generan penalizaciones ni sanciones</strong> sobre el paciente.
          </div>
        </div>

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
          <div className="col-md-3 col-lg-3">
            <label className="form-label small fw-semibold text-muted">Tipo de cancelación:</label>
            <select
              className="form-select"
              value={tipoFiltro}
              onChange={(e) => {
                setTipoFiltro(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="TODAS">Todos los tipos</option>
              <option value="ANTICIPADA">Anticipadas (≥ 24 horas)</option>
              <option value="TARDIA">Tardías (&lt; 24 horas)</option>
              <option value="ADMINISTRATIVA">Administrativas (personal)</option>
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
          <div className="col-md-1 col-lg-2 text-md-end text-muted small">
            <span>Total: {total}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando cancelaciones...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-check text-muted" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No se registran cancelaciones</h5>
            <p className="text-muted small">
              No hay turnos cancelados que coincidan con los filtros establecidos.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Turno</th>
                  <th>Paciente</th>
                  <th>Profesional / Especialidad</th>
                  <th>Tipo Cancelación</th>
                  <th>Fecha Cancelación</th>
                  <th>Motivo Registrado</th>
                  <th>Salita</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => {
                  const pacNombre = t.paciente?.persona
                    ? `${t.paciente.persona.apellidos}, ${t.paciente.persona.nombres}`
                    : 'Paciente no asignado';
                  const pacDni = t.paciente?.persona?.dni || '-';
                  const profNombre = t.profesional?.persona
                    ? `${t.profesional.persona.apellidos}, ${t.profesional.persona.nombres}`
                    : 'Sin profesional';

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
                        <div className="fw-medium text-primary">{t.especialidad?.nombre || 'General'}</div>
                        <div className="text-muted small">{profNombre}</div>
                      </td>
                      <td>{renderBadgeTipo(t.tipo_cancelacion)}</td>
                      <td className="text-nowrap small text-muted">
                        <i className="bi bi-x-circle me-1 text-danger"></i>
                        {formatFechaHora(t.fecha_cancelacion)}
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="small text-secondary" title={t.motivo_cancelacion || ''}>
                          {t.motivo_cancelacion || 'Sin motivo explicitado'}
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
