import { Component, Input, OnChanges } from '@angular/core';

type StatusType =
  | 'completed' | 'process' | 'cancelled'
  | 'active' | 'inactive' | 'expired' | 'cooking'
  | 'stock_bajo' | 'stock_ok';

interface StatusStyle { bg: string; dot: string; c: string; label: string; }

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
    cancelled: { bg: '#FEE2E2', dot: '#DC2626', c: '#991B1B', label: 'Cancelado' },
    active:    { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: 'Activo' },
    inactive:  { bg: '#F3F4F6', dot: '#6B7280', c: '#374151', label: 'Inactivo' },
    expired:   { bg: '#F3F4F6', dot: '#6B7280', c: '#374151', label: 'Vencida' },
    cooking:   { bg: '#FEF3C7', dot: '#F59E0B', c: '#92400E', label: 'En cocina' },
    stock_bajo: { bg: '#FEE2E2', dot: '#DC2626', c: '#991B1B', label: 'Bajo stock' },
    stock_ok:   { bg: '#DCFCE7', dot: '#16A34A', c: '#15803D', label: 'Stock normal' },
  };

  ngOnChanges(): void {
    this.style = StatusBadgeComponent.MAP[this.type] ?? StatusBadgeComponent.MAP.active;
  }
}
