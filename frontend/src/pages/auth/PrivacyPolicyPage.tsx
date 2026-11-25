import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrivacyPolicyPage() {
  const { isAuthenticated } = useAuth();

  return (
    <article className="card p-3 p-md-4 mx-auto my-4" style={{ maxWidth: 960 }} aria-labelledby="privacy-policy-title">
      <h1 id="privacy-policy-title" className="h3">Política de privacidad</h1>
      <p className="text-muted">Información sobre tus datos y el almacenamiento del sitio.</p>

      <div className="alert alert-warning" role="note">
        <strong>Versión institucional.</strong> Este documento describe los criterios de tratamiento de datos personales y privacidad aplicados por CORA (Conexión y Organización de la Red de Atención) en el ámbito de la salud pública municipal de Goya, Corrientes.
      </div>

      <section aria-labelledby="privacy-data-title">
        <h2 id="privacy-data-title" className="h5">Uso de tus datos</h2>
        <p>CORA utiliza los datos que ingresás para gestionar tu cuenta, tu perfil de paciente o profesional, tus turnos y los servicios de atención sanitaria disponibles. Según el trámite, estos pueden incluir datos de identificación (DNI, nombre, apellido), contacto (correo, teléfono) y cobertura de salud (salita asignada por domicilio).</p>
        <p>La información disponible en el sistema depende del rol y los permisos de cada cuenta. Este aviso no reemplaza la información ni los consentimientos específicos que correspondan a la atención de salud médica presencial.</p>
      </section>

      <section aria-labelledby="privacy-storage-title">
        <h2 id="privacy-storage-title" className="h5">Almacenamiento en tu navegador y seguridad</h2>
        <p>El sitio utiliza almacenamiento local seguro para mantener tu sesión activa, recordar la lectura de avisos y conservar ajustes de la interfaz. Algunos datos temporales se resguardan únicamente durante la sesión activa de navegación.</p>
        <p>Este almacenamiento no se comparte con terceros con fines comerciales ni publicitarios. El acceso institucional con Google, cuando está habilitado, utiliza los protocolos de autenticación oficiales de dicho proveedor.</p>
        <p>Podés gestionar y limpiar los datos del sitio desde las opciones de privacidad de tu navegador web en cualquier momento.</p>
      </section>

      <section aria-labelledby="privacy-services-title">
        <h2 id="privacy-services-title" className="h5">Servicios y asistencia</h2>
        <p>Las funciones de orientación y asistente virtual de CORA están diseñadas para guiar al usuario en el uso de la plataforma. Recordá no ingresar información médica sensible ni contraseñas en el asistente de chat.</p>
      </section>

      <section aria-labelledby="privacy-contact-title">
        <h2 id="privacy-contact-title" className="h5">Atención y consultas</h2>
        <p>Ante cualquier duda sobre la administración de tus datos personales en el sistema de salud municipal, podés concurrir a tu salita de atención primaria más cercana o consultar en el portal oficial de la Municipalidad de Goya.</p>
      </section>

      <div className="d-flex flex-wrap gap-2 pt-3 border-top">
        <Link to="/" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Volver al inicio
        </Link>
        {isAuthenticated ? (
          <Link to="/mi-perfil" className="btn btn-success">
            Ir a mi perfil
          </Link>
        ) : (
          <Link to="/login" className="btn btn-success">
            Iniciar sesión
          </Link>
        )}
      </div>
    </article>
  );
}
