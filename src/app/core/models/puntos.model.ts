/** Un movimiento de Roosters. `puntos` positivo = ganado, negativo = canjeado. */
export interface MovimientoRooster {
  id: number;
  tipo: string;
  puntos: number;
  descripcion: string | null;
  pedido_codigo: string | null;
  creado_en: string;
}

/** Resumen de Roosters del cliente (GET /puntos/mios). */
export interface RoostersResumen {
  balance: number;
  total_ganado: number;
  total_canjeado: number;
  movimientos: MovimientoRooster[];
}
