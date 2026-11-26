import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import AgendaAffectedList from './AgendaAffectedList';
import AgendaReview from './AgendaReview';
import {
  getAgendaImpact,
  getAgendaProposal,
  confirmAgendaProposal,
  type AgendaChange,
  type AffectedTurno,
  type AgendaProposal,
  type AgendaResult,
} from '../../services/agenda-impacto.service';
import {
  guardarHorario,
  guardarBloqueo,
} from '../../services/configuracion.service';
import { authError } from '../../utils/auth-errors';
import { agendaDate, agendaDateTime } from '../../utils/agenda-display';
import { guardarCierre } from '../../services/cierre-calendario.service';

interface Props {
  cambio: AgendaChange;
  onClose: () => void;
  onSaved: () => void;
  context?: string;
  persistido?: boolean;
}

export default function AgendaImpactPanel({
  cambio,
  onClose,
  onSaved,
  context,
  persistido = false,
}: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const { user } = useAuth();

  const authorized = (
    cambio.tipo === 'cierre'
      ? ['SUPER_ADMIN', 'ADMIN_SALITA']
      : ['SUPER_ADMIN', 'ADMIN_SALITA', 'RECEPCION']
  ).includes(user?.rol ?? '');

  // Flujo guiado en 4 pasos:
  // 1: Identificación de turnos afectados
  // 2: Propuestas de reprogramación y alternativas
  // 3: Resumen y confirmación estructurada
  // 4: Resultado auditado y notificaciones
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [turnos, setTurnos] = useState<AffectedTurno[]>([]);
  const [propuestas, setPropuestas] = useState<AgendaProposal[]>([]);
  const [resultados, setResultados] = useState<
    (AgendaResult & { paciente: string; detalleTurno?: string })[]
  >([]);

  const [motivo, setMotivo] = useState(
    cambio.tipo === 'cierre'
      ? `Cierre institucional: ${cambio.datos.titulo}`
      : cambio.tipo === 'bloqueo'
      ? cambio.datos.motivo
      : 'Cambio de horario de atención.'
  );

  const [dias, setDias] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [revision, setRevision] = useState(0);

  const selected = useMemo(
    () => propuestas.filter((p) => p.destino),
    [propuestas]
  );

  useEffect(() => {
    panelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    if (!authorized) return;

    let active = true;
    setBusy(true);

    void getAgendaImpact(cambio)
      .then((data) => {
        if (!active) return;
        setTurnos(data.afectados);
      })
      .catch((cause) => {
        if (!active) return;
        setError(authError(cause));
      })
      .finally(() => {
        if (!active) return;
        setBusy(false);
      });

    return () => {
      active = false;
    };
  }, [cambio, authorized]);

  const refresh = async () => {
    const data = await getAgendaImpact(cambio);
    setTurnos(data.afectados);
    setPropuestas([]);
    setRevision((v) => v + 1);
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  const choose = (p: AgendaProposal) =>
    setPropuestas((values) => [
      ...values.filter((v) => v.id_turno !== p.id_turno),
      p,
    ]);

  if (!authorized) {
    return (
      <div className="alert alert-warning" role="alert">
        No tenés permisos para gestionar esta agenda.
      </div>
    );
  }

  const absence = cambio.tipo === 'bloqueo';
  const closure = cambio.tipo === 'cierre';
  const inactive = (absence || closure) && !cambio.datos.activo;

  const description = closure
    ? `${cambio.datos.titulo}: ${agendaDate(cambio.datos.fecha_inicio)} hasta ${agendaDate(cambio.datos.fecha_fin)} · ${
        cambio.datos.dia_completo
          ? 'Todo el día'
          : `${cambio.datos.hora_inicio} a ${cambio.datos.hora_fin} cada día`
      }`
    : absence
    ? `${agendaDate(cambio.datos.fecha)} · ${
        cambio.datos.dia_completo
          ? 'Todo el día'
          : `${cambio.datos.hora_inicio} a ${cambio.datos.hora_fin}`
      }`
    : 'Modificación del horario habitual';

  const executeFinalSave = async () => {
    // 1. Si hay turnos seleccionados para reprogramar, confirmarlos
    let confirmResults: (AgendaResult & { paciente: string; detalleTurno?: string })[] = [];
    if (selected.length > 0) {
      const data = await confirmAgendaProposal(cambio, motivo.trim(), selected);
      confirmResults = data.resultados.map((r) => {
        const t = turnos.find((turn) => turn.id_turno === r.id_turno);
        return {
          ...r,
          paciente: t
            ? `${t.paciente.persona.apellidos}, ${t.paciente.persona.nombres}`
            : 'Paciente',
          detalleTurno: t ? agendaDateTime(t.fecha_hora_inicio) : undefined,
        };
      });
    }

    // 2. Turnos que quedaron pendientes (sin destino asignado)
    const pendingResults = turnos
      .filter((t) => !selected.some((s) => s.id_turno === t.id_turno))
      .map((t) => ({
        id_turno: t.id_turno,
        confirmado: false,
        mensaje: 'Pendiente de reprogramación manual',
        paciente: `${t.paciente.persona.apellidos}, ${t.paciente.persona.nombres}`,
        detalleTurno: agendaDateTime(t.fecha_hora_inicio),
      }));

    setResultados([...confirmResults, ...pendingResults]);

    // 3. Guardar la configuración (bloqueo / horario / cierre) si no está persistido
    if (!persistido) {
      if (cambio.tipo === 'horario') {
        await guardarHorario(cambio.datos, cambio.id);
      } else if (cambio.tipo === 'cierre') {
        await guardarCierre(cambio.datos, cambio.id);
      } else {
        await guardarBloqueo(cambio.datos, cambio.id);
      }
    }

    setConfirming(false);
    setCurrentStep(4);
  };

  return (
    <section
      ref={panelRef}
      className="dashboard-panel p-4 mb-4 border shadow-sm"
      aria-label="Proceso de reprogramación de turnos afectados"
      aria-busy={busy}
    >
      {/* Stepper visual de 4 pasos */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2 className="h5 mb-0 text-saps fw-bold">
            <i className="bi bi-diagram-3 me-2" />
            Gestión y reprogramación de turnos
          </h2>
          <span className="badge text-bg-light border text-secondary">
            Paso {currentStep} de 4
          </span>
        </div>

        <div className="progress" style={{ height: '6px' }}>
          <div
            className="progress-bar bg-saps"
            role="progressbar"
            style={{ width: `${(currentStep / 4) * 100}%` }}
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
          />
        </div>

        <div className="d-none d-md-flex justify-content-between mt-2 small text-muted">
          <span className={currentStep === 1 ? 'fw-bold text-saps' : ''}>
            1. Turnos afectados
          </span>
          <span className={currentStep === 2 ? 'fw-bold text-saps' : ''}>
            2. Alternativas de reprogramación
          </span>
          <span className={currentStep === 3 ? 'fw-bold text-saps' : ''}>
            3. Revisión y confirmación
          </span>
          <span className={currentStep === 4 ? 'fw-bold text-saps' : ''}>
            4. Resultado y notificaciones
          </span>
        </div>
      </div>

      {/* Resumen contextual del cambio */}
      <div className="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 mb-3">
        <div>
          {context && <span className="fw-semibold me-2">{context}</span>}
          <span className="text-secondary">{description}</span>
          {absence && cambio.datos.motivo && (
            <span className="d-block small text-muted">
              Motivo interno: {cambio.datos.motivo}
            </span>
          )}
        </div>
        {inactive && (
          <span className="badge text-bg-secondary">
            Desactivación de regla
          </span>
        )}
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setError('')}
          />
        </div>
      )}

      {busy && (
        <div className="text-center py-4 text-muted" role="status">
          <div className="spinner-border text-saps mb-2" role="status" />
          <p className="mb-0">Procesando disponibilidad y agenda…</p>
        </div>
      )}

      {!busy && (
        <fieldset disabled={busy || confirming}>
          {/* ======================================================== */}
          {/* PASO 1: IDENTIFICACIÓN DE TURNOS AFECTADOS */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h6 mb-0 text-dark fw-bold">
                  Paso 1: Identificación de turnos afectados
                </h3>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => void run(refresh)}
                    title="Actualizar lista de turnos afectados"
                  >
                    <i className="bi bi-arrow-clockwise" />
                    <span>Actualizar</span>
                  </button>
                  <span className={`badge ${turnos.length ? 'text-bg-warning' : 'text-bg-success'} fs-6`}>
                    {turnos.length} turno{turnos.length === 1 ? '' : 's'} afectado{turnos.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {turnos.length === 0 ? (
                <div className="card text-center p-4 my-3 bg-light border-0">
                  <div className="mb-2">
                    <i className="bi bi-check-circle-fill text-success fs-1" />
                  </div>
                  <h4 className="h5 text-success">
                    No se encontraron turnos afectados
                  </h4>
                  <p className="text-muted small mb-3">
                    Ningún paciente tiene turnos programados que coincidan con esta salita, profesional y franja horaria.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={onClose}
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      className="btn btn-saps"
                      onClick={() => void run(executeFinalSave)}
                    >
                      {inactive
                        ? 'Confirmar desactivación'
                        : 'Confirmar y guardar ausencia'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="small text-muted mb-3">
                    Los siguientes turnos coinciden con la ausencia indicada y deberán ser reprogramados o quedarán pendientes para gestión manual.
                  </p>

                  <div className="table-responsive border rounded mb-3">
                    <table className="table saps-responsive-table align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th scope="col">Paciente</th>
                          <th scope="col">DNI</th>
                          <th scope="col">Horario original</th>
                          <th scope="col">Especialidad</th>
                          <th scope="col">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {turnos.map((t) => (
                          <tr key={t.id_turno}>
                            <td data-label="Paciente">
                              <strong>
                                {t.paciente.persona.apellidos}, {t.paciente.persona.nombres}
                              </strong>
                            </td>
                            <td data-label="DNI">
                              <span className="small">
                                {t.paciente.persona.dni ? `DNI: ${t.paciente.persona.dni}` : 'Sin DNI'}
                              </span>
                            </td>
                            <td data-label="Horario original">
                              <span className="fw-semibold text-danger">
                                {agendaDateTime(t.fecha_hora_inicio)}
                              </span>
                            </td>
                            <td data-label="Especialidad">
                              <span className="small">
                                {t.especialidad.nombre}
                              </span>
                            </td>
                            <td data-label="Estado">
                              <span className="badge text-bg-light border">
                                {t.estado.nombre}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={onClose}
                    >
                      Cancelar y volver al formulario
                    </button>
                    <button
                      type="button"
                      className="btn btn-saps d-inline-flex align-items-center gap-2"
                      onClick={() => setCurrentStep(2)}
                    >
                      <span>Continuar a propuestas de reprogramación</span>
                      <i className="bi bi-arrow-right" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 2: PROPUESTAS Y ALTERNATIVAS DE REPROGRAMACIÓN */}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h6 mb-0 text-dark fw-bold">
                  Paso 2: Alternativas de reprogramación
                </h3>
                <div className="d-flex gap-2">
                  <span className="badge text-bg-success">
                    {selected.length} con nuevo horario
                  </span>
                  <span className="badge text-bg-warning text-dark">
                    {turnos.length - selected.length} pendientes
                  </span>
                </div>
              </div>

              <div className="card p-3 mb-3 bg-light-subtle border">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <strong className="d-block">Sugerir horarios automáticamente</strong>
                    <span className="small text-muted">
                      Busca los próximos turnos disponibles para los pacientes sin horario asignado.
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <select
                      className="form-select form-select-sm"
                      style={{ width: 'auto' }}
                      value={dias}
                      onChange={(e) => setDias(Number(e.target.value))}
                    >
                      {[7, 14, 30, 60, 90].map((d) => (
                        <option key={d} value={d}>
                          Próximos {d} días
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-outline-saps btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() =>
                        void run(async () => {
                          const data = await getAgendaProposal(cambio, dias);
                          setPropuestas((old) => [
                            ...old.filter((p) => p.destino),
                            ...data.propuestas.filter(
                              (p) =>
                                !old.some(
                                  (v) => v.id_turno === p.id_turno && v.destino
                                )
                            ),
                          ]);
                        })
                      }
                    >
                      <i className="bi bi-magic" />
                      <span>Sugerir</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="small text-muted mb-2">
                Elegí la nueva fecha y horario para cada paciente. Los turnos que queden sin horario continuarán pendientes de gestión manual:
              </p>

              <AgendaAffectedList
                cambio={cambio}
                turnos={turnos}
                propuestas={propuestas}
                busy={busy || confirming}
                revision={revision}
                onChoose={choose}
              />

              <div className="mt-4 p-3 border rounded bg-white">
                <label className="form-label fw-semibold" htmlFor="motivo-reprogramacion">
                  Motivo interno de la reprogramación (para auditoría)
                </label>
                <textarea
                  id="motivo-reprogramacion"
                  className="form-control"
                  rows={2}
                  maxLength={500}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Detalle el motivo institucional de la reprogramación..."
                />
                <span className="form-text small text-muted">
                  Quedará registrado en la auditoría del turno.
                </span>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => setCurrentStep(1)}
                >
                  <i className="bi bi-arrow-left" />
                  <span>Volver a turnos afectados</span>
                </button>
                <button
                  type="button"
                  className="btn btn-saps d-inline-flex align-items-center gap-2"
                  onClick={() => setCurrentStep(3)}
                >
                  <span>Continuar a revisión final ({selected.length} listos)</span>
                  <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 3: CONFIRMACIÓN ESTRUCTURADA */}
          {/* ======================================================== */}
          {currentStep === 3 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="h6 mb-0 text-dark fw-bold">
                  Paso 3: Revisión y confirmación estructurada
                </h3>
                <span className="badge text-bg-primary fs-6">
                  Listo para confirmar
                </span>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-light h-100">
                    <span className="text-muted small d-block mb-1">Total de afectados</span>
                    <strong className="fs-3 text-dark">{turnos.length}</strong>
                    <span className="small text-muted d-block mt-1">turnos en la ventana de ausencia</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-success-subtle border-success-subtle h-100">
                    <span className="text-success small d-block mb-1">A reprogramar inmediatamente</span>
                    <strong className="fs-3 text-success">{selected.length}</strong>
                    <span className="small text-success d-block mt-1">con nuevo horario asignado</span>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-warning-subtle border-warning-subtle h-100">
                    <span className="text-warning-emphasis small d-block mb-1">Quedarán pendientes</span>
                    <strong className="fs-3 text-warning-emphasis">
                      {turnos.length - selected.length}
                    </strong>
                    <span className="small text-warning-emphasis d-block mt-1">para gestión administrativa manual</span>
                  </div>
                </div>
              </div>

              <div className="card mb-4 border">
                <div className="card-header bg-light">
                  <strong className="small">Detalle de turnos a procesar</strong>
                </div>
                <div className="card-body p-0">
                  <div className="p-3">
                    <AgendaReview turnos={turnos} propuestas={selected} />
                  </div>
                </div>
              </div>

              <div className="alert alert-info d-flex align-items-center gap-2 mb-4">
                <i className="bi bi-bell-fill fs-5" />
                <span className="small">
                  Al confirmar, los turnos reprogramados actualizarán su horario en la base de datos y se generarán las notificaciones correspondientes a los pacientes a través de sus canales habilitados.
                </span>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => setCurrentStep(2)}
                >
                  <i className="bi bi-arrow-left" />
                  <span>Modificar propuestas</span>
                </button>
                <button
                  type="button"
                  className="btn btn-success d-inline-flex align-items-center gap-2 px-4 py-2"
                  onClick={() => setConfirming(true)}
                >
                  <i className="bi bi-check2-circle" />
                  <span>Confirmar y aplicar cambios</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* PASO 4: RESULTADO AUDITADO */}
          {/* ======================================================== */}
          {currentStep === 4 && (
            <div>
              <div className="text-center py-3 mb-4">
                <div className="mb-2">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }} />
                </div>
                <h3 className="h4 text-success fw-bold">
                  Proceso completado exitosamente
                </h3>
                <p className="text-muted">
                  La ausencia fue registrada en el calendario y se procesó el circuito de reprogramaciones.
                </p>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-sm-6">
                  <div className="p-3 border rounded text-center bg-light">
                    <strong className="fs-3 text-success">
                      {resultados.filter((r) => r.confirmado).length}
                    </strong>
                    <span className="d-block small text-muted">
                      Turnos reprogramados con nuevo horario
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 border rounded text-center bg-light">
                    <strong className="fs-3 text-warning-emphasis">
                      {resultados.filter((r) => !r.confirmado).length}
                    </strong>
                    <span className="d-block small text-muted">
                      Turnos pendientes de asignación manual
                    </span>
                  </div>
                </div>
              </div>

              <div className="card mb-4 border">
                <div className="card-header bg-light">
                  <strong className="small">Resultado individual por paciente</strong>
                </div>
                <div className="table-responsive">
                  <table className="table saps-responsive-table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col">Paciente</th>
                        <th scope="col">Turno original</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultados.map((r) => (
                        <tr key={r.id_turno}>
                          <td data-label="Paciente">
                            <strong>{r.paciente}</strong>
                          </td>
                          <td data-label="Turno original">
                            <span className="small text-muted">
                              {r.detalleTurno ?? '–'}
                            </span>
                          </td>
                          <td data-label="Estado">
                            <span
                              className={`badge ${
                                r.confirmado ? 'text-bg-success' : 'text-bg-warning text-dark'
                              }`}
                            >
                              {r.confirmado ? 'Reprogramado' : 'Pendiente'}
                            </span>
                          </td>
                          <td data-label="Detalle">
                            <span className="small">{r.mensaje}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-saps px-4 py-2"
                  onClick={onSaved}
                >
                  Finalizar y volver a Ausencias
                </button>
              </div>
            </div>
          )}
        </fieldset>
      )}

      {/* Confirmation Modal para ejecutar el cambio */}
      <ConfirmationModal
        open={confirming}
        title="Confirmar cambios y reprogramaciones"
        confirmText="Confirmar y aplicar"
        variant="primary"
        loading={busy}
        message={`Se reprogramarán ${selected.length} turnos y se registrará la ausencia en la agenda.`}
        detail={
          <div>
            <p className="mb-2">
              <strong>Alcance:</strong> {context}
            </p>
            <p className="mb-2">
              <strong>Período:</strong> {description}
            </p>
            <p className="mb-2">
              <strong>Turnos que se reprograman:</strong> {selected.length}
            </p>
            <p className="mb-0">
              <strong>Turnos que quedan pendientes:</strong>{' '}
              {turnos.length - selected.length}
            </p>
          </div>
        }
        notice="Esta acción modificará los turnos y bloqueará las nuevas reservas en la fecha y franja horaria seleccionadas."
        onClose={() => {
          if (!busy) setConfirming(false);
        }}
        onConfirm={() => void run(executeFinalSave)}
      />
    </section>
  );
}
