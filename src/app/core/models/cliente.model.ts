export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  puntos_balance: number;
  activo: boolean;
  total_gastado: number;
  cantidad_pedidos: number;
  ticket_promedio: number;
  ultimo_pedido_en: string | null;
}

export interface PedidoResumen {
  id: number;
  total: number;
  estado: string;
  modalidad: string;
  created_at: string | null;
}
