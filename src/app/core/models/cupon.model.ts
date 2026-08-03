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
}

/** Opciones de imagen para crear/actualizar cupon. */
export interface CuponImagenOpts {
  /** Archivo subido por el usuario. */
  imagen?: File | null;
  /** URL de imagen por defecto (si no se sube archivo). */
  imagen_url?: string | null;
}
