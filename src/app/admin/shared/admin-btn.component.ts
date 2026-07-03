import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Botón primario / outline del panel admin. Contenido proyectado (icono + texto). */
@Component({
  selector: 'admin-btn',
  standalone: false,
  template: `
    <button
      type="button"
      class="admin-btn"
      [class.admin-btn--outline]="outline"
      [class.admin-btn--small]="small"
      (click)="clicked.emit()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .admin-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 12px;
      font-family: var(--rooster-font-sans);
      padding: 9px 16px;
      border: none;
      background: var(--admin-accent);
      color: #fff;
      cursor: pointer;
      transition: transform 0.1s;
    }
    .admin-btn:active { transform: scale(0.95); }
    .admin-btn ion-icon { font-size: 14px; }
    .admin-btn--outline {
      background: var(--admin-card);
      color: var(--admin-text);
      border: 1px solid var(--admin-border);
    }
    .admin-btn--small { padding: 6px 14px; font-size: 11px; }
    .admin-btn--small ion-icon { font-size: 13px; }
  `],
})
export class AdminBtnComponent {
  @Input() outline = false;
  @Input() small = false;
  @Output() clicked = new EventEmitter<void>();
}
