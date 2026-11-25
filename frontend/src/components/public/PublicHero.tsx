import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import heroBg from '../../assets/hero-cora.jpg';
import heroMobileBg from '../../assets/hero-cora-mobile.jpg';

// Sección principal HERO con fotografía institucional de fondo y contenido integrado.
export default function PublicHero() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <section className="public-hero-wrapper" aria-label="Portada de CORA">
      {/* Fotografía institucional de fondo responsive: panorámica en escritorio y vertical en celulares */}
      <picture className="public-hero-picture">
        <source media="(max-width: 767.98px)" srcSet={heroMobileBg} />
        <img
          className="public-hero-bg"
          src={heroBg}
          alt="Instalaciones de CORA en Goya, Corrientes"
          fetchPriority="high"
          loading="eager"
        />
      </picture>

      {/* Capa de degradado direccional para garantizar máximo contraste y legibilidad */}
      <div className="public-hero-overlay" aria-hidden="true" />

      {/* Contenido institucional integrado sobre la fotografía */}
      <div className="container position-relative public-hero-container">
        <div className="row align-items-center">
          <div className="col-12 col-lg-7 col-xl-6">
            {/* Contexto geográfico institucional */}
            <div className="public-hero-eyebrow d-inline-flex align-items-center px-3 py-1.5 rounded-pill mb-3">
              <span>SALUD Y COMUNIDAD · GOYA</span>
            </div>

            {/* Nombre oficial de la plataforma */}
            <h1 className="public-hero-title text-white fw-extrabold mb-2 tracking-tight">
              CORA
            </h1>

            {/* Significado oficial de la sigla CORA */}
            <p className="public-hero-lead text-white fw-semibold mb-3">
              Conexión y Organización de la Red de Atención
            </p>

            {/* Descripción institucional */}
            <p className="public-hero-description mb-4 lh-base">
              Una plataforma que conecta y organiza la atención, acerca las salitas a la comunidad y facilita la gestión de turnos, información y servicios de salud.
            </p>

            {/* Acciones principales y secundarias */}
            <div className="public-hero-actions d-flex flex-wrap align-items-center gap-3 mb-4 mb-lg-5" aria-busy={isLoading}>
              {!isLoading && (
                isAuthenticated ? (
                  <>
                    <Link className="btn btn-success btn-lg px-4 shadow-sm public-btn-primary d-inline-flex align-items-center justify-content-center gap-2" to="/panel">
                      <i className="bi bi-grid-fill" aria-hidden="true" />
                      <span>Ingresar a mi panel</span>
                    </Link>
                    <a className="btn btn-outline-light btn-lg px-4 public-btn-secondary d-inline-flex align-items-center justify-content-center gap-2" href="#salitas">
                      <i className="bi bi-hospital" aria-hidden="true" />
                      <span>Conocer las salitas</span>
                    </a>
                  </>
                ) : (
                  <>
                    <Link className="btn btn-success btn-lg px-4 shadow-sm public-btn-primary d-inline-flex align-items-center justify-content-center gap-2" to="/login">
                      <i className="bi bi-calendar-check" aria-hidden="true" />
                      <span>Solicitar turnos / Iniciar sesión</span>
                    </Link>
                    <a className="btn btn-outline-light btn-lg px-4 public-btn-secondary d-inline-flex align-items-center justify-content-center gap-2" href="#salitas">
                      <i className="bi bi-hospital" aria-hidden="true" />
                      <span>Conocer las salitas</span>
                    </a>
                    <Link
                      className="public-btn-tertiary d-inline-flex align-items-center justify-content-center gap-2"
                      to="/registro"
                    >
                      <i className="bi bi-person-plus text-success fs-5" aria-hidden="true" />
                      <span>Crear cuenta de paciente</span>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Fila de beneficios institucionales: adaptable entre cuadrícula (desktop/tablet) y lista compacta (mobile) */}
        <div className="public-hero-benefits-strip pt-3 border-top border-white border-opacity-15">
          {/* Versión Desktop / Tablet (>= 768px): 3 elementos en cuadrícula horizontal */}
          <div className="row g-3 g-lg-4 align-items-stretch d-none d-md-flex">
            {/* Beneficio 1 */}
            <div className="col-12 col-md-4">
              <div className="public-hero-benefit-item">
                <span className="public-hero-check-badge" aria-hidden="true">
                  <i className="bi bi-check2" />
                </span>
                <span className="public-hero-benefit-text">
                  Gestión de turnos programados
                </span>
              </div>
            </div>

            {/* Beneficio 2 */}
            <div className="col-12 col-md-4">
              <div className="public-hero-benefit-item">
                <span className="public-hero-check-badge" aria-hidden="true">
                  <i className="bi bi-check2" />
                </span>
                <span className="public-hero-benefit-text">
                  Red de salitas barriales
                </span>
              </div>
            </div>

            {/* Beneficio 3 */}
            <div className="col-12 col-md-4">
              <div className="public-hero-benefit-item">
                <span className="public-hero-check-badge" aria-hidden="true">
                  <i className="bi bi-check2" />
                </span>
                <span className="public-hero-benefit-text">
                  Cobertura por domicilio
                </span>
              </div>
            </div>
          </div>

          {/* Versión Celulares (< 768px): Lista compacta con separadores suaves sin volumen de tarjetas pesadas */}
          <div className="public-hero-benefits-compact d-md-none">
            <div className="public-hero-compact-item">
              <span className="public-hero-check-badge-sm" aria-hidden="true">
                <i className="bi bi-check2" />
              </span>
              <span className="public-hero-compact-text">
                Gestión de turnos programados
              </span>
            </div>
            <div className="public-hero-compact-divider" aria-hidden="true" />
            <div className="public-hero-compact-item">
              <span className="public-hero-check-badge-sm" aria-hidden="true">
                <i className="bi bi-check2" />
              </span>
              <span className="public-hero-compact-text">
                Red de salitas barriales
              </span>
            </div>
            <div className="public-hero-compact-divider" aria-hidden="true" />
            <div className="public-hero-compact-item">
              <span className="public-hero-check-badge-sm" aria-hidden="true">
                <i className="bi bi-check2" />
              </span>
              <span className="public-hero-compact-text">
                Cobertura por domicilio
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
