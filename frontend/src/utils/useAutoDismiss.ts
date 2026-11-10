import { useEffect } from 'react';

/** Tiempo predeterminado antes de ocultar automáticamente mensajes transitorios del módulo profesional. */
export const PROFESSIONAL_MESSAGE_TIMEOUT_MS = 15_000;

/** Limpia automáticamente un mensaje después de `delayMs` cuando `value` tiene contenido y `enabled` está activo. */
export function useAutoDismiss(
  value: string,
  clear: (empty: '') => void,
  delayMs: number = PROFESSIONAL_MESSAGE_TIMEOUT_MS,
  enabled: boolean = true,
): void {
  useEffect(() => {
    if (!enabled || !value) {
      return;
    }

    const timer = window.setTimeout(() => {
      clear('');
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, clear, delayMs, enabled]);
}
