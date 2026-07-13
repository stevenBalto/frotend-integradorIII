export interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_actual: number;
  stock_minimo: number | null;
  bajo_stock: boolean;
  tiene_movimientos: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface InsumoPayload {
  nombre: string;
  unidad_medida: string;
  /** Solo se usa al CREAR (cantidad inicial); en edicion normal no se manda/edita. */
  cantidad_actual?: number;
  stock_minimo?: number | null;
}

export interface InsumoMovimiento {
  id: number;
  tipo: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  diferencia: number;
  nota: string | null;
  usuario?: { id: number; nombre: string } | null;
  created_at: string | null;
}

export interface TomaFisicaPayload {
  cantidad_contada: number;
  nota?: string;
}

export interface TomaFisicaResultado {
  insumo: Insumo;
  movimiento: InsumoMovimiento;
}
