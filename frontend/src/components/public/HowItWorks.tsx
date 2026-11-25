import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Pasos detallados para el ciudadano según la especificación institucional de CORA.
const steps = [
  {
    icon: 'bi-person-plus',
    stepNumber: '01',
    badge: 'Paso 1',
    title: 'Registrate',
    text: 'Creá tu cuenta de paciente con tu correo electrónico y una contraseña segura. El trámite es digital y gratuito.',
  },
  {
    icon: 'bi-envelope-check',
    stepNumber: '02',
    badge: 'Paso 2',
    title: 'Verificá tu cuenta',
    text: 'Ingresá el código de 4 dígitos enviado a tu casilla de correo para validar tu identidad de forma segura.',
  },
  {
    icon: 'bi-person-vcard',
    stepNumber: '03',
    badge: 'Paso 3',
    title: 'Completá tus datos',
    text: 'Ingresá tu domicilio real en Goya para que el sistema identifique tu salita de cobertura y organice tu atención.',
  },
  {
    icon: 'bi-hospital',
    stepNumber: '04',
    badge: 'Paso 4',
    title: 'Consultá las salitas',
    text: 'Explorá los centros de salud disponibles en cada zona, sus horarios de atención, teléfonos y ubicaciones.',
  },
  {
    icon: 'bi-calendar-check',
    stepNumber: '05',
    badge: 'Paso 5',
    title: 'Solicitá tu turno',
    text: 'Elegí la especialidad y el profesional según disponibilidad en tu sala asignada, y confirmá el día y horario.',
  },
  {
    icon: 'bi-clipboard2-pulse',
    stepNumber: '06',
    badge: 'Paso 6',
    title: 'Consultá tu atención',
    text: 'Accedé a tus citas programadas, recibí avisos y recordatorios, y llevá el seguimiento de tu atención médica.',
  },
];

// Explica el funcionamiento general del sistema al paciente.
export default function HowItWorks() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section id="como-funciona" className="container public-section">
      <div className="text-center max-w-75 mx-auto mb-4">
        <p className="public-eyebrow">PASO A PASO CIUDADANO</p>
        <h2>¿Cómo funciona CORA?</h2>
        <p className="text-muted">
          Una guía simple para gestionar tu atención médica en las salitas de salud de Goya en 6 pasos.
        </p>
      </div>

      <ol className="row g-3 list-unstyled mt-2">
        {steps.map((item) => (
          <li className="col-md-6 col-lg-4" key={item.title}>
            <div className="card h-100 p-4 public-step-card shadow-sm border">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="public-step-badge">
                  <i className={`bi ${item.icon} me-1.5`} aria-hidden="true" />
                  {item.badge}
                </span>
                <span className="text-muted small fw-bold opacity-50">
                  {item.stepNumber}
                </span>
              </div>

              <h3 className="h5 text-success mb-2">
                {item.title}
              </h3>

              <p className="mb-0 text-muted small lh-base">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* Tarjeta de acción institucional al pie de los pasos */}
      <div className="public-cta-banner mt-5">
        <div className="row align-items-center g-4">
          <div className="col-12 col-md-8 text-center text-md-start">
            <span className="public-cta-badge d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill mb-2">
              <i className="bi bi-shield-check" aria-hidden="true" />
              <span>Atención 100% digital y gratuita</span>
            </span>
            <h3 className="h4 text-white fw-bold mb-2">
              {isAuthenticated
                ? 'Ya tenés tu sesión activa en CORA'
                : '¿Listo para solicitar tu atención médica?'}
            </h3>
            <p className="text-white-50 mb-0 small lh-base">
              {isAuthenticated
                ? 'Ingresá a tu panel para solicitar nuevos turnos o consultar el estado de tus citas programadas.'
                : 'Creá tu cuenta de paciente hoy mismo para tener acceso directo y ágil a la gestión de turnos y atención médica en Goya.'}
            </p>
          </div>
          <div className="col-12 col-md-4 text-center text-md-end">
            {!isLoading && (
              <Link
                to={isAuthenticated ? '/panel' : '/registro'}
                className="btn btn-light btn-lg public-cta-btn fw-bold px-4 shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
              >
                {isAuthenticated ? (
                  <>
                    <i className="bi bi-grid-fill text-success" aria-hidden="true" />
                    <span>Ir a mi panel</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus-fill text-success" aria-hidden="true" />
                    <span>Registrarme ahora</span>
                  </>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
