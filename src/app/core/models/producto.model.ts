/** Tamano de producto (ej. Personal, Mediana, Familiar). */
export interface ProductoTamano {
  id: number;
  nombre: string;
  precio: number;
  orden: number;
  /** Detalle de cantidad opcional (ej. "12 slices", "500ml"). */
  descripcion: string | null;
}

/** Extra disponible para un producto (ej. Extra queso). */
export interface ExtraDisponible {
  id: number;
  nombre: string;
  precio: number;
  /** Foto del extra para el upsell en el modal de detalle (null si no tiene). */
  imagen_url: string | null;
}

export interface Producto {
  id: number;
  categoria_id: number;
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagen_url: string | null;
  destacado: boolean;
  popular: boolean;
  nuevo: boolean;
  disponible: boolean;
  created_at: string | null;
  updated_at: string | null;
  /** Tamanos disponibles (vacio si no aplica a este producto). */
  tamanos: ProductoTamano[];
  /** Extras disponibles (vacio si no aplica a este producto). */
  extras: ExtraDisponible[];
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

/** Payload para crear/editar un tamano (sin id). */
export interface TamanoPayload {
  nombre: string;
  precio: number;
  descripcion?: string | null;
}

export interface ProductoPayload {
  categoria_id: number;
  nombre: string;
  descripcion?: string | null;
  precio_base: number;
  destacado?: boolean;
  popular?: boolean;
  nuevo?: boolean;
  disponible?: boolean;
  /** Tamanos a guardar (se reemplazan todos). */
  tamanos?: TamanoPayload[];
}

export interface ApiCollection<T> {
  data: T[];
}

export interface ApiResource<T> {
  data: T;
}
