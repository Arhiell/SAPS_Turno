import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import AgendaAffectedList from './AgendaAffectedList';
import AgendaReview from './AgendaReview';
import { getAgendaImpact, getAgendaProposal, confirmAgendaProposal,
  type AgendaChange, type AffectedTurno, type AgendaProposal, type AgendaResult } from '../../services/agenda-impacto.service';
import { guardarHorario, guardarBloqueo } from '../../services/configuracion.service';
import { authError } from '../../utils/auth-errors';
import { agendaDate } from '../../utils/agenda-display';

interface Props { cambio: AgendaChange; onClose: () => void; onSaved: () => void; context?: string }
export default function AgendaImpactPanel({ cambio, onClose, onSaved, context }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const authorized = ['SUPER_ADMIN', 'ADMIN_SALITA', 'RECEPCION'].includes(user?.rol ?? '');
  const [turnos, setTurnos] = useState<AffectedTurno[]>([]);
  const [propuestas, setPropuestas] = useState<AgendaProposal[]>([]);
  const [resultados, setResultados] = useState<(AgendaResult & { paciente: string })[]>([]);
  const [motivo, setMotivo] = useState(cambio.tipo === 'bloqueo' ? cambio.datos.motivo : 'Cambio de horario de atención.');
  const [dias, setDias] = useState(30);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const selected = propuestas.filter(p => p.destino);
  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!authorized) return;
    let active = true;
    setBusy(true);
    void getAgendaImpact(cambio)
      .then(data => { if (active) { setTurnos(data.afectados); setReady(true); } })
      .catch(cause => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [cambio, authorized]);
  const refresh = async () => {
    setReady(false);
    const data = await getAgendaImpact(cambio);
    setTurnos(data.afectados); setPropuestas([]); setReady(true); setRevision(v => v + 1);
  };
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); } catch (cause) { setError(authError(cause)); }
    finally { setBusy(false); }
  };
  const choose = (p: AgendaProposal) => setPropuestas(values => [...values.filter(v => v.id_turno !== p.id_turno), p]);
  if (!authorized) return <div className="alert alert-warning">No tenés permisos para gestionar esta agenda.</div>;
  const absence = cambio.tipo === 'bloqueo';
  const inactive = absence && !cambio.datos.activo;
  const description = absence
    ? `${agendaDate(cambio.datos.fecha)} · ${cambio.datos.dia_completo ? 'Todo el día' : `${cambio.datos.hora_inicio} a ${cambio.datos.hora_fin}`}`
    : 'Modificación del horario habitual';
  return <section ref={panelRef} className="dashboard-panel p-3 mb-4" aria-label="Reprogramación de turnos afectados" aria-busy={busy}>
    <h2 className="h5">{inactive ? 'Desactivar ausencia o cierre' : absence ? 'Reprogramación por ausencia o cierre' : 'Reprogramación por cambio de horario'}</h2>
    {context && <p className="fw-semibold mb-1 text-break">{context}</p>}
    <p className="mb-1">{description}</p>
    {absence && <p className="text-break">Motivo interno: {cambio.datos.motivo}</p>}
    {inactive ? <p>El bloqueo quedará inactivo. Los turnos reprogramados anteriormente no vuelven a su fecha original.</p> : <p>1. Elegí nuevos horarios. 2. Revisá y confirmá los turnos. 3. Guardá {absence ? 'la ausencia' : 'el cambio de horario'}.</p>}
    <p className="small text-muted">El cambio de agenda todavía no está guardado. Se conservan profesional, especialidad y salita. Elegir horarios no reserva lugares.</p>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {busy && <p role="status"><span className="spinner-border spinner-border-sm me-2" />Procesando agenda…</p>}
    {ready && <p className="fw-semibold">{turnos.length} afectados · {selected.length} listos para revisar · {turnos.length - selected.length} sin nuevo horario</p>}
    {!!resultados.length && <div className="alert alert-info" role="status">
      <strong>Resultado de la última confirmación</strong>
      {resultados.map(r => <div key={r.id_turno} className="text-break">
        <span className={`badge me-2 ${r.confirmado ? 'text-bg-success' : 'text-bg-warning'}`}>{r.confirmado ? 'Reprogramado' : 'Pendiente'}</span>
        {r.paciente}: {r.mensaje}
      </div>)}
    </div>}
    <fieldset disabled={busy || confirming || saving}>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <button type="button" className="btn btn-outline-secondary" onClick={() => void run(refresh)}>Actualizar afectados y limpiar selección</button>
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Volver al formulario</button>
      </div>
      {ready && !!turnos.length && <>
        <p>Elegí la nueva fecha de cada paciente y después uno de los horarios disponibles. Los pacientes sin horario quedarán pendientes.</p>
        <AgendaAffectedList cambio={cambio} turnos={turnos} propuestas={propuestas} busy={busy || confirming} revision={revision} onChoose={choose} />
        <details className="border rounded p-3 my-3">
          <summary>Ayuda opcional: sugerir horarios</summary>
          <p className="small mt-2">Busca horarios posteriores. Completa solamente pacientes que todavía no tienen una elección.</p>
          <label className="form-label">Período de búsqueda
            <select className="form-select" value={dias} onChange={e => setDias(Number(e.target.value))}>
              {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} días</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => void run(async () => {
            const data = await getAgendaProposal(cambio, dias);
            setPropuestas(old => [...old.filter(p => p.destino), ...data.propuestas.filter(p => !old.some(v => v.id_turno === p.id_turno && v.destino))]);
          })}>Sugerir horarios</button>
        </details>
        <label className="form-label w-100">Motivo interno de reprogramación (no se envía al paciente)
          <textarea className="form-control" rows={2} maxLength={500} value={motivo} onChange={e => setMotivo(e.target.value)} />
        </label>
        <button type="button" className="btn btn-saps" disabled={!selected.length || selected.length > 100 || motivo.trim().length < 3} onClick={() => setConfirming(true)}>
          Revisar {selected.length} reprogramaciones
        </button>
        {selected.length > 100 && <p role="alert">Confirmá hasta 100 turnos por vez; dejá el resto pendiente.</p>}
      </>}
      {ready && !turnos.length && <div className="alert alert-success">
        <p>No quedan turnos afectados. Falta confirmar el cambio de agenda.</p>
        <button type="button" className="btn btn-saps" onClick={() => setSaving(true)}>{inactive ? 'Revisar desactivación' : absence ? 'Revisar y guardar ausencia / cierre' : 'Revisar y guardar horario'}</button>
      </div>}
    </fieldset>
    <ConfirmationModal open={confirming} title="Revisar reprogramaciones" confirmText="Confirmar reprogramaciones" loading={busy}
      message={`Se intentarán reprogramar ${selected.length} turnos. Se enviarán avisos por los canales disponibles del paciente.`}
      detail={<>{error && <p className="text-danger" role="alert">{error}</p>}<AgendaReview turnos={turnos} propuestas={selected} /></>}
      notice="El servidor vuelve a comprobar cada horario y cupo. Si alguno dejó de estar disponible, queda pendiente; los confirmados se conservan. Después debés guardar la ausencia o el cambio de horario."
      onClose={() => { if (!busy) setConfirming(false); }}
      onConfirm={() => void run(async () => {
        const data = await confirmAgendaProposal(cambio, motivo.trim(), selected);
        setResultados(data.resultados.map(r => {
          const t = turnos.find(t => t.id_turno === r.id_turno);
          return { ...r, paciente: t ? `${t.paciente.persona.apellidos}, ${t.paciente.persona.nombres}` : 'Paciente' };
        }));
        setConfirming(false); setPropuestas([]);
        await refresh();
      })} />
    <ConfirmationModal open={saving} title="Confirmar cambio de agenda" confirmText="Guardar cambio" loading={busy}
      message={description} detail={<>{error && <p className="text-danger" role="alert">{error}</p>}<p>{context}</p><p>{inactive ? 'El bloqueo quedará inactivo.' : absence ? cambio.datos.motivo : 'Se actualizará el horario habitual.'}</p></>}
      notice="Esta acción guarda la configuración. Los turnos ya reprogramados conservan sus cambios."
      onClose={() => { if (!busy) setSaving(false); }}
      onConfirm={() => void run(async () => {
        if (cambio.tipo === 'horario') await guardarHorario(cambio.datos, cambio.id);
        else await guardarBloqueo(cambio.datos, cambio.id);
        onSaved();
      })} />
  </section>;
}
