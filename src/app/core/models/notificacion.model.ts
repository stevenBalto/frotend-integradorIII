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

/** Destino de navegación al abrir una notificación. */
export interface RutaNotificacion {
  path: string[];
  extras: { queryParams?: Record<string, string> };
}

/** A qué sección lleva cada tipo de notificación (compartido por pantalla, toast y campana). */
export function rutaDeNotificacion(n: Notificacion): RutaNotificacion | null {
  switch (n.tipo) {
    case 'pedido_nuevo':
      return {
        path: ['/admin/pedidos'],
        extras: { queryParams: n.data?.codigo ? { codigo: String(n.data.codigo) } : {} },
      };
    case 'resena_nueva':   return { path: ['/admin/resenas'], extras: {} };
    case 'stock_bajo':     return { path: ['/admin/inventario'], extras: {} };
    case 'producto_nuevo': return { path: ['/admin/menu'], extras: {} };
    case 'cliente_nuevo':  return { path: ['/admin/clientes'], extras: {} };
    case 'usuario_nuevo':  return { path: ['/admin/usuarios'], extras: {} };
    default:               return null;
  }
}

/** Ícono (ionicon) según el tipo de notificación. */
export function iconoDeNotificacion(tipo: string): string {
  switch (tipo) {
    case 'pedido_nuevo':   return 'clipboard-outline';
    case 'resena_nueva':   return 'star-outline';
    case 'stock_bajo':     return 'alert-circle-outline';
    case 'producto_nuevo': return 'fast-food-outline';
    case 'cliente_nuevo':  return 'person-add-outline';
    case 'usuario_nuevo':  return 'shield-checkmark-outline';
    default:               return 'notifications-outline';
  }
}
