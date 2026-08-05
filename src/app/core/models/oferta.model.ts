/** Producto asociado a una oferta (solo id y nombre). */
export interface OfertaProducto {
  id: number;
  nombre: string;
}

/** Oferta tal como la devuelve la API. */
export interface Oferta {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo_descuento: 'porcentaje' | 'precio_fijo';
  valor: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  productos: OfertaProducto[];
  productos_count: number;
  imagen_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Payload para crear/actualizar una oferta. */
export interface OfertaPayload {
  nombre: string;
  descripcion?: string | null;
  tipo_descuento: 'porcentaje' | 'precio_fijo';
  valor: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  activa?: boolean;
  producto_ids: number[];
  /** URL de imagen por defecto (del sistema). */
  imagen_url?: string | null;
}

/** Opciones de imagen para crear/actualizar oferta. */
export interface OfertaImagenOpts {
  /** Archivo subido por el usuario. */
  imagen?: File | null;
  /** URL de imagen por defecto (si no se sube archivo). */
  imagen_url?: string | null;
}
