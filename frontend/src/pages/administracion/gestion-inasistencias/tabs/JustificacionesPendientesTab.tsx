import React, { useState, useEffect, useCallback } from 'react';
import {
  listarJustificaciones,
  evaluarJustificacion,
  type JustificacionInasistencia,
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

export const JustificacionesPendientesTab: React.FC<Props> = ({
  idSalitaFiltro,
  onActualizado,
}) => {
  const [items, setItems] = useState<JustificacionInasistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal de evaluación
  const [selectedJustificacion, setSelectedJustificacion] = useState<JustificacionInasistencia | null>(null);
  const [evalDecision, setEvalDecision] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [motivoResolucion, setMotivoResolucion] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useAutoDismiss(error, () => setError(''), RECOVERABLE_ERROR_TIMEOUT_MS);
  useAutoDismiss(success, () => setSuccess(''), SUCCESS_MESSAGE_TIMEOUT_MS);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listarJustificaciones({
        estado: 'PENDIENTE',
        id_salita: idSalitaFiltro || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setItems(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotal(res.pagination.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al cargar justificaciones pendientes');
    } finally {
      setLoading(false);
    }
  }, [idSalitaFiltro, search, page]);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const abrirModalEvaluacion = (just: JustificacionInasistencia, decision: 'APROBADA' | 'RECHAZADA') => {
    setSelectedJustificacion(just);
    setEvalDecision(decision);
    setMotivoResolucion(decision === 'APROBADA' ? 'Justificación válida y aceptada.' : '');
    setModalOpen(true);
  };

  const confirmarEvaluacion = async () => {
    if (!selectedJustificacion) return;
    if (evalDecision === 'RECHAZADA' && !motivoResolucion.trim()) {
      setError('Debe especificar el motivo del rechazo.');
      return;
    }

    try {
      setSaving(true);
      await evaluarJustificacion(selectedJustificacion.id_justificacion, {
        estado: evalDecision,
        motivo_resolucion: motivoResolucion.trim() || undefined,
      });

      setSuccess(`Justificación ${evalDecision.toLowerCase()} correctamente.`);
      setModalOpen(false);
      setSelectedJustificacion(null);
      void cargarDatos();
      if (onActualizado) onActualizado();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al evaluar la justificación');
    } finally {
      setSaving(false);
    }
  };

  const formatFechaHora = (fechaIso?: string) => {
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
        {/* Barra superior de búsqueda y conteo */}
        <div className="row g-3 align-items-center mb-3">
          <div className="col-md-6 col-lg-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por DNI, nombre o apellido del paciente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              {search && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
          <div className="col-md-6 col-lg-7 text-md-end text-muted small">
            <span>Mostrando {items.length} de {total} solicitudes pendientes</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2 text-muted">Cargando justificaciones pendientes...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-check-circle text-success" style={{ fontSize: '2.5rem' }}></i>
            <h5 className="mt-3 text-secondary">No hay justificaciones pendientes</h5>
            <p className="text-muted small">
              {search
                ? 'No se encontraron solicitudes que coincidan con la búsqueda.'
                : 'Todas las solicitudes presentadas han sido evaluadas.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fecha Presentación</th>
                  <th>Paciente</th>
                  <th>Turno Afectado</th>
                  <th>Motivo Explicado</th>
                  <th>Doc. Adjunta</th>
                  <th className="text-end">Acciones</th>
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
                  const salitaNombre = j.turno?.salita?.nombre || '';

                  return (
                    <tr key={j.id_justificacion}>
                      <td className="text-nowrap small text-muted">
                        <i className="bi bi-calendar3 me-1"></i>
                        {formatFechaHora(j.fecha_creacion)}
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{pacNombre}</div>
                        <div className="text-muted small">DNI: {pacDni}</div>
                      </td>
                      <td>
                        <div className="fw-medium text-primary">{espNombre}</div>
                        <div className="text-muted small">
                          {turnoFecha}
                          {salitaNombre && ` · ${salitaNombre}`}
                        </div>
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div className="text-truncate-2 small text-secondary" title={j.motivo}>
                          {j.motivo}
                        </div>
                      </td>
                      <td>
                        {j.documentacion_ref ? (
                          <a
                            href={j.documentacion_ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-info text-nowrap"
                            title="Ver archivo o referencia respaldatoria"
                          >
                            <i className="bi bi-paperclip me-1"></i>
                            Ver adjunto
                          </a>
                        ) : (
                          <span className="badge bg-light text-muted border">Sin adjunto</span>
                        )}
                      </td>
                      <td className="text-end text-nowrap">
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={() => abrirModalEvaluacion(j, 'APROBADA')}
                          title="Aprobar justificación y excluir inasistencia"
                        >
                          <i className="bi bi-check-lg me-1"></i>
                          Aprobar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => abrirModalEvaluacion(j, 'RECHAZADA')}
                          title="Rechazar justificación"
                        >
                          <i className="bi bi-x-lg me-1"></i>
                          Rechazar
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

        {/* Modal de confirmación de evaluación */}
        <ConfirmationModal
          open={modalOpen}
          title={
            evalDecision === 'APROBADA'
              ? 'Aprobar justificación de inasistencia'
              : 'Rechazar justificación de inasistencia'
          }
          message={
            evalDecision === 'APROBADA'
              ? 'Al aprobar la solicitud, la inasistencia se excluirá del conteo de faltas del paciente y se anularán posibles sanciones activas originadas por este turno.'
              : 'Al rechazar la solicitud, la inasistencia se mantendrá computable dentro de la ventana de 90 días.'
          }
          confirmText={evalDecision === 'APROBADA' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
          cancelText="Cancelar"
          variant={evalDecision === 'APROBADA' ? 'primary' : 'danger'}
          loading={saving}
          onConfirm={confirmarEvaluacion}
          onClose={() => setModalOpen(false)}
          detail={
            <div className="mt-3">
              <label className="form-label small fw-semibold text-secondary">
                Motivo u observaciones de la resolución:
              </label>
              <textarea
                className="form-control form-control-sm"
                rows={3}
                placeholder={
                  evalDecision === 'APROBADA'
                    ? 'Ej: Motivo acreditado satisfactoriamente.'
                    : 'Ej: Documentación no respaldatoria o insuficiente.'
                }
                value={motivoResolucion}
                onChange={(e) => setMotivoResolucion(e.target.value)}
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
