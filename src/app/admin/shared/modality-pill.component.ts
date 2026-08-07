import { Component, Input } from '@angular/core';
import { MODALIDAD_LABEL } from '../../shared/constants/modalidad';

/** Pastilla de modalidad de pedido: "Comer en el restaurante" / "Para llevar". */
@Component({
  selector: 'modality-pill',
  standalone: false,
  template: `
    <span class="pill" [style.color]="color">
      <ion-icon class="pill__icon" [name]="icon"></ion-icon>
      {{ label }}
    </span>
  `,
  styles: [`
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 9999px;
      background: var(--admin-neutral1);
      font-size: 9px;
      padding: 3px 9px;
      font-weight: 600;
      font-family: var(--rooster-font-sans);
      white-space: nowrap;
    }
    .pill__icon { font-size: 11px; }
  `],
})
export class ModalityPillComponent {
  @Input() mode = 'aqui';
  get isHere(): boolean { return this.mode === 'aqui'; }
  get label(): string {
    return this.isHere ? MODALIDAD_LABEL['comer_aqui'] : MODALIDAD_LABEL['para_llevar'];
  }
  /** Mismo ícono que la perspectiva del cliente: restaurante para "aquí", bolsa para "llevar". */
  get icon(): string { return this.isHere ? 'restaurant-outline' : 'bag-handle-outline'; }
  /** neutral4 para "aquí", neutral3 para "llevar". */
  get color(): string { return this.isHere ? '#374151' : '#6B7280'; }
}
