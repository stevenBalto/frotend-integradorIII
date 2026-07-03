import { Component, Input } from '@angular/core';

/** Donut con porcentaje central (conic-gradient), igual que el prototipo. */
@Component({
  selector: 'donut-chart',
  standalone: false,
  template: `
    <div class="donut" [style.width.px]="size" [style.height.px]="size" [style.boxShadow]="outerShadow" [style.background]="ring">
      <div class="donut__hole" [style.width.px]="inner" [style.height.px]="inner">
        <span class="donut__pct" [style.color]="primary">{{ pct }}%</span>
        <span class="donut__label">{{ label }}</span>
      </div>
    </div>
  `,
  styles: [`
    .donut {
      position: relative;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--rooster-font-sans);
      flex-shrink: 0;
    }
    .donut__hole {
      border-radius: 50%;
      background: var(--admin-card);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 0 1px var(--admin-border);
    }
    .donut__pct { font-size: 18px; font-weight: 800; line-height: 1; }
    .donut__label {
      font-size: 8px;
      color: var(--admin-text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `],
})
export class DonutChartComponent {
  @Input() pct = 0;
  @Input() label = '';
  @Input() size = 110;
  @Input() primary = '#E13642';
  @Input() secondary = '#9CA3AF';

  get inner(): number { return this.size - 36; }
  get ring(): string {
    return `conic-gradient(${this.primary} 0% ${this.pct}%, ${this.secondary}55 ${this.pct}% 100%)`;
  }
  get outerShadow(): string { return `0 4px 12px ${this.primary}22`; }
}
