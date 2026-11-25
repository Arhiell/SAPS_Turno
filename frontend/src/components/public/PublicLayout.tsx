import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Link,
  Outlet,
  useLocation,
} from 'react-router-dom';

import {
  useAuth,
} from '../../context/AuthContext';

import '../../styles/public.css';

// Enlaces principales de la barra de navegación pública.
const navLinks = [
  { label: 'Inicio', url: '/' },
  { label: 'Cómo funciona', url: '/#como-funciona' },
  { label: 'Salitas', url: '/#salitas' },
  { label: 'Noticias', url: '/#noticias' },
  { label: 'Ayuda', url: '/#ayuda' },
];

// Layout principal utilizado por las páginas públicas de CORA.
export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated, isLoading } = useAuth();
  const { pathname, hash } = useLocation();

  // Posiciona la página en la sección indicada por el hash de forma estable o vuelve al inicio al cambiar de ruta.
  useEffect(() => {
    if (hash) {
      const targetId = hash.slice(1);
      const timer = window.setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
      return () => window.clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  // Cierra el menú móvil al presionar Escape o al hacer clic fuera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="public-site">
      {/* Salto para accesibilidad por teclado */}
      <a className="public-skip" href="#contenido-publico">
        Saltar al contenido principal
      </a>

      {/* Encabezado y barra de navegación institucional */}
      <header className="public-header sticky-top">
        <nav
          className="container public-navigation"
          aria-label="Navegación principal de CORA"
        >
          {/* Marca e identidad institucional */}
          <Link
            className="public-brand d-flex align-items-center gap-2"
            to="/"
            onClick={() => setOpen(false)}
            aria-label="CORA - Inicio"
          >
            <span className="public-brand-logo">
              <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
            </span>
            <span className="public-brand-title">CORA</span>
          </Link>

          {/* Botón hamburguesa para dispositivos móviles */}
          <button
            ref={toggleRef}
            type="button"
            className="btn btn-outline-success public-menu-toggle d-xl-none"
            aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            aria-expanded={open}
            aria-controls="public-menu"
            onClick={() => setOpen(!open)}
          >
            <i className={`bi ${open ? 'bi-x-lg' : 'bi-list'}`} aria-hidden="true" />
          </button>

          {/* Menú de navegación y accesos */}
          <div
            id="public-menu"
            ref={menuRef}
            className={`public-menu ${open ? 'is-open' : ''}`}
          >
            <div className="public-nav-links">
              {navLinks.map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  className="public-nav-item"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Accesos de autenticación diferenciados con alturas y proporciones consistentes */}
            <div className="public-auth-actions d-flex align-items-center gap-2 pt-3 pt-xl-0 border-top border-xl-0">
              {!isLoading && (
                isAuthenticated ? (
                  <Link
                    className="btn btn-success public-nav-btn public-nav-btn-panel d-inline-flex align-items-center justify-content-center gap-1.5"
                    to="/panel"
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-grid-fill" aria-hidden="true" />
                    <span>Mi panel</span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="btn btn-outline-success public-nav-btn public-nav-btn-login d-inline-flex align-items-center justify-content-center gap-1.5"
                      onClick={() => setOpen(false)}
                    >
                      <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                      <span>Iniciar sesión</span>
                    </Link>
                    <Link
                      to="/registro"
                      className="btn btn-success public-nav-btn public-nav-btn-register d-inline-flex align-items-center justify-content-center gap-1.5"
                      onClick={() => setOpen(false)}
                    >
                      <i className="bi bi-person-plus-fill" aria-hidden="true" />
                      <span>Registrarse</span>
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Contenido principal de la página */}
      <main id="contenido-publico" tabIndex={-1}>
        <Outlet />
      </main>

      {/* Pie de página institucional */}
      <footer className="public-footer mt-5 pt-5 pb-4">
        <div className="container">
          <div className="row g-4 mb-4">
            {/* Columna institucional */}
            <div className="col-lg-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="public-footer-logo">
                  <i className="bi bi-heart-pulse-fill" aria-hidden="true" />
                </span>
                <strong className="fs-5 tracking-tight">CORA</strong>
              </div>
              <p className="fw-semibold mb-1 text-light">
                Conexión y Organización de la Red de Atención
              </p>
              <p className="small text-white-50 mb-3">
                Una plataforma que conecta y organiza la atención, acerca las salitas a la comunidad y facilita la gestión de turnos, información y servicios de salud.
              </p>
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-geo-alt-fill text-warning" aria-hidden="true" />
                <span>Goya, Corrientes</span>
              </div>
            </div>

            {/* Columna Navegación */}
            <div className="col-6 col-md-4 col-lg-2">
              <h4 className="h6 text-white text-uppercase tracking-wider fw-bold mb-3">
                Navegación
              </h4>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><a href="/">Inicio</a></li>
                <li><a href="/#como-funciona">Cómo funciona</a></li>
                <li><a href="/#salitas">Centros de Salud</a></li>
                <li><a href="/#noticias">Noticias y Avisos</a></li>
                <li><a href="/#ayuda">Preguntas frecuentes</a></li>
              </ul>
            </div>

            {/* Columna Pacientes */}
            <div className="col-6 col-md-4 col-lg-2">
              <h4 className="h6 text-white text-uppercase tracking-wider fw-bold mb-3">
                Pacientes
              </h4>
              <ul className="list-unstyled d-flex flex-column gap-2 small">
                <li><Link to="/login">Solicitar turnos</Link></li>
                <li><Link to="/registro">Crear cuenta</Link></li>
                <li><Link to="/verificar-codigo">Verificar correo</Link></li>
                <li><Link to="/recuperar-contrasena">Recuperar contraseña</Link></li>
                <li><Link to="/privacidad">Política de privacidad</Link></li>
              </ul>
            </div>

            {/* Columna Institucional y Contacto */}
            <div className="col-md-4 col-lg-3">
              <h4 className="h6 text-white text-uppercase tracking-wider fw-bold mb-3">
                Institucional
              </h4>
              <ul className="list-unstyled d-flex flex-column gap-2 small mb-3">
                <li>
                  <a
                    href="https://www.goya.gob.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-inline-flex align-items-center gap-2"
                  >
                    <span>Portal de la ciudad de Goya</span>
                    <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} aria-hidden="true" />
                  </a>
                </li>
                <li><Link to="/login">Acceso para profesionales y personal</Link></li>
                <li><a href="/#salitas">Teléfonos y centros de salud</a></li>
              </ul>

              <div className="p-2.5 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                <span className="d-block small text-warning fw-bold mb-1">
                  <i className="bi bi-telephone-inbound-fill me-2" aria-hidden="true" />
                  Urgencias y emergencias
                </span>
                <span className="small text-white-50">
                  Llamá al servicio <strong>107</strong> para emergencias sanitarias.
                </span>
              </div>
            </div>
          </div>

          {/* Barra inferior de derechos */}
          <div className="pt-3 border-top border-white border-opacity-10 d-flex flex-wrap justify-content-between align-items-center gap-2 small text-white-50">
            <span>
              © {new Date().getFullYear()} CORA · Goya, Corrientes. Todos los derechos reservados.
            </span>
            <div>
              <Link to="/privacidad" className="text-white-50 text-decoration-none">Privacidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
