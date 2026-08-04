/** Granularidad del filtro de analíticas. */
export type Granularidad = 'mes' | 'semana' | 'dia' | 'rango';

/** Respuesta del endpoint GET /admin/analiticas?granularidad=mes|semana|dia&mes=YYYY-MM&fecha=YYYY-MM-DD */
export interface AnaliticasResponse {
  ventas_mes: number;
  pedidos_mes: number;
  ticket_promedio: number;
  ventas_por_dia: VentaDia[];
  horas_pico: HoraPico[];
  top_productos: TopProductoApi[];
  modalidad: ModalidadApi[];
  comparacion_periodo_anterior: ComparacionMesAnterior;
  ventas_por_categoria: VentaCategoria[];
  /** Metadatos de caché (30 min) para el contador de próxima actualización. */
  generado_en?: string | null;
  expira_en?: string | null;
  ttl_minutos?: number;
}

/** ventas_pct/pedidos_pct: null cuando el periodo anterior no tuvo ventas/pedidos. ventas_mes_anterior/pedidos_mes_anterior son siempre numéricos (0 si no hubo datos). */
export interface ComparacionMesAnterior {
  ventas_pct: number | null;
  pedidos_pct: number | null;
  ventas_mes_anterior: number;
  pedidos_mes_anterior: number;
}

export interface VentaCategoria {
  categoria: string;
  total: number;
}

export interface VentaDia {
  fecha: string;
  total: number;
}

export interface HoraPico {
  hora: string;
  cantidad: number;
}

export interface TopProductoApi {
  nombre: string;
  unidades: number;
}

export interface ModalidadApi {
  modalidad: string;
  cantidad: number;
  pct: number;
}
