import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { newsDate } from '../../components/public/NewsCard';
import ResourceState from '../../components/public/ResourceState';
import { usePublicResource } from '../../context/usePublicResource';
import { getPublicNewsDetail } from '../../services/public-content.service';

// Página pública con el contenido completo de una noticia.
export default function PublicNewsDetailPage() {
  const { id = '' } = useParams();

  // Mantiene la carga vinculada al identificador de la noticia.
  const loader = useCallback(
    () => getPublicNewsDetail(id),
    [id]
  );

  const resource = usePublicResource(loader);
  const news = resource.data;

  return (
    <div className="container public-section public-article py-4">
      {/* Navegación de retorno */}
      <nav aria-label="Navegación de retorno" className="mb-4">
        <Link
          to="/#noticias"
          className="btn btn-outline-success d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          <span>Volver a Noticias</span>
        </Link>
      </nav>

      {/* Estado de carga o error del recurso */}
      <ResourceState {...resource} />

      {/* Contenido completo de la noticia */}
      {news && (
        <article className="card p-4 p-md-5 shadow-sm border rounded-4 bg-white">
          <header className="mb-4 border-bottom pb-4">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="badge text-bg-success px-2.5 py-1.5">
                {news.categoria.nombre}
              </span>
              <time className="small text-muted" dateTime={news.fecha_publicacion ?? undefined}>
                <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                {newsDate(news.fecha_publicacion)}
              </time>
              <span className="text-muted small">·</span>
              <span className="small text-muted d-inline-flex align-items-center gap-1">
                <i className="bi bi-hospital text-success" aria-hidden="true" />
                {news.salita?.nombre ?? 'CORA · Goya'}
              </span>
            </div>

            <h1 className="h2 fw-bold text-dark mb-3 lh-sm">
              {news.titulo}
            </h1>

            <p className="lead text-secondary mb-3">
              {news.resumen}
            </p>

            <div className="d-flex align-items-center gap-2 small text-muted">
              <i className="bi bi-person-badge text-success" aria-hidden="true" />
              <span>
                Emisor:{' '}
                <strong>
                  {news.salita ? `Salita ${news.salita.nombre}` : 'CORA · Goya'}
                </strong>
              </span>
            </div>
          </header>

          {/* Imagen de la publicación, si está disponible */}
          {news.imagen_url && (
            <div className="mb-4 text-center">
              <img
                className="public-article-image img-fluid rounded-3 shadow-xs"
                src={news.imagen_url}
                alt={news.titulo}
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* Contenido principal formateado */}
          <div className="public-plain-content text-dark lh-lg fs-6">
            {news.contenido}
          </div>

          <footer className="mt-5 pt-4 border-top d-flex flex-wrap justify-content-between align-items-center gap-3">
            <Link to="/#noticias" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Ver más noticias
            </Link>

            <a href="#contenido-publico" className="btn btn-link text-decoration-none text-muted small">
              Volver arriba
            </a>
          </footer>
        </article>
      )}
    </div>
  );
}
