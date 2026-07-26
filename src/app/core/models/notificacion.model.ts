/**
 * Notificacion de admin (bandeja + tiempo real por polling).
 * Espeja el NotificacionResource del backend.
 */
export interface Notificacion {
  id: number;
  tipo: string; // 'pedido_nuevo' (extensible)
  pedido_id: number | null;
  titulo: string;
  mensaje: string;
  data: NotificacionData | null;
  leida: boolean;
  leida_en: string | null;
  created_at: string | null;
}

/** Payload extra que viaja en `data` (varia segun `tipo`). */
export interface NotificacionData {
  codigo?: string;
  nombre_cliente?: string;
  estado_inicial?: string;
  modalidad?: string;
  [key: string]: unknown;
}

/** Respuesta del index: lista + contador de no leidas (para badge/toasts). */
export interface NotificacionesRespuesta {
  data: Notificacion[];
  meta: { no_leidas: number };
}
