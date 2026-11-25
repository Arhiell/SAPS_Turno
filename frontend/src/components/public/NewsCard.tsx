import { Link } from 'react-router-dom';
import type { PublicNews } from '../../types/public-content.types';

// Formatea la fecha de publicación con la zona horaria de Argentina.
export const newsDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
        timeZone: 'America/Argentina/Buenos_Aires',
      }).format(new Date(value))
    : 'Sin fecha de publicación';

// Representa una noticia dentro del listado público institucional.
export default function NewsCard({ news }: { news: PublicNews }) {
  return (
    <article className="card h-100 public-news-card shadow-sm border">
      {/* Imagen de portada de la noticia o contenedor temático institucional */}
      {news.imagen_url ? (
        <div className="public-news-img-wrap">
          <img
            className="card-img-top public-news-img"
            src={news.imagen_url}
            alt={news.titulo}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div className="public-news-placeholder p-4 d-flex align-items-center justify-content-between bg-success-subtle border-bottom">
          <span className="badge text-bg-success">
            {news.categoria.nombre}
          </span>
          <i className="bi bi-newspaper text-success fs-3 opacity-75" aria-hidden="true" />
        </div>
      )}

      <div className="card-body d-flex flex-column p-4">
        {/* Categoría y fecha si hay imagen */}
        {news.imagen_url && (
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="badge text-bg-success-subtle text-success-emphasis border border-success-subtle">
              {news.categoria.nombre}
            </span>
            <time className="small text-muted" dateTime={news.fecha_publicacion ?? undefined}>
              {newsDate(news.fecha_publicacion)}
            </time>
          </div>
        )}

        {!news.imagen_url && (
          <time className="small text-muted mb-2 d-block" dateTime={news.fecha_publicacion ?? undefined}>
            <i className="bi bi-calendar3 me-1" aria-hidden="true" />
            {newsDate(news.fecha_publicacion)}
          </time>
        )}

        <h3 className="h6 fw-bold mb-2 text-dark lh-base">
          {news.titulo}
        </h3>

        <p className="text-secondary small mb-3 flex-grow-1 lh-base">
          {news.resumen}
        </p>

        {/* Salita responsable o emisor institucional */}
        <div className="d-flex align-items-center gap-1.5 small text-muted mb-3 pt-2 border-top">
          <i className="bi bi-hospital text-success" aria-hidden="true" />
          <span className="text-truncate">
            {news.salita?.nombre ?? 'CORA · Goya'}
          </span>
        </div>

        {/* Acceso al detalle completo de la noticia */}
        <Link
          className="btn btn-sm btn-outline-success mt-auto align-self-start d-inline-flex align-items-center gap-1.5"
          to={`/noticias/${news.id_noticia}`}
          aria-label={`Leer noticia completa: ${news.titulo}`}
        >
          <span>Leer noticia</span>
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
