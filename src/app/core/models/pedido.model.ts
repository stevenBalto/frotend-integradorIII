import { PedidoEstado } from '../../shared/constants/pedido-estado';

/** Extra incluido en un item de pedido (ya confirmado). */
export interface ExtraPedido {
  nombre: string;
  precio: number;
}

/** Item de un pedido (ya confirmado). */
export interface ItemPedido {
  producto_nombre: string;
  cantidad: number;
  tamano_nombre: string | null;
  precio_unitario: number;
  subtotal: number;
  extras: ExtraPedido[];
}

/** Sucursal resumida en el pedido. */
export interface SucursalPedido {
  id: number;
  nombre: string;
}

/** Pedido base (cliente). */
export interface Pedido {
  id: number;
  codigo: string;
  modalidad: 'para_llevar' | 'comer_aqui';
  estado: PedidoEstado;
  subtotal: number;
  descuento: number;
  total: number;
  puntos_ganados: number;
  notas: string | null;
  /** "A nombre de quien" escrito en el checkout (puede diferir del nombre de la cuenta). */
  nombre_cliente: string | null;
  created_at: string;
  sucursal: SucursalPedido;
  items: ItemPedido[];
}

/** Cliente resumido (admin). */
export interface ClientePedido {
  id: number;
  nombre: string;
}

/** Entrada del historial de estados de un pedido. */
export interface HistorialEstado {
  estado: PedidoEstado;
  comentario: string | null;
  creado_en: string;
}

/** Pedido extendido para admin. */
export interface PedidoAdmin extends Pedido {
  cliente: ClientePedido;
  pagado: boolean;
  pagado_en: string | null;
  historial: HistorialEstado[];
}

/** Respuesta publica (buscar por codigo, sin auth). */
export interface PedidoPublico {
  codigo: string;
  estado: PedidoEstado;
  modalidad: 'para_llevar' | 'comer_aqui';
  sucursal: string;
  creado_en: string;
}

// ── Payloads para crear pedidos ──

/** Item a enviar al crear un pedido. */
export interface ItemPedidoPayload {
  producto_id: number;
  cantidad: number;
  producto_tamano_id?: number;
  extra_ids?: number[];
  notas?: string;
}

/** Body para POST /pedidos. */
export interface CrearPedidoPayload {
  sucursal_id: number;
  modalidad: 'para_llevar' | 'comer_aqui';
  nombre_cliente: string;
  notas?: string;
  items: ItemPedidoPayload[];
}

/** Body para POST /admin/pedidos/{id}/estado. */
export interface CambiarEstadoPayload {
  estado: PedidoEstado;
  comentario?: string;
}

/** Filtros para listar pedidos admin. */
export interface FiltrosPedidoAdmin {
  estado?: PedidoEstado | null;
  modalidad?: 'para_llevar' | 'comer_aqui' | null;
  q?: string;
}
