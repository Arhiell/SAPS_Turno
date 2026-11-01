import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import useManagedPatients from '../../context/useManagedPatients';
import { useAuth } from '../../context/AuthContext';
import {
  createTutorRequest,
  getOwnPatientTutors,
  getOwnTutorRequests,
  type PatientTutor,
  type TutorRequest,
  type TutorRequestDirection,
} from '../../services/tutor-requests.service';
import { authError } from '../../utils/auth-errors';

export default function PersonasACargoPage() {
  const { items, loading, error, retry } = useManagedPatients();
  const { patient: titular } = useAuth();
  const [requests, setRequests] = useState<TutorRequest[]>([]);
  const [responsibles, setResponsibles] = useState<PatientTutor[]>([]);
  const [direction, setDirection] = useState<TutorRequestDirection>('GESTIONAR_A_OTRO');
  const [dni, setDni] = useState('');
  const [parentesco, setParentesco] = useState('');
  const [requestLoading, setRequestLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [success, setSuccess] = useState('');
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
    void Promise.all([getOwnTutorRequests(), getOwnPatientTutors()])
      .then(([rows, links]) => {
        if (active) {
          setRequests(rows);
          setResponsibles(links);
          setRequestError('');
        }
      })
      .catch(cause => { if (active) setRequestError(authError(cause)); })
      .finally(() => { if (active) setRequestLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const refresh = () => {
    retry();
    setRequestLoading(true);
    setRevision(value => value + 1);
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setRequestError('');
    setSuccess('');
    try {
      await createTutorRequest({
        direccion: direction,
        dni_persona_destino: dni.replace(/\D/g, ''),
        parentesco,
      });
      setDni('');
      setParentesco('');
      setSuccess('Solicitud enviada. La vinculación quedará pendiente hasta que la salita verifique la documentación y la apruebe.');
      setRequestLoading(true);
      setRevision(value => value + 1);
    } catch (cause) {
      setRequestError(authError(cause));
    } finally {
      setBusy(false);
    }
  };

  const ageInYears = (birth: string | null) => {
    if (!birth) return null;
    const date = new Date(`${birth}T12:00:00`);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    if (today.getMonth() < date.getMonth() ||
      (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) age -= 1;
    return age;
  };

  return (
    <section>
      <h1 className="h3">Personas a cargo</h1>
      <p className="text-muted">Consultá las personas que podés gestionar y el estado de tus solicitudes de autorización.</p>

      <div className="patient-section mb-3">
        <h2 className="h5">Solicitar una vinculación</h2>
        <p>La solicitud no habilita el acceso ni permite reservar turnos. La persona titular y quien solicita gestionar deben presentar sus DNI y la documentación que acredite la representación o autorización en la salita. Administración verificará la identidad y aprobará o rechazará el pedido.</p>
        <p>Si la persona todavía no está registrada como paciente, deberá registrarse en la salita con sus propios datos y cobertura. No ingreses datos de salud ni documentos por este formulario.</p>
        <form onSubmit={submitRequest}>
          <fieldset disabled={busy}>
            <label className="form-label w-100">¿Qué autorización solicitás?
              <select className="form-select mt-1" value={direction} onChange={event => setDirection(event.target.value as TutorRequestDirection)}>
                <option value="GESTIONAR_A_OTRO">Quiero gestionar los turnos de otra persona</option>
                <option value="DELEGAR_MI_GESTION">Quiero autorizar a otra persona para que gestione mis turnos</option>
              </select>
            </label>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label w-100" htmlFor="vinculacion-dni">
                  DNI de {direction === 'GESTIONAR_A_OTRO' ? 'la persona a cargo' : 'la persona que autorizás'}
                  <input id="vinculacion-dni" className="form-control mt-1" inputMode="numeric" autoComplete="off"
                    minLength={7} maxLength={15} pattern="[0-9. -]{7,20}" required value={dni}
                    onChange={event => setDni(event.target.value)} />
                </label>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label w-100" htmlFor="vinculacion-relacion">Tipo de vínculo o autorización
                  <input id="vinculacion-relacion" className="form-control mt-1" placeholder="Madre, padre, tutor/a, persona autorizada…" required maxLength={50}
                    value={parentesco} onChange={event => setParentesco(event.target.value)} />
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn-saps mt-2" disabled={busy}>
              {busy ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </fieldset>
        </form>
        {requestError && <p className="alert alert-danger mt-3 mb-0" role="alert">{requestError}</p>}
        {success && <p className="alert alert-success mt-3 mb-0" role="status">{success}</p>}
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button className="btn btn-outline-success" disabled={loading || requestLoading} onClick={refresh}>Actualizar lista</button>
      </div>

      {loading && <p role="status">Cargando personas a cargo…</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && !items.length && <p>No tenés personas a cargo habilitadas para gestionar turnos. Las solicitudes pendientes se muestran abajo.</p>}

      <div className="row g-3">
        {items.map((person) => {
          const age = ageInYears(person.fecha_nacimiento);
          return (
          <div key={person.id_paciente} className="col-12 col-md-6">
            <article className="person-card h-100">
              <div className="person-card-header">
                <div>
                  <span className="patient-selector-kicker">
                    Persona a cargo de {titular ? `${titular.apellidos}, ${titular.nombres}` : 'tu cuenta titular'}
                  </span>
                  <h2 className="h5 mb-0">{person.apellidos}, {person.nombres}</h2>
                </div>
                <span className="person-card-badge">{person.parentesco}</span>
              </div>

              <div className="person-card-info">
                <div><span>DNI</span><strong>{person.dni}</strong></div>
                <div><span>Paciente atendido</span><strong>{age === null ? 'Edad no registrada' : age < 18 ? 'Menor de edad' : 'Adulto'}</strong></div>
                <div><span>Autorización</span><strong>Activa · Solicitar, consultar y cancelar turnos</strong></div>
                {person.fecha_hasta && (
                  <div><span>Autorización hasta</span><strong>{person.fecha_hasta.split('-').reverse().join('/')}</strong></div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Link className="btn btn-saps" to={`/solicitar-turno?paciente=${person.id_paciente}`}>Solicitar turno</Link>
                <Link className="btn btn-outline-success" to={`/mis-turnos?paciente=${person.id_paciente}`}>Ver turnos</Link>
              </div>
            </article>
          </div>
          );
        })}
      </div>

      <div className="mt-4">
        <h2 className="h5">Personas autorizadas sobre tu perfil titular</h2>
        {requestLoading ? <p role="status">Cargando autorizaciones…</p> : responsibles.length === 0
          ? <p>No hay personas autorizadas para gestionar tus turnos.</p>
          : <ul className="list-group mb-4">{responsibles.map(tutor => {
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
            const active = tutor.puede_gestionar_turnos && tutor.fecha_desde <= today &&
              (!tutor.fecha_hasta || tutor.fecha_hasta >= today);
            const status = !tutor.puede_gestionar_turnos ? 'Revocada' :
              tutor.fecha_hasta && tutor.fecha_hasta < today ? 'Vencida' :
                tutor.fecha_desde > today ? 'Programada' : 'Activa';
            return <li key={tutor.id_tutor} className="list-group-item">
              <strong>{tutor.apellidos}, {tutor.nombres}</strong>
              <div className="small">DNI {tutor.dni} · {tutor.parentesco} · {status}
                {active ? ' · Puede solicitar, consultar y cancelar turnos' : ''}
              </div>
              {tutor.fecha_modificacion && <div className="small text-muted">
                Última modificación: {new Date(tutor.fecha_modificacion).toLocaleString('es-AR')}
                {tutor.modificado_por?.nombre_usuario ? ` · ${tutor.modificado_por.nombre_usuario}` : ''}
              </div>}
            </li>;
          })}</ul>}

        <h2 className="h5">Estado de tus solicitudes</h2>
        {requestLoading ? <p role="status">Cargando solicitudes…</p> : requests.length === 0
          ? <p>No tenés solicitudes registradas.</p>
          : <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead><tr><th>Tipo de solicitud</th><th>DNI</th><th>Vínculo declarado</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>{requests.map(request => <tr key={request.id_solicitud}>
                <td>{request.direccion === 'GESTIONAR_A_OTRO' ? 'Gestionar a otra persona' : 'Delegar mis turnos'}</td>
                <td>{request.dni_persona_destino}</td>
                <td>{request.parentesco}</td>
                <td>{request.estado === 'PENDIENTE' ? 'Pendiente de revisión' : request.estado === 'APROBADA' ? 'Aprobada' : 'Rechazada'}
                  {request.motivo_rechazo && <div className="small text-muted">Motivo: {request.motivo_rechazo}</div>}
                </td>
                <td>{new Date(request.fecha_creacion).toLocaleDateString('es-AR')}</td>
              </tr>)}</tbody>
            </table>
          </div>}
      </div>
    </section>
  );
}
