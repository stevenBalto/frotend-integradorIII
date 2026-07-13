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
}
