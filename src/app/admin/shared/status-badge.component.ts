import { Component, Input, OnChanges } from '@angular/core';
import { PedidoEstado, PEDIDO_ESTADO_LABEL } from '../../shared/constants/pedido-estado';

type StatusType =
  | 'completed' | 'process' | 'cancelled'
  | 'active' | 'inactive' | 'expired' | 'cooking'
  | 'stock_bajo' | 'stock_ok'
  | 'pendiente' | 'en_proceso' | 'listo' | 'entregado';

interface StatusStyle { bg: string; dot: string; c: string; label: string; }

/**
 * Convierte un estado de pedido (PedidoEstado) a StatusType para el badge.
 * 'cancelado' se mapea a 'cancelled' (ya existe con label "Cancelado").
 */
export function estadoToStatusType(estado: PedidoEstado): StatusType {
  if (estado === 'cancelado') {
    return 'cancelled';
  }
  return estado as StatusType;
}

/** Badge de estado con punto de color (mismos estados del prototipo). */
@Component({
  selector: 'status-badge',
  standalone: false,
  template: `
    <span class="badge" [style.background]="style.bg" [style.color]="style.c">
      <span class="badge__dot" [style.background]="style.dot"></span>
      {{ style.label }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 9999px;
      font-weight: 600;
      white-space: nowrap;
      font-size: 9px;
      padding: 3px 9px;
      font-family: var(--rooster-font-sans);
    }
    .badge__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  `],
})
export class StatusBadgeComponent implements OnChanges {
  @Input() type: StatusType = 'active';
  style: StatusStyle = StatusBadgeComponent.MAP.active;

  private static readonly MAP: Record<StatusType, StatusStyle> = {
    completed: { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: 'Completado' },
    process:   { bg: '#FEF3C7', dot: '#F59E0B', c: '#92400E', label: 'En proceso' },
    cancelled: { bg: '#FEE2E2', dot: '#DC2626', c: '#991B1B', label: PEDIDO_ESTADO_LABEL.cancelado },
    active:    { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: 'Activo' },
    inactive:  { bg: '#F3F4F6', dot: '#6B7280', c: '#374151', label: 'Inactivo' },
    expired:   { bg: '#F3F4F6', dot: '#6B7280', c: '#374151', label: 'Vencida' },
    cooking:   { bg: '#FEF3C7', dot: '#F59E0B', c: '#92400E', label: 'En cocina' },
    stock_bajo: { bg: '#FEE2E2', dot: '#DC2626', c: '#991B1B', label: 'Bajo stock' },
    stock_ok:   { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: 'Stock normal' },
    // Estados de pedido (usan las etiquetas compartidas)
    pendiente:  { bg: '#F3F4F6', dot: '#6B7280', c: '#374151', label: PEDIDO_ESTADO_LABEL.pendiente },
    en_proceso: { bg: '#FEF3C7', dot: '#F59E0B', c: '#92400E', label: PEDIDO_ESTADO_LABEL.en_proceso },
    listo:      { bg: '#DBEAFE', dot: '#3B82F6', c: '#1D4ED8', label: PEDIDO_ESTADO_LABEL.listo },
    entregado:  { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: PEDIDO_ESTADO_LABEL.entregado },
  };

  ngOnChanges(): void {
    this.style = StatusBadgeComponent.MAP[this.type] ?? StatusBadgeComponent.MAP.active;
  }
}
