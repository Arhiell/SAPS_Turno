import axios from 'axios';

export const authError = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> | { message: string }[] }>(error)) {
    const body = error.response?.data;
    if (body?.errors) {
      const messages = Array.isArray(body.errors) ? body.errors.map(item => item.message) : Object.values(body.errors).flat();
      if (messages.length) return messages.join('. ');
    }
    return body?.message ?? 'No pudimos conectar con el servidor. Volvé a intentar.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
};
export const passwordError = (password: string, confirmation: string) => {
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  if (password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Usá entre 8 y 128 caracteres, con mayúscula, minúscula, número y símbolo.';
  }
  return '';
};
