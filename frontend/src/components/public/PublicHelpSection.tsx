import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    category: 'Registro y acceso',
    question: '¿Cómo me registro como paciente en CORA?',
    answer:
      'Podés crear tu cuenta ingresando a la opción "Registrarse". Solo necesitás una casilla de correo electrónico válida y una contraseña segura. El registro público está habilitado para todos los vecinos y pacientes de Goya.',
  },
  {
    category: 'Registro y acceso',
    question: '¿Por qué debo verificar mi correo electrónico con un código?',
    answer:
      'La verificación mediante un código de 4 dígitos asegura que el correo te pertenece, protege la confidencialidad de tu información de salud y permite que recibas notificaciones y recordatorios de turnos sin inconvenientes.',
  },
  {
    category: 'Seguridad',
    question: '¿Cómo recupero mi contraseña si la olvidé?',
    answer:
      'En la pantalla de inicio de sesión seleccioná "¿Olvidaste tu contraseña?". Ingresá el correo asociado a tu cuenta y recibirás un código de 4 dígitos para crear una nueva contraseña en pocos pasos.',
  },
  {
    category: 'Turnos y atención',
    question: '¿Cómo solicito un turno en una salita?',
    answer:
      'Una vez iniciada la sesión en tu panel de paciente y completado tu domicilio (para determinar tu salita de cobertura), ingresá a "Solicitar turno". Podrás seleccionar la especialidad médica, el profesional y el horario disponible que prefieras.',
  },
  {
    category: 'Salitas y cobertura',
    question: '¿Cómo sé qué salita me corresponde?',
    answer:
      'En CORA, la asignación de salita se realiza según el barrio y domicilio que registrás en tu perfil. También podés consultar el directorio público de salitas en esta página para conocer direcciones y teléfonos de atención.',
  },
  {
    category: 'Atención médica',
    question: '¿Qué hago si tengo una urgencia médica?',
    answer:
      'CORA organiza la atención primaria y ambulatoria programada. Ante una emergencia o situación que requiera atención inmediata, comunicate de forma directa con el 107 o acudí a la guardia médica hospitalaria más cercana.',
  },
];

export default function PublicHelpSection() {
  const { isAuthenticated, isLoading } = useAuth();
  // Inicia con todas las preguntas cerradas para evitar saltos o desplazamientos inesperados.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <section className="container public-section" id="ayuda">
      <div className="text-center max-w-75 mx-auto mb-4">
        <p className="public-eyebrow">ASISTENCIA Y PREGUNTAS FRECUENTES</p>
        <h2>Estamos para orientarte</h2>
        <p className="text-muted">
          Encontrá respuestas rápidas sobre el funcionamiento de CORA, el registro de pacientes y la gestión de turnos de salud en Goya.
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="row g-3 mb-5">
        <div className="col-md-6 col-lg-3">
          <div className="card h-100 p-3 text-center border-0 public-help-card">
            <div className="public-help-icon mb-2">
              <i className="bi bi-person-plus text-success fs-3" aria-hidden="true" />
            </div>
            <h3 className="h6 mb-2">Registro de pacientes</h3>
            <p className="small text-muted mb-3">
              Creá tu cuenta institucional para comenzar a gestionar tu atención.
            </p>
            {!isLoading && (
              <Link
                to={isAuthenticated ? '/panel' : '/registro'}
                className="btn btn-sm btn-outline-success mt-auto"
              >
                {isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta'}
              </Link>
            )}
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 p-3 text-center border-0 public-help-card">
            <div className="public-help-icon mb-2">
              <i className="bi bi-key text-primary fs-3" aria-hidden="true" />
            </div>
            <h3 className="h6 mb-2">Recuperar contraseña</h3>
            <p className="small text-muted mb-3">
              Restablecé tu clave de ingreso mediante un código enviado a tu casilla.
            </p>
            <Link
              to="/recuperar-contrasena"
              className="btn btn-sm btn-outline-primary mt-auto"
            >
              Recuperar acceso
            </Link>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 p-3 text-center border-0 public-help-card">
            <div className="public-help-icon mb-2">
              <i className="bi bi-envelope-check text-success fs-3" aria-hidden="true" />
            </div>
            <h3 className="h6 mb-2">Verificar correo</h3>
            <p className="small text-muted mb-3">
              ¿Tenés un código pendiente? Confirmá tu cuenta para habilitar turnos.
            </p>
            <Link
              to="/verificar-codigo"
              className="btn btn-sm btn-outline-success mt-auto"
            >
              Ingresar código
            </Link>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 p-3 text-center border-0 public-help-card">
            <div className="public-help-icon mb-2">
              <i className="bi bi-hospital text-info fs-3" aria-hidden="true" />
            </div>
            <h3 className="h6 mb-2">Red de salitas</h3>
            <p className="small text-muted mb-3">
              Consultá teléfonos, zonas y direcciones de los centros de salud.
            </p>
            <a
              href="#salitas"
              className="btn btn-sm btn-outline-info mt-auto"
            >
              Ver salitas
            </a>
          </div>
        </div>
      </div>

      {/* Preguntas frecuentes en acordeón interactivo y accesible */}
      <div className="public-help-container">
        <div className="card p-3 p-md-4 shadow-sm border">
          <h3 className="h5 mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-question-circle text-success" aria-hidden="true" />
            Preguntas frecuentes
          </h3>

          <div className="public-faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const headingId = `faq-heading-${index}`;
              const panelId = `faq-panel-${index}`;

              return (
                <div key={faq.question} className="public-faq-item border-bottom py-3">
                  <button
                    type="button"
                    className="public-faq-trigger w-100 d-flex align-items-center justify-content-between text-start bg-transparent border-0 p-0 fw-semibold"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    id={headingId}
                  >
                    <span className="pe-3">{faq.question}</span>
                    <i
                      className={`bi ${isOpen ? 'bi-chevron-up text-success' : 'bi-chevron-down text-muted'}`}
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headingId}
                      className="mt-2 text-muted public-faq-answer pt-1"
                    >
                      <p className="mb-0">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aviso institucional de urgencias */}
        <div className="alert alert-info mt-4 d-flex align-items-start gap-3 border-0 bg-info-subtle" role="note">
          <i className="bi bi-info-circle-fill text-info fs-4 flex-shrink-0 mt-1" aria-hidden="true" />
          <div>
            <strong>Atención de emergencias:</strong>
            <p className="mb-0 small mt-1">
              CORA está destinado a la organización de la atención programada en centros de salud. Ante situaciones de riesgo de vida o emergencias agudas, llamá de inmediato al <strong>107</strong> o acercate a la guardia del Hospital Regional de Goya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
