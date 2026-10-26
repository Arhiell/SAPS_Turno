import { Link } from 'react-router-dom';
import useManagedPatients from '../../context/useManagedPatients';

export default function PersonasACargoPage() {
  const { items, loading, error, retry } = useManagedPatients();
  return <section>
    <h1 className="h3">Personas a cargo</h1>
    <p className="text-muted">Gestioná los turnos de tus hijos, padres, abuelos u otras personas con un vínculo autorizado.</p>
    <div className="patient-section mb-3">
      <h2 className="h5">Agregar una persona a cargo</h2>
      <p>Solicitá en la salita el registro del paciente y la vinculación con tu DNI como tutor o responsable.
        Administración verifica el vínculo y habilita el permiso para gestionar turnos. Si ya está registrado, se reutiliza su ficha.</p>
      <p className="mb-0">Cada persona puede tener un turno pendiente por especialidad. Los turnos de una persona no consumen los de las demás; cada reserva necesita su propio horario disponible.</p>
    </div>
    <button className="btn btn-outline-success mb-3" disabled={loading} onClick={retry}>Actualizar vínculos</button>
    {loading && <p role="status">Cargando personas a cargo…</p>}
    {error && <p className="alert alert-danger" role="alert">{error}</p>}
    {!loading && !error && !items.length && <p>No tenés personas a cargo habilitadas para gestionar turnos.</p>}
    <div className="row g-3">{items.map(person => <div key={person.id_paciente} className="col-12 col-md-6">
      <article className="patient-section h-100">
        <h2 className="h5">{person.apellidos}, {person.nombres}</h2>
        <p>DNI: {person.dni} · Vínculo: {person.parentesco}</p>
        {person.fecha_hasta && <p>Autorización hasta: {person.fecha_hasta.split('-').reverse().join('/')}</p>}
        <div className="d-flex flex-wrap gap-2">
          <Link className="btn btn-saps" to={`/solicitar-turno?paciente=${person.id_paciente}`}>Solicitar turno</Link>
          <Link className="btn btn-outline-success" to={`/mis-turnos?paciente=${person.id_paciente}`}>Ver turnos</Link>
        </div>
      </article>
    </div>)}</div>
  </section>;
}
