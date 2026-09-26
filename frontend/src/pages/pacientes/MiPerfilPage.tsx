import { useAuth } from '../../context/AuthContext';

export default function MiPerfilPage() {
  const { patient, user } = useAuth();
  return <div className="card shadow-sm">
    <div className="card-body">
      <h1 className="h3">Mi perfil</h1>

    {patient && <dl className="row">
      {
      Object.entries(
        { Nombre: `${patient.nombres} 
        ${patient.apellidos}`,
         DNI: patient.dni, 
         Correo: user?.email,
        'Fecha de nacimiento': patient.fecha_nacimiento, 
        Sexo: patient.sexo, 
        Teléfono: patient.telefono, 
        Dirección: patient.direccion,
        'Obra social': patient.obra_social 
        }).map(
          ([label, value]

          ) => <div className="col-md-6 mb-3" key={label}>
            <dt>{label}</dt>
            <dd>{value || 'Sin informar'}</dd>
            </div>)
            }

    </dl>
    }
    <p className="text-muted">Para actualizar tus datos, contactá a tu salita.</p>
  </div>
  </div>;
}
