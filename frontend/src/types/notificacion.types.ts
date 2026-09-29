// ========================================
// NOTIFICACIÓN
// ========================================

// Representa una notificación visible
// para el usuario dentro del sistema.
export interface Notificacion {
  // Identificador único de la notificación.
  id_notificacion: string;

  // Turno relacionado con la notificación,
  // si corresponde.
  id_turno: string | null;

  // Tipo de evento que generó la notificación.
  tipo: string;

  // Título mostrado al usuario.
  titulo: string;

  // Contenido principal de la notificación.
  mensaje: string;

  // Fecha y hora en que fue creada.
  fecha_creacion: string;

  // Indica si el usuario ya la leyó.
  leida: boolean;
}


// ========================================
// RESPUESTA DE NOTIFICACIONES
// ========================================

// Estructura paginada devuelta por la API
// al consultar las notificaciones.
export interface NotificacionesResponse {
  // Notificaciones de la página actual.
  notificaciones: Notificacion[];

  // Cantidad total de notificaciones.
  total: number;

  // Cantidad total de páginas.
  totalPages: number;

  // Página actualmente consultada.
  page: number;
}