import React, { useState, useEffect, useCallback } from 'react';
import {
  listarInasistenciasRegistradas,
  rectificarInasistencia,
  type InasistenciaRegistradaItem,
} from '../../../../services/inasistencias.service';
import PaginationControls from '../../../../components/ui/PaginationControls';
import ConfirmationModal from '../../../../components/ui/ConfirmationModal';
import { FloatingFeedbackToast } from '../../../../components/ui/FormFeedback';
import {
  RECOVERABLE_ERROR_TIMEOUT_MS,
  SUCCESS_MESSAGE_TIMEOUT_MS,
  useAutoDismiss,
} from '../../../../utils/useAutoDismiss';

interface Props {
  idSalitaFiltro?: string;
  onActualizado?: () => void;
}

export const InasistenciasRegistradasTab: React.FC<Props> = ({
  idSalitaFiltro,
  onActualizado,
}) => {
  const [items, setItems] = useState<InasistenciaRegistradaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Rectificación modal
  const [rectificarTarget, setRectificarTarget] = useState<InasistenciaRegistradaItem | null>(null);
  const [motivoRectificacion, setMotivoRectificacion] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useAutoDismiss(error, () => setError(''), RECOVERABLE_ERROR_TIMEOUT_MS);
  useAutoDismiss(success, () => setSuccess(''), SUCCESS_MESSAGE_TIMEOUT_MS);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listarInasistenciasRegistradas({
        id_salita: idSalitaFiltro || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });

      setItems(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotal(res.pagination.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al consultar inasistencias');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, fechaDesde, fechaHasta, search, page]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const abrirModalRectificar = (item: InasistenciaRegistradaItem) => {
    setRectificarTarget(item);
    setMotivoRectificacion('Error de registro: el paciente concurrió y fue atendido.');
    setModalOpen(true);
  };

  const confirmarRectificacion = async () => {
    if (!rectificarTarget) return;
    if (!motivoRectificacion.trim() || motivoRectificacion.trim().length < 5) {
      setError('Debe especificar un motivo válido de rectificación (mínimo 5 caracteres).');
      return;
    }

    try {
      setSaving(true);
      await rectificarInasistencia(rectificarTarget.id_turno, {
        nuevo_estado: 'ATENDIDO',
        motivo_rectificacion: motivoRectificacion.trim(),
      });

      setSuccess('Inasistencia rectificada exitosamente a ATENDIDO. Se actualizó el conteo de faltas.');
      setModalOpen(false);
      setRectificarTarget(null);
      void cargarDatos();
      if (onActualizado) onActualizado();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al rectificar la inasistencia');
    } finally {
      setSaving(false);
    }
  };

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

  const renderBadgeJustificacion = (just?: InasistenciaRegistradaItem['justificacion']) => {
    if (!just) {
      return <span className="badge bg-light text-muted border">Sin solicitud</span>;
    }

    switch (just.estado) {
      case 'PENDIENTE':
        return (
          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
            <i className="bi bi-hourglass-split me-1"></i>
            Justificación Pendiente
          </span>
        );
      case 'APROBADA':
        return (
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            <i className="bi bi-check-circle me-1"></i>
            Justificada (Excluida)
          </span>
        );
      case 'RECHAZADA':
        return (
          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
            <i className="bi bi-x-circle me-1"></i>
            Justif. Rechazada
          </span>
        );
    }
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
            <span>Total registradas: {total}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando registros de inasistencias...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No se registran inasistencias</h5>
            <p className="text-muted small">
              No hay turnos con estado NO_ASISTIO según los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Turno</th>
                  <th>Paciente</th>
                  <th>Faltas Activas (90d)</th>
                  <th>Especialidad / Salita</th>
                  <th>Estado de Justificación</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const pacNombre = item.paciente?.persona
                    ? `${item.paciente.persona.apellidos}, ${item.paciente.persona.nombres}`
                    : 'Paciente no identificado';
                  const pacDni = item.paciente?.persona?.dni || '-';
                  const turnoFecha = formatFechaHora(item.fecha_hora_inicio);
                  const faltasBadgeColor =
                    item.faltas_90d >= 3 ? 'bg-danger' : item.faltas_90d >= 2 ? 'bg-warning text-dark' : 'bg-info text-dark';

                  return (
                    <tr key={item.id_turno}>
                      <td className="text-nowrap small">
                        <div className="fw-medium text-dark">{turnoFecha}</div>
                        <div className="text-muted small font-monospace">{item.codigo_turno}</div>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{pacNombre}</div>
                        <div className="text-muted small">DNI: {pacDni}</div>
                      </td>
                      <td>
                        <span className={`badge ${faltasBadgeColor} px-2 py-1`}>
                          {item.faltas_90d} {item.faltas_90d === 1 ? 'inasistencia' : 'inasistencias'}
                        </span>
                      </td>
                      <td>
                        <div className="fw-medium text-primary">{item.especialidad?.nombre || 'General'}</div>
                        <div className="text-muted small">{item.salita?.nombre || '-'}</div>
                      </td>
                      <td>{renderBadgeJustificacion(item.justificacion)}</td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => abrirModalRectificar(item)}
                          title="Rectificar error y cambiar estado a ATENDIDO"
                        >
                          <i className="bi bi-pencil-square me-1"></i>
                          Rectificar
                        </button>
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

        {/* Modal de Rectificación */}
        <ConfirmationModal
          open={modalOpen}
          title="Rectificar inasistencia errónea"
          message="Esta acción modificará el estado del turno de NO_ASISTIO a ATENDIDO, restando la falta de los antecedentes del paciente y anulando advertencias vinculadas si correspondiera."
          confirmText="Confirmar Rectificación"
          cancelText="Cancelar"
          variant="warning"
          loading={saving}
          onConfirm={confirmarRectificacion}
          onClose={() => setModalOpen(false)}
          detail={
            <div className="mt-3">
              <label className="form-label small fw-semibold text-secondary">
                Motivo o justificación de la rectificación:
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder="Indique detalladamente el motivo de la corrección..."
                value={motivoRectificacion}
                onChange={(e) => setMotivoRectificacion(e.target.value)}
              />
            </div>
          }
        />

        {error && <FloatingFeedbackToast variant="error" message={error} onDismiss={() => setError('')} />}
        {success && <FloatingFeedbackToast variant="success" message={success} onDismiss={() => setSuccess('')} />}
      </div>
    </div>
  );
};
