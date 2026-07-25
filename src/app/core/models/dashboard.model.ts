import { PedidoEstado } from '../../shared/constants/pedido-estado';
import { Modalidad } from '../../shared/constants/modalidad';

export interface VentaDia {
  dia: string;
  fecha: string;
  total: number;
}

export interface PedidoNuevo {
  id: number;
  codigo: string;
  cliente: string;
  modalidad: Modalidad;
  total: number;
  created_at: string;
}

export interface UltimoPedido {
  id: number;
  codigo: string;
  cliente: string;
  modalidad: Modalidad;
  cantidad: number;
  total: number;
  estado: PedidoEstado;
  created_at: string;
}

/** Respuesta de GET /admin/dashboard. */
export interface DashboardResumen {
  pedidos_hoy: number;
  pedidos_hoy_variacion: number | null;
  ventas_hoy: number;
  ventas_hoy_variacion: number | null;
  ticket_promedio: number;
  pedidos_activos: number;
  ventas_semana: VentaDia[];
  pedidos_nuevos: PedidoNuevo[];
  ultimos_pedidos: UltimoPedido[];
}
