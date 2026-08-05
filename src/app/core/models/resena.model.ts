/** Modelos del módulo de Reseñas (admin, cliente y público). */

export type ResenaTipo = 'general' | 'producto';
export type ResenaEstado = 'publicada' | 'oculta';

/** Reseña para el panel admin (gestión). */
export interface ResenaAdmin {
  id: number;
  tipo: ResenaTipo;
  /** Etiqueta humana del tipo ('Pedido' | 'Producto'); la resuelve el backend. */
  tipo_label?: string;
  calificacion: number;
  comentario: string | null;
  estado: ResenaEstado;
  oculta: boolean;
  pedido_id: number;
  producto: { id: number; nombre: string; imagen_url?: string | null } | null;
  cliente: { nombre: string; email: string } | null;
  respuesta_admin: string | null;
  created_at: string | null;
}

/** Promedio + total por producto (endpoint de stats admin). */
export interface ResenaStatProducto {
  producto_id: number;
  producto: string | null;
  total: number;
  promedio: number;
}

/** Resumen público de un producto: promedio, total y distribución 1..5. */
export interface ResumenProducto {
  promedio: number;
  total: number;
  distribucion: Record<string, number>;
}

/** Reseña pública (opiniones en la ficha del producto). */
export interface ResenaPublica {
  id: number;
  tipo: string;
  calificacion: number;
  comentario: string | null;
  cliente: string | null;
  respuesta_admin: string | null;
  created_at: string | null;
}

export interface ProductoResenas {
  resumen: ResumenProducto;
  opiniones: ResenaPublica[];
}

// ── Cliente (re-prompt tipo Uber) ──

export interface PendienteResenaProducto {
  producto_id: number;
  nombre: string;
  ya_resenado: boolean;
}

export interface PendienteResena {
  pedido_id: number;
  codigo: string;
  fecha: string | null;
  productos: PendienteResenaProducto[];
}

export interface EnviarResenaPayload {
  general?: { calificacion: number; comentario?: string | null };
  productos?: { producto_id: number; calificacion: number; comentario?: string | null }[];
}
