/** Cliente asignado a un cupon especifico (solo id y nombre). */
export interface CuponCliente {
  id: number;
  nombre: string;
}

/** Sede donde se puede canjear un cupon especifico (solo id y nombre). */
export interface CuponSucursal {
  id: number;
  nombre: string;
}

/** Alcance de visibilidad: 'todos' los clientes, o solo los 'especifico'-camente asignados. */
export type AlcanceCupon = 'todos' | 'especifico';

/** Alcance por sede: canjeable en 'todas' o solo en sedes 'especifica'-mente elegidas. */
export type AlcanceSedesCupon = 'todas' | 'especifica';

/** Cupon tal como lo devuelve la API. */
export interface Cupon {
  id: number;
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  monto_minimo: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  usos_max: number | null;
  usos_actuales: number;
  activo: boolean;
  imagen_url: string | null;
  alcance: AlcanceCupon;
  clientes?: CuponCliente[];
  alcance_sedes: AlcanceSedesCupon;
  sucursales?: CuponSucursal[];
  created_at: string | null;
  updated_at: string | null;
}

/** Payload para crear/actualizar un cupon. */
export interface CuponPayload {
  codigo: string;
  tipo: 'porcentaje' | 'monto_fijo';
  valor: number;
  monto_minimo?: number | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  usos_max?: number | null;
  activo?: boolean;
  /** URL de imagen por defecto (del sistema). */
  imagen_url?: string | null;
  alcance: AlcanceCupon;
  cliente_ids: number[];
  alcance_sedes: AlcanceSedesCupon;
  sucursal_ids: number[];
}

/** Opciones de imagen para crear/actualizar cupon. */
export interface CuponImagenOpts {
  /** Archivo subido por el usuario. */
  imagen?: File | null;
  /** URL de imagen por defecto (si no se sube archivo). */
  imagen_url?: string | null;
}
