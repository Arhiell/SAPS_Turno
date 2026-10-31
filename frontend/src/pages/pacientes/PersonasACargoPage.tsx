import { Link } from 'react-router-dom';
import useManagedPatients from '../../context/useManagedPatients';

export default function PersonasACargoPage() {
  const { items, loading, error, retry } = useManagedPatients();

  return (
    <section>
      <h1 className="h3">Personas a cargo</h1>
      <p className="text-muted">Gestioná los turnos de tus hijos, padres, abuelos u otras personas con un vínculo autorizado.</p>

      <div className="patient-section mb-3">
        <h2 className="h5">Agregar una persona a cargo</h2>
        <p>La persona a cargo no necesita correo ni cuenta: puede ser un menor o un adulto que delega sus turnos. Ingresás y gestionás desde tu propia cuenta.</p>
        <p>Solicitá en la salita el registro del paciente y la vinculación con tu DNI como tutor o responsable. Administración verifica el vínculo y habilita el permiso para gestionar turnos.</p>
        <p className="mb-0">Cada persona puede tener un turno pendiente por especialidad. Los turnos de una persona no consumen los de las demás; cada reserva necesita su propio horario disponible.</p>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <button className="btn btn-outline-success" disabled={loading} onClick={retry}>Actualizar vínculos</button>
      </div>

      {loading && <p role="status">Cargando personas a cargo…</p>}
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      {!loading && !error && !items.length && <p>No tenés personas a cargo habilitadas para gestionar turnos.</p>}

      <div className="row g-3">
        {items.map((person) => (
          <div key={person.id_paciente} className="col-12 col-md-6">
            <article className="person-card h-100">
              <div className="person-card-header">
                <div>
                  <span className="patient-selector-kicker">Vínculo</span>
                  <h2 className="h5 mb-0">{person.apellidos}, {person.nombres}</h2>
                </div>
                <span className="person-card-badge">{person.parentesco}</span>
              </div>

              <div className="person-card-info">
                <div><span>DNI</span><strong>{person.dni}</strong></div>
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
        ))}
      </div>
    </section>
  );
}
