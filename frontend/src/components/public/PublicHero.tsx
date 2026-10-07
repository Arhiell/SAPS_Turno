import { Link } from 'react-router-dom';

// Sección principal de presentación de SAPS Turno.
export default function PublicHero() {
  return (
    <section className="public-hero">
      <div className="container row mx-auto align-items-center g-4">
        {/* Presentación y accesos principales. */}
        <div className="col-lg-7">
          <p className="public-eyebrow">
            SALUD PÚBLICA · GOYA
          </p>

          <h1>
            SAPS Turno
          </h1>

          <p className="public-lead">
            Gestioná tus turnos de atención primaria de forma
            simple y segura.
          </p>

          <p>
            Un espacio para vos y tu familia: conocé las salitas,
            consultá las novedades y organizá tu próxima atención.
          </p>

          <div className="d-flex flex-wrap gap-3 mt-4">
            <Link
              className="btn btn-success btn-lg"
              to="/login"
            >
              <i
                className="bi bi-calendar-plus me-2"
                aria-hidden="true"
              />
              Solicitar / Iniciar sesión
            </Link>

            <Link
              className="btn btn-outline-success btn-lg"
              to="/registro"
            >
              Crear cuenta
            </Link>
          </div>
        </div>

        {/* Representación visual de atención y turnos. */}
        <div className="col-lg-5">
          <div
            className="public-health-visual"
            role="img"
            aria-label="Una salita y un calendario representan el acceso a la atención primaria"
          >
            <i
              className="bi bi-hospital"
              aria-hidden="true"
            />

            <div>
              <i
                className="bi bi-calendar-check"
                aria-hidden="true"
              />

              <span>
                Tu salud, más cerca
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}