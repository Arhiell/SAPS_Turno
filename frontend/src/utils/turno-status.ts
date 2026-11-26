// Comparte los colores existentes en todas las vistas de turnos.
export const getEstadoClass = (estado: string) => {
  const variants: Record<string, string> = {
    CONFIRMADO: 'confirmado',
    SOLICITADO: 'solicitado',
    EN_ESPERA: 'espera',
    ATENDIDO: 'atendido',
    CANCELADO: 'cancelado',
    NO_ASISTIO: 'no-asistio',
    REPROGRAMADO: 'reprogramado',
  };
  return `turno-badge${variants[estado] ? ` turno-badge-${variants[estado]}` : ''}`;
};

// Referencia visible de seis caracteres; el código interno se conserva completo.
export const formatShortRef = (idOrCode?: string | null): string => {
  return (idOrCode || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
};
