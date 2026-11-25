import { useMemo, useState } from 'react';
import { usePublicResource } from '../../context/usePublicResource';
import { getPublicSalitas } from '../../services/public-content.service';
import ResourceState from './ResourceState';
import { PublicCarousel } from './PublicCarousel';
import { formatZonaLabel, resolveActiveSalitaIndex } from '../../utils/public-content';
import type { PublicSalita } from '../../types/public-content.types';

export { formatZonaLabel };

// Renderiza una tarjeta individual de salita con diseño institucional y proporciones equilibradas.
function SalitaCard({ salita }: { salita: PublicSalita }) {
  const cleanPhone = salita.telefono ? salita.telefono.replace(/[^+\d]/g, '') : null;
  const hours =
    salita.horario_apertura && salita.horario_cierre
      ? `${salita.horario_apertura.slice(0, 5)} a ${salita.horario_cierre.slice(0, 5)} hs`
      : 'Consultar horario en la salita';

  return (
    <article className="card public-salita-card h-100 shadow-sm">
      <div className="card-body d-flex flex-column p-3 p-md-4">
        {/* Encabezado de la tarjeta: Badges de zona y nivel de atención */}
        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
          <span className="badge public-salita-zone-badge">
            <i className="bi bi-geo-fill me-1" aria-hidden="true" />
            {formatZonaLabel(salita.zona)}
          </span>
          <span className="badge text-bg-light border text-muted small">
            Atención primaria
          </span>
        </div>

        {/* Nombre del establecimiento con altura mínima para nivelar filas */}
        <h3 className="h5 text-success fw-bold mb-2 d-flex align-items-start gap-2 public-salita-title">
          <i className="bi bi-hospital fs-5 flex-shrink-0 mt-0.5 text-success" aria-hidden="true" />
          <span>{salita.nombre}</span>
        </h3>

        {/* Domicilio físico */}
        <p className="text-muted small mb-3 d-flex align-items-start gap-2 public-salita-address">
          <i className="bi bi-geo-alt text-danger fs-6 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{salita.direccion}</span>
        </p>

        {/* Metadatos y acciones al pie */}
        <div className="public-salita-meta pt-3 border-top mt-auto">
          {/* Horario de funcionamiento */}
          <div className="d-flex align-items-center gap-2 mb-2 small text-muted">
            <i className="bi bi-clock text-primary flex-shrink-0" aria-hidden="true" />
            <span className="fw-medium">{hours}</span>
          </div>

          {/* Contacto telefónico y radicación */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
            {salita.telefono ? (
              <a
                href={`tel:${cleanPhone}`}
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 public-salita-call-btn"
                aria-label={`Llamar a ${salita.nombre} al ${salita.telefono}`}
              >
                <i className="bi bi-telephone-fill" aria-hidden="true" />
                <span>{salita.telefono}</span>
              </a>
            ) : (
              <span className="small text-muted fst-italic d-inline-flex align-items-center gap-1">
                <i className="bi bi-telephone text-muted opacity-75" aria-hidden="true" />
                <span>Sin teléfono publicado</span>
              </span>
            )}

            <span className="small text-muted fw-medium">Goya, Ctes.</span>
          </div>
        </div>
      </div>
    </article>
  );
}

// Sección pública de centros de salud de CORA.
export default function PublicSalitasSection() {
  const resource = usePublicResource(getPublicSalitas);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [selectedSalitaId, setSelectedSalitaId] = useState<string | null>(null);

  const salitas = resource.data ?? [];

  // Extrae las zonas disponibles de las salitas recibidas
  const zones = useMemo(() => {
    const set = new Set<string>();
    salitas.forEach((s) => {
      if (s.zona) set.add(s.zona);
    });
    return Array.from(set).sort();
  }, [salitas]);

  // Filtra por término de búsqueda y por zona
  const filteredSalitas = useMemo(() => {
    const term = search.trim().toLowerCase();
    return salitas.filter((salita) => {
      const matchesSearch =
        !term ||
        salita.nombre.toLowerCase().includes(term) ||
        salita.direccion.toLowerCase().includes(term) ||
        (salita.zona && salita.zona.toLowerCase().includes(term));

      const matchesZone = selectedZone === 'all' || salita.zona === selectedZone;

      return matchesSearch && matchesZone;
    });
  }, [salitas, search, selectedZone]);

  // Calcula el índice de la salita activa dentro del conjunto filtrado.
  // Si cambia el filtro de zona o búsqueda y la salita previamente elegida ya no pertenece al resultado,
  // se ajusta de inmediato a la primera salita disponible (índice 0).
  const activeIndex = useMemo(
    () => resolveActiveSalitaIndex(filteredSalitas, selectedSalitaId),
    [filteredSalitas, selectedSalitaId]
  );

  const handleSalitaIndexChange = (newIndex: number) => {
    if (filteredSalitas[newIndex]) {
      setSelectedSalitaId(filteredSalitas[newIndex].id_salita);
    }
  };

  return (
    <section className="container public-section" id="salitas">
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <p className="public-eyebrow">CENTROS DE SALUD · GOYA</p>
          <h2 className="mb-1">Salitas de Atención Primaria</h2>
          <p className="text-muted mb-0">
            Conocé los centros de salud distribuidos en los barrios de Goya. Consultá direcciones, horarios y teléfonos de contacto.
          </p>
        </div>

        {/* Selector de modo de vista (Cuadrícula / Carrusel) visible exclusivamente en escritorio */}
        {salitas.length > 0 && (
          <div className="btn-group btn-group-sm d-none d-md-inline-flex" role="group" aria-label="Modo de visualización de salitas">
            <button
              type="button"
              className={`btn ${viewMode === 'grid' ? 'btn-success' : 'btn-outline-success'} d-inline-flex align-items-center gap-2`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
            >
              <i className="bi bi-grid-fill" aria-hidden="true" />
              <span>Cuadrícula</span>
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'carousel' ? 'btn-success' : 'btn-outline-success'} d-inline-flex align-items-center gap-2`}
              onClick={() => setViewMode('carousel')}
              aria-pressed={viewMode === 'carousel'}
            >
              <i className="bi bi-view-stacked" aria-hidden="true" />
              <span>Carrusel</span>
            </button>
          </div>
        )}
      </div>

      {/* Estado de carga o error */}
      <ResourceState
        {...resource}
        empty={salitas.length === 0}
        emptyText="No hay salitas disponibles para mostrar en este momento."
      />

      {/* Barra de búsqueda y filtros por zona con control unificado sin bordes duplicados */}
      {salitas.length > 0 && (
        <div className="card public-filter-card p-3 p-md-4 mb-4 border bg-white shadow-xs">
          <div className="row g-3 align-items-center">
            {/* Buscador unificado: icono integrado, sin outline doble y botón de limpieza único */}
            <div className="col-12 col-lg-6">
              <div className="public-search-box">
                <i className="bi bi-search public-search-icon" aria-hidden="true" />
                <input
                  type="search"
                  className="public-search-input"
                  placeholder="Buscar por nombre, dirección o zona…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar centros de salud"
                />
                {search && (
                  <button
                    type="button"
                    className="public-search-clear-btn"
                    onClick={() => setSearch('')}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                  >
                    <i className="bi bi-x-circle-fill" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros rápidos por zona en píldoras estilizadas */}
            <div className="col-12 col-lg-6">
              <div className="public-zone-filters d-flex align-items-center gap-1.5 flex-wrap">
                <span className="public-filter-label text-muted fw-bold small me-1">Zona:</span>
                <button
                  type="button"
                  className={`public-filter-pill ${selectedZone === 'all' ? 'is-active' : ''}`}
                  onClick={() => setSelectedZone('all')}
                  aria-pressed={selectedZone === 'all'}
                >
                  Todas
                </button>
                {zones.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    className={`public-filter-pill ${selectedZone === zone ? 'is-active' : ''}`}
                    onClick={() => setSelectedZone(zone)}
                    aria-pressed={selectedZone === zone}
                  >
                    {formatZonaLabel(zone)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resultado de salitas */}
      {salitas.length > 0 && (
        <>
          {filteredSalitas.length === 0 ? (
            <div className="alert alert-warning text-center py-4 my-3" role="status">
              <i className="bi bi-exclamation-triangle fs-3 d-block mb-2 text-warning" aria-hidden="true" />
              <p className="mb-2 fw-semibold">
                No se encontraron salitas con los filtros seleccionados.
              </p>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                onClick={() => {
                  setSearch('');
                  setSelectedZone('all');
                }}
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <>
              {/* Presentación en escritorio / tablet (según selector de vista) */}
              <div className="d-none d-md-block">
                {viewMode === 'grid' ? (
                  <div className="row g-3 g-lg-4">
                    {filteredSalitas.map((salita) => (
                      <div key={salita.id_salita} className="col-md-6 col-lg-4">
                        <SalitaCard salita={salita} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <PublicCarousel
                    label="Centros de salud · Goya"
                    autoPlay
                    selectLabel="Elegí una salita"
                    slideLabels={filteredSalitas.map((salita) => salita.nombre)}
                    currentIndex={activeIndex}
                    onIndexChange={handleSalitaIndexChange}
                    slides={filteredSalitas.map((salita) => (
                      <div key={salita.id_salita} className="p-2">
                        <SalitaCard salita={salita} />
                      </div>
                    ))}
                  />
                )}
              </div>

              {/* Presentación en móviles: Visor individual con selector desplegable y controles completos */}
              <div className="d-md-none public-salitas-mobile-view">
                <PublicCarousel
                  label="Salita seleccionada"
                  autoPlay
                  selectLabel="Elegí una salita"
                  slideLabels={filteredSalitas.map((salita) => salita.nombre)}
                  currentIndex={activeIndex}
                  onIndexChange={handleSalitaIndexChange}
                  slides={filteredSalitas.map((salita) => (
                    <div key={salita.id_salita} className="w-100">
                      <SalitaCard salita={salita} />
                    </div>
                  ))}
                />
              </div>
            </>
          )}

          <div className="mt-4 p-3 bg-light rounded text-center small text-muted border">
            <i className="bi bi-info-circle text-success me-1.5" aria-hidden="true" />
            La salita que te corresponde se determina automáticamente al ingresar tu domicilio en tu perfil de paciente.
          </div>
        </>
      )}
    </section>
  );
}
