/**
 * Estados de pedido y sus etiquetas para mostrar en la UI.
 * Usado tanto en el panel admin como en la app cliente.
 */
export type PedidoEstado = 'pendiente' | 'en_proceso' | 'listo' | 'entregado' | 'cancelado';

export const PEDIDO_ESTADO_LABEL: Record<PedidoEstado, string> = {
  pendiente: 'Por comenzar',
  en_proceso: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/**
 * Maquina de estados de pedidos.
 * Define las transiciones validas desde cada estado.
 */
export const PEDIDO_TRANSICIONES: Record<PedidoEstado, PedidoEstado[]> = {
  pendiente: ['en_proceso', 'cancelado'],
  en_proceso: ['listo', 'cancelado'],
  listo: ['entregado', 'cancelado'],
  entregado: [], // terminal
  cancelado: [], // terminal
};

/** Verifica si una transicion de estado es valida. */
export function esTransicionValida(desde: PedidoEstado, hacia: PedidoEstado): boolean {
  return PEDIDO_TRANSICIONES[desde]?.includes(hacia) ?? false;
}
