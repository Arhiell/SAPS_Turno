// Formatea y normaliza la etiqueta de zona para el portal público de CORA,
// evitando duplicaciones como «Zona Zona Sur» en tarjetas y filtros.
export function formatZonaLabel(zona?: string | null): string {
  if (!zona || !zona.trim()) return 'Centro de Salud';
  const clean = zona.trim();
  if (/^zona\s+/i.test(clean)) {
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return `Zona ${clean}`;
}

// Identifica publicaciones de desarrollo o prueba para excluirlas del portal público institucional.
export function isDevelopmentTestNews(news: { titulo?: string; resumen?: string }): boolean {
  const text = `${news.titulo ?? ''} ${news.resumen ?? ''}`.toLowerCase();
  return /prueba\s*(i+|[0-9]+)?\b|noticia\s*de\s*prueba|^test\b/i.test(text);
}

// Determina el índice de la salita seleccionada al filtrar o buscar.
// Si la salita seleccionada previamente sigue disponible en el resultado filtrado, preserva su selección.
// Si deja de pertenecer al resultado, se ajusta automáticamente al primer elemento disponible (índice 0).
export function resolveActiveSalitaIndex(
  items: Array<{ id_salita: string }>,
  selectedId: string | null | undefined
): number {
  if (!items || items.length === 0) return 0;
  if (!selectedId) return 0;
  const index = items.findIndex((item) => item.id_salita === selectedId);
  return index >= 0 ? index : 0;
}
