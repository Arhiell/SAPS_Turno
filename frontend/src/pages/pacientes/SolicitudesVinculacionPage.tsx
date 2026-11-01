import { useEffect, useState } from 'react';
import { authError } from '../../utils/auth-errors';
import {
  getAdminTutorRequests,
  resolveTutorRequest,
  type TutorRequest,
} from '../../services/tutor-requests.service';

const directionText = (request: TutorRequest) => request.direccion === 'GESTIONAR_A_OTRO'
  ? 'Solicita gestionar los turnos de otra persona'
  : 'Solicita que otra persona gestione sus turnos';

const ageLabel = (birth: string | null | undefined) => {
  if (!birth) return 'Edad no registrada';
  const date = new Date(`${birth}T12:00:00`);
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  if (today.getMonth() < date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age -= 1;
  return age < 18 ? 'Menor de edad' : 'Adulto';
};

export default function SolicitudesVinculacionPage() {
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verification, setVerification] = useState<{
    requestId: string;
    identity: boolean;
    documents: boolean;
    authorization: boolean;
  } | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSuccess('');
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    let active = true;
    void getAdminTutorRequests()
      .then(rows => {
        if (active) {
          setRequests(rows);
          setError('');
        }
      })
      .catch(cause => { if (active) setError(authError(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const resolve = async (request: TutorRequest, approve: boolean) => {
    const reason = approve ? '' : window.prompt('Indicá el motivo del rechazo:')?.trim() ?? '';
    if (!approve && reason.length < 3) {
      setError('Para rechazar, ingresá un motivo de al menos 3 caracteres.');
      return;
    }
    setBusy(request.id_solicitud);
    setError('');
    setSuccess('');
    try {
      await resolveTutorRequest(request.id_solicitud, approve
        ? {
            accion: 'APROBAR',
            identidad_verificada: true,
            documentacion_verificada: true,
            autorizacion_verificada: true,
          }
        : { accion: 'RECHAZAR', motivo_rechazo: reason });
      setSuccess(approve ? 'Vinculación aprobada. La gestión de turnos ya está habilitada.' : 'Solicitud rechazada.');
      setLoading(true);
      setRevision(value => value + 1);
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setBusy('');
      setVerification(null);
    }
  };

  return <section>
    <h1 className="h3">Solicitudes de vinculación</h1>
    <p className="text-muted">Verificá presencialmente la identidad y la documentación. Si el paciente titular es adulto, confirmá su consentimiento expreso; para un menor, verificá la representación de su padre, madre o tutor. Una solicitud pendiente no permite gestionar turnos.</p>
    <div className="d-flex flex-wrap gap-2 mb-3">
      <button className="btn btn-outline-success" disabled={loading} onClick={() => {
        setLoading(true);
        setRevision(value => value + 1);
      }}>Actualizar lista</button>
    </div>
    {error && <div className="alert alert-danger" role="alert">{error}</div>}
    {success && <div className="alert alert-success" role="status">{success}</div>}
    {loading ? <p role="status">Cargando solicitudes…</p> : requests.length === 0
      ? <p>No hay solicitudes para las salitas que administrás.</p>
      : <div className="table-responsive">
        <table className="table table-striped align-middle">
          <thead><tr><th>Solicitante</th><th>Solicitud</th><th>Paciente relacionado</th><th>DNI de la otra persona</th><th>Vínculo declarado</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
          <tbody>{requests.map(request => <tr key={request.id_solicitud}>
            <td>{request.solicitante?.persona
              ? `${request.solicitante.persona.apellidos}, ${request.solicitante.persona.nombres} · DNI ${request.solicitante.persona.dni} · ${ageLabel(request.solicitante.persona.fecha_nacimiento)}`
              : 'Solicitante; identidad a verificar presencialmente'}</td>
            <td>{directionText(request)}</td>
            <td>{request.direccion === 'DELEGAR_MI_GESTION' && request.solicitante?.persona
              ? `${request.solicitante.persona.apellidos}, ${request.solicitante.persona.nombres} · DNI ${request.solicitante.persona.dni} · ${ageLabel(request.solicitante.persona.fecha_nacimiento)}`
              : request.paciente_asociado
                ? `${request.paciente_asociado.apellidos}, ${request.paciente_asociado.nombres} · DNI ${request.paciente_asociado.dni} · ${ageLabel(request.paciente_asociado.fecha_nacimiento)}`
                : 'No registrado; crear ficha en la salita antes de aprobar'}</td>
            <td>{request.dni_persona_destino}</td>
            <td>{request.parentesco}</td>
            <td>{request.estado}{request.motivo_rechazo && <div className="small text-muted">{request.motivo_rechazo}</div>}
              {request.resolutor?.nombre_usuario && <div className="small text-muted">Por {request.resolutor.persona
                ? `${request.resolutor.persona.apellidos}, ${request.resolutor.persona.nombres}`
                : request.resolutor.nombre_usuario}</div>}
            </td>
            <td>{new Date(request.fecha_creacion).toLocaleDateString('es-AR')}</td>
            <td>{request.estado === 'PENDIENTE' ? <div className="d-flex flex-column align-items-start gap-2">
              {verification?.requestId === request.id_solicitud ? <>
                <div className="small">
                  <div className="form-check"><input id={`verify-identity-${request.id_solicitud}`} className="form-check-input" type="checkbox" checked={verification.identity}
                    onChange={event => setVerification({ ...verification, identity: event.target.checked })} />
                    <label className="form-check-label" htmlFor={`verify-identity-${request.id_solicitud}`}>Identidad de ambas personas</label></div>
                  <div className="form-check"><input id={`verify-documents-${request.id_solicitud}`} className="form-check-input" type="checkbox" checked={verification.documents}
                    onChange={event => setVerification({ ...verification, documents: event.target.checked })} />
                    <label className="form-check-label" htmlFor={`verify-documents-${request.id_solicitud}`}>Documentación del vínculo</label></div>
                  <div className="form-check"><input id={`verify-authorization-${request.id_solicitud}`} className="form-check-input" type="checkbox" checked={verification.authorization}
                    onChange={event => setVerification({ ...verification, authorization: event.target.checked })} />
                    <label className="form-check-label" htmlFor={`verify-authorization-${request.id_solicitud}`}>Consentimiento del paciente adulto o autorización de su representante legal si es menor</label></div>
                </div>
                <button className="btn btn-sm btn-success" disabled={!!busy || !verification.identity || !verification.documents || !verification.authorization}
                  onClick={() => void resolve(request, true)}>Confirmar aprobación</button>
                <button className="btn btn-sm btn-outline-secondary" disabled={!!busy} onClick={() => setVerification(null)}>Cancelar</button>
              </> : <button className="btn btn-sm btn-success" disabled={!!busy} onClick={() => setVerification({
                requestId: request.id_solicitud, identity: false, documents: false, authorization: false,
              })}>Aprobar</button>}
              <button className="btn btn-sm btn-outline-danger" disabled={!!busy} onClick={() => void resolve(request, false)}>Rechazar</button>
            </div> : request.fecha_resolucion ? new Date(request.fecha_resolucion).toLocaleString('es-AR') : '—'}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </section>;
}
