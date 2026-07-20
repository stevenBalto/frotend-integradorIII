import { Component, Input } from '@angular/core';
import { MODALIDAD_LABEL } from '../../shared/constants/modalidad';

/** Pastilla de modalidad de pedido: "Comer en el restaurante" / "Para llevar". */
@Component({
  selector: 'modality-pill',
  standalone: false,
  template: `
    <span class="pill" [style.color]="color">
      <span class="pill__dot" [style.background]="color"></span>
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
    .pill__dot { width: 6px; height: 6px; border-radius: 50%; }
  `],
})
export class ModalityPillComponent {
  @Input() mode = 'aqui';
  get isHere(): boolean { return this.mode === 'aqui'; }
  get label(): string {
    return this.isHere ? MODALIDAD_LABEL['comer_aqui'] : MODALIDAD_LABEL['para_llevar'];
  }
  /** neutral4 para "aquí", neutral3 para "llevar". */
  get color(): string { return this.isHere ? '#374151' : '#6B7280'; }
}
