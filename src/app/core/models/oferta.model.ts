/** Producto asociado a una oferta (solo id y nombre). */
export interface OfertaProducto {
  id: number;
  nombre: string;
}

/** Cliente asignado a una oferta especifica (solo id y nombre). */
export interface OfertaCliente {
  id: number;
  nombre: string;
}

/** Sede donde se puede canjear una oferta especifica (solo id y nombre). */
export interface OfertaSucursal {
  id: number;
  nombre: string;
}

/** Alcance de visibilidad: 'todos' los clientes, o solo los 'especifico'-camente asignados. */
export type AlcanceOferta = 'todos' | 'especifico';

/** Alcance por sede: canjeable en 'todas' o solo en sedes 'especifica'-mente elegidas. */
export type AlcanceSedesOferta = 'todas' | 'especifica';

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
  alcance: AlcanceOferta;
  clientes?: OfertaCliente[];
  alcance_sedes: AlcanceSedesOferta;
  sucursales?: OfertaSucursal[];
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
  alcance: AlcanceOferta;
  cliente_ids: number[];
  alcance_sedes: AlcanceSedesOferta;
  sucursal_ids: number[];
}

/** Opciones de imagen para crear/actualizar oferta. */
export interface OfertaImagenOpts {
  /** Archivo subido por el usuario. */
  imagen?: File | null;
  /** URL de imagen por defecto (si no se sube archivo). */
  imagen_url?: string | null;
}
