import { usePublicResource } from '../../context/usePublicResource';
import { getMunicipalNews } from '../../services/public-content.service';
import ResourceState from './ResourceState';
import { newsDate } from './NewsCard';

// Muestra las noticias obtenidas desde el portal municipal de Goya.
export default function MunicipalNewsSection() {
  const resource = usePublicResource(getMunicipalNews);

  return (
    <section className="container public-section" id="noticias-goya">
      <div className="mb-4">
        <p className="public-eyebrow">ACTUALIDAD LOCAL</p>
        <h2 className="mb-1">Noticias de Goya</h2>
        <p className="text-muted mb-0">
          Novedades y comunicados locales de la ciudad de Goya.
        </p>
      </div>

      {/* Estado general de carga, error o ausencia de noticias. */}
      <ResourceState
        {...resource}
        error={
          resource.error
            ? 'No fue posible cargar las novedades locales en este momento.'
            : ''
        }
        empty={resource.data?.estado === 'empty'}
        emptyText="No hay novedades locales disponibles en este momento."
      />

      {/* Informa cuando la fuente de novedades no pudo actualizarse. */}
      {resource.data?.estado === 'error' && (
        <div role="status" className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill text-warning fs-5" aria-hidden="true" />
          <span>No fue posible sincronizar las novedades locales en este momento. Se intentará en la próxima consulta.</span>
        </div>
      )}

      {/* Indica cuando se muestran datos almacenados de una consulta anterior. */}
      {resource.data?.desactualizado && (
        <p className="small text-muted mb-3">
          <i className="bi bi-clock-history me-1" aria-hidden="true" />
          Mostrando la última información archivada del portal:{' '}
          <strong>{newsDate(resource.data.actualizacion)}</strong>.
        </p>
      )}

      {/* Listado de noticias municipales disponibles. */}
      <div className="row g-3">
        {resource.data?.items.map((item) => (
          <div className="col-md-6 col-xl-4" key={item.enlace}>
            <article className="card h-100 p-4 shadow-sm border public-municipal-card">
              <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
                <i className="bi bi-calendar-event text-success" aria-hidden="true" />
                <time dateTime={item.fecha}>
                  {newsDate(item.fecha)}
                </time>
              </div>

              <h3 className="h6 fw-bold mb-3 lh-base text-dark">
                {item.titulo}
              </h3>

              <a
                className="btn btn-sm btn-outline-success mt-auto align-self-start d-inline-flex align-items-center gap-1.5"
                href={item.enlace}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Leer noticia completa</span>
                <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} aria-hidden="true" />
                <span className="visually-hidden"> (abre en una pestaña nueva)</span>
              </a>
            </article>
          </div>
        ))}
      </div>

      {/* Acceso al listado completo del portal municipal. */}
      <div className="mt-4">
        <a
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
          href="https://www.goya.gob.ar/?q=novedades"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="bi bi-globe2 text-success" aria-hidden="true" />
          <span>Ver todas las novedades en goya.gob.ar</span>
          <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.75rem' }} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
