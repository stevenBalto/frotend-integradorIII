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
}
