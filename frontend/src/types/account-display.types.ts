// Datos públicos de la cuenta para paneles administrativos; sin credenciales.
export interface AccountDisplay {
  id_usuario: string;
  nombre_usuario: string;
  email: string;
  email_verificado: boolean;
  activo: boolean;
  rol: { codigo: string };
}
