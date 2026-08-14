export interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_actual: number;
  stock_minimo: number | null;
  bajo_stock: boolean;
  tiene_movimientos: boolean;
  /** El inventario es exclusivo de cada sede (no se comparte como productos/ofertas/cupones). */
  sucursal_id: number;
  sucursal_nombre?: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface InsumoPayload {
  nombre: string;
  unidad_medida: string;
  /** Solo se usa al CREAR (cantidad inicial); en edicion normal no se manda/edita. */
  cantidad_actual?: number;
  stock_minimo?: number | null;
  /** Solo obligatorio al CREAR si quien lo hace es un admin general (sin sede propia);
   *  a un admin_sede el backend se lo ignora y fuerza la suya. */
  sucursal_id?: number;
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
