import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import '../../styles/auth.css';

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  showSectionIcon?: boolean;
}

// Estructura visual reutilizable para las pantallas de autenticación.
export default function AuthForm({
  title,
  subtitle,
  children,
  footer,
  showSectionIcon = true,
}: AuthFormProps) {
  return (
    <main className="auth-page">
      <div className="auth-shell">
        {/* Identidad institucional y acceso al sitio público. */}
        <section
          className="auth-identity"
          aria-label="SAPS Turno"
        >
          <div className="auth-brand">
            <span
              className="auth-brand-icon"
              aria-hidden="true"
            >
              <i className="bi bi-heart-pulse" />
            </span>

            <div>
              <strong>SAPS Turno</strong>
              <span>Atención primaria de la salud</span>
            </div>
          </div>

          <div className="auth-identity-main">
            <div className="auth-identity-copy">
              <span className="auth-eyebrow">
                GOYA · CORRIENTES
              </span>

              <h2>
                Más cerca
                <br />
                de tu salud.
              </h2>

              <p>
                Un mismo lugar para acompañar tu atención y organizar
                tus turnos en las salitas de la ciudad.
              </p>

              <div className="auth-identity-detail">
                <i
                  className="bi bi-hospital"
                  aria-hidden="true"
                />

                <span>
                  Salud pública.
                  <br />
                  <strong>Atención cercana.</strong>
                </span>
              </div>
            </div>

            <nav
              className="auth-page-navigation"
              aria-label="Volver al sitio público"
            >
              <Link
                className="auth-public-link"
                to="/"
              >
                <i
                  className="bi bi-arrow-left"
                  aria-hidden="true"
                />

                <span>
                  Volver a la página pública
                </span>
              </Link>
            </nav>
          </div>

          <p className="auth-identity-footer">
            Sistema de gestión de turnos de salud
          </p>
        </section>

        {/* Panel que contiene el formulario de autenticación. */}
        <section
          className="auth-form-panel"
          aria-labelledby="auth-title"
        >
          <div className="auth-form-content">
            <header className="auth-heading">
              {showSectionIcon && (
                <span
                  className="auth-section-icon"
                  aria-hidden="true"
                >
                  <i className="bi bi-person" />
                </span>
              )}

              <h1 id="auth-title">
                {title}
              </h1>

              {subtitle && (
                <p>
                  {subtitle}
                </p>
              )}
            </header>

            {/* Formulario específico de cada pantalla. */}
            {children}

            {/* Pie configurable o acceso predeterminado al login. */}
            <div className="auth-footer">
              {footer ?? (
                <Link to="/login">
                  <i
                    className="bi bi-arrow-left me-2"
                    aria-hidden="true"
                  />
                  Volver al inicio de sesión
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="auth-page-footer">
        SAPS Turno · Al servicio de nuestra comunidad
      </p>
    </main>
  );
}