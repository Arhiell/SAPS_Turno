import React, { useState, useEffect, useCallback } from 'react';
import {
  listarAdvertenciasAdmin,
  anularAdvertenciaAdmin,
  type AdvertenciaAdminItem,
} from '../../../../services/inasistencias.service';
import PaginationControls from '../../../../components/ui/PaginationControls';
import ConfirmationModal from '../../../../components/ui/ConfirmationModal';
import { FloatingFeedbackToast } from '../../../../components/ui/FormFeedback';
import {
  RECOVERABLE_ERROR_TIMEOUT_MS,
  SUCCESS_MESSAGE_TIMEOUT_MS,
  useAutoDismiss,
} from '../../../../utils/useAutoDismiss';
import { useAuth } from '../../../../context/AuthContext';

interface Props {
  idSalitaFiltro?: string;
  onActualizado?: () => void;
}

export const AdvertenciasRestriccionesTab: React.FC<Props> = ({
  idSalitaFiltro,
  onActualizado,
}) => {
  const { user } = useAuth();
  const esAdmin = user?.rol === 'SUPER_ADMIN' || user?.rol === 'ADMIN_SALITA';

  const [items, setItems] = useState<AdvertenciaAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nivelFiltro, setNivelFiltro] = useState<'TODOS' | 'PRIMERA_ADVERTENCIA' | 'ADVERTENCIA_FORMAL' | 'RESTRICCION'>('TODOS');
  const [estadoFiltro, setEstadoFiltro] = useState<'TODAS' | 'VIGENTES' | 'ANULADAS'>('VIGENTES');
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Anulación modal
  const [selectedAdv, setSelectedAdv] = useState<AdvertenciaAdminItem | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useAutoDismiss(error, () => setError(''), RECOVERABLE_ERROR_TIMEOUT_MS);
  useAutoDismiss(success, () => setSuccess(''), SUCCESS_MESSAGE_TIMEOUT_MS);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listarAdvertenciasAdmin({
        id_salita: idSalitaFiltro || undefined,
        nivel: nivelFiltro === 'TODOS' ? undefined : nivelFiltro,
        anulada: estadoFiltro === 'TODAS' ? undefined : estadoFiltro === 'ANULADAS' ? 'true' : 'false',
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
      setError(err?.response?.data?.message || 'Error al consultar advertencias');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, nivelFiltro, estadoFiltro, fechaDesde, fechaHasta, search, page]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const abrirModalAnular = (adv: AdvertenciaAdminItem) => {
    setSelectedAdv(adv);
    setMotivoAnulacion('');
    setModalOpen(true);
  };

  const confirmarAnulacion = async () => {
    if (!selectedAdv) return;
    if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 5) {
      setError('Debe especificar un motivo válido de anulación (al menos 5 caracteres).');
      return;
    }

    try {
      setSaving(true);
      await anularAdvertenciaAdmin(selectedAdv.id_advertencia, {
        motivo_anulacion: motivoAnulacion.trim(),
      });

      setSuccess(
        selectedAdv.nivel === 'RESTRICCION'
          ? 'Restricción anulada correctamente con registro de auditoría.'
          : 'Advertencia anulada correctamente con registro de auditoría.'
      );
      setModalOpen(false);
      setSelectedAdv(null);
      void cargarDatos();
      if (onActualizado) onActualizado();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al anular la advertencia');
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

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4">
        {/* Cuadro resumen de la política progresiva */}
        <div className="alert alert-light border py-2 px-3 mb-4 d-flex align-items-center small">
          <i className="bi bi-shield-exclamation me-2 fs-5 text-primary"></i>
          <div>
            <strong>Regla de política progresiva (90 días):</strong> 1.ª inasistencia = Advertencia informativa (1/3). 2.ª inasistencia = Advertencia formal (2/3). 3.ª inasistencia = Restricción preventiva de 7 días para reservas online. Las consultas presenciales nunca se bloquean.
          </div>
        </div>

        {/* Filtros */}
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-3 col-lg-3">
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
            <label className="form-label small fw-semibold text-muted">Nivel de advertencia:</label>
            <select
              className="form-select"
              value={nivelFiltro}
              onChange={(e) => {
                setNivelFiltro(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="TODOS">Todos los niveles</option>
              <option value="PRIMERA_ADVERTENCIA">Primera (1/3)</option>
              <option value="ADVERTENCIA_FORMAL">Formal (2/3)</option>
              <option value="RESTRICCION">Restricción (3/3)</option>
            </select>
          </div>
          <div className="col-md-2 col-lg-2">
            <label className="form-label small fw-semibold text-muted">Estado:</label>
            <select
              className="form-select"
              value={estadoFiltro}
              onChange={(e) => {
                setEstadoFiltro(e.target.value as any);
                setPage(1);
              }}
            >
              <option value="VIGENTES">Vigentes (Activas)</option>
              <option value="ANULADAS">Anuladas</option>
              <option value="TODAS">Todas</option>
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
          <div className="col-md-1 col-lg-1 text-md-end text-muted small">
            <span>Total: {total}</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando advertencias...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-shield-check text-success" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No se registran advertencias</h5>
            <p className="text-muted small">
              No hay advertencias emitidas que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Emisión</th>
                  <th>Paciente</th>
                  <th>Nivel</th>
                  <th>Estado</th>
                  <th>Turno que la Originó</th>
                  <th>Motivo / Auditoría</th>
                  {esAdmin && <th className="text-end">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {items.map((adv) => {
                  const pacNombre = adv.paciente?.persona
                    ? `${adv.paciente.persona.apellidos}, ${adv.paciente.persona.nombres}`
                    : 'Paciente no identificado';
                  const pacDni = adv.paciente?.persona?.dni || '-';
                  const turnoFecha = formatFechaHora(adv.turno?.fecha_hora_inicio);
                  const espNombre = adv.turno?.especialidad?.nombre || 'General';

                  return (
                    <tr key={adv.id_advertencia}>
                      <td className="text-nowrap small text-muted">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatFechaHora(adv.fecha_emision)}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{pacNombre}</div>
                        <div className="text-muted small">DNI: {pacDni}</div>
                      </td>
                      <td>
                        {adv.nivel === 'PRIMERA_ADVERTENCIA' ? (
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1">
                            1.ª Advertencia (1/3)
                          </span>
                        ) : adv.nivel === 'ADVERTENCIA_FORMAL' ? (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
                            Advertencia Formal (2/3)
                          </span>
                        ) : (
                          <div>
                            <span className="badge bg-danger text-white px-2 py-1">
                              <i className="bi bi-slash-circle me-1"></i>
                              Restricción (3/3)
                            </span>
                            {adv.fecha_fin && (
                              <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                                Hasta: {formatFechaHora(adv.fecha_fin)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {adv.anulada ? (
                          <span className="badge bg-secondary-subtle text-secondary border px-2 py-1">
                            <i className="bi bi-x-circle me-1"></i>
                            Anulada
                          </span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Vigente
                          </span>
                        )}
                      </td>
                      <td>
                        {adv.turno ? (
                          <>
                            <div className="fw-medium text-primary">{espNombre}</div>
                            <div className="text-muted small">{turnoFecha}</div>
                          </>
                        ) : (
                          <span className="text-muted small">No asociado a turno</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="small text-secondary" title={adv.motivo}>
                          {adv.motivo}
                        </div>
                        {adv.anulada && adv.motivo_anulacion && (
                          <div className="mt-1 small text-muted border-start ps-2">
                            <span className="fw-medium">Motivo anulación:</span> {adv.motivo_anulacion}
                          </div>
                        )}
                      </td>
                      {esAdmin && (
                        <td className="text-end text-nowrap">
                          {!adv.anulada && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => abrirModalAnular(adv)}
                              title={adv.nivel === 'RESTRICCION' ? 'Anular restricción con registro de motivo' : 'Anular advertencia con registro de motivo'}
                            >
                              <i className="bi bi-slash-circle me-1"></i>
                              Anular
                            </button>
                          )}
                        </td>
                      )}
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

        {/* Modal de Anulación */}
        <ConfirmationModal
          open={modalOpen}
          title={selectedAdv?.nivel === 'RESTRICCION' ? 'Anular restricción de turnos online' : 'Anular advertencia de inasistencia'}
          message={
            selectedAdv?.nivel === 'RESTRICCION'
              ? 'Esta acción anulará la restricción de reservas online vigente para el paciente. Debe fundamentar el motivo de la anulación para los registros de auditoría.'
              : 'Esta acción anulará la advertencia administrativa emitida al paciente. Debe fundamentar el motivo de la anulación para los registros de auditoría.'
          }
          confirmText="Confirmar Anulación"
          cancelText="Cancelar"
          variant="danger"
          loading={saving}
          onConfirm={confirmarAnulacion}
          onClose={() => setModalOpen(false)}
          detail={
            <div className="mt-3">
              <label className="form-label small fw-semibold text-secondary">
                {selectedAdv?.nivel === 'RESTRICCION'
                  ? 'Motivo de anulación de la restricción:'
                  : 'Motivo de la anulación administrativa:'}
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder={
                  selectedAdv?.nivel === 'RESTRICCION'
                    ? 'Indique detalladamente por qué se anula la restricción...'
                    : 'Indique detalladamente por qué se anula la advertencia...'
                }
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
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
