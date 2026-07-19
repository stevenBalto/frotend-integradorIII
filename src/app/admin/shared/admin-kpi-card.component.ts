import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Tarjeta KPI del panel admin (label + valor + subtexto opcional + icono). Opcionalmente clickeable (filtro). */
@Component({
  selector: 'admin-kpi-card',
  standalone: false,
  template: `
    <div class="kpi" [class.kpi--clickable]="clickable" [class.kpi--active]="active" (click)="onClick()">
      <div
        class="kpi__icon"
        *ngIf="icon"
        [style.background]="iconBg || 'rgba(107,114,128,0.08)'"
      >
        <ion-icon [name]="icon" [style.color]="iconColor || '#6B7280'"></ion-icon>
      </div>
      <p class="kpi__label">{{ label }}</p>
      <p class="kpi__value" [class.kpi__value--accent]="accent">{{ value }}</p>
      <p class="kpi__sub" *ngIf="sub" [style.color]="subColor || '#6B7280'">{{ sub }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .kpi {
      box-sizing: border-box;
      height: 100%;
      background: var(--admin-card);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      padding: 16px;
      transition: box-shadow 0.2s, border-color 0.2s;
      font-family: var(--rooster-font-sans);
    }
    .kpi:hover { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06); }
    .kpi--clickable { cursor: pointer; }
    .kpi--active { border-color: var(--admin-accent); box-shadow: 0 0 0 1px var(--admin-accent); }
    .kpi__icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .kpi__icon ion-icon { font-size: 16px; }
    .kpi__label {
      font-size: 11px;
      color: var(--admin-text-muted);
      font-weight: 500;
      margin: 0;
    }
    .kpi__value {
      font-size: 22px;
      font-weight: 700;
      color: var(--admin-text);
      margin: 4px 0 0;
    }
    .kpi__value--accent { color: var(--admin-accent); }
    .kpi__sub {
      font-size: 10px;
      font-weight: 500;
      margin: 4px 0 0;
    }
  `],
})
export class AdminKpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() sub?: string;
  @Input() subColor?: string;
  /** Nombre de ion-icon (ej: 'clipboard-outline'). */
  @Input() icon?: string;
  @Input() iconBg?: string;
  @Input() iconColor?: string;
  @Input() accent = false;
  /** Si es true, se muestra como clickeable (cursor pointer) y emite (cardClick). */
  @Input() clickable = false;
  /** Resalta la tarjeta como filtro activo (borde de acento). */
  @Input() active = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}
