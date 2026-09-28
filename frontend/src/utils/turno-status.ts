// Comparte los colores existentes en todas las vistas de turnos.
export const getEstadoClass = (estado: string) => {
  const variants: Record<string, string> = {
    CONFIRMADO: 'confirmado', SOLICITADO: 'solicitado', EN_ESPERA: 'espera',
    ATENDIDO: 'atendido', CANCELADO: 'cancelado', NO_ASISTIO: 'no-asistio', REPROGRAMADO: 'reprogramado',
  };
  return `turno-badge${variants[estado] ? ` turno-badge-${variants[estado]}` : ''}`;
};
