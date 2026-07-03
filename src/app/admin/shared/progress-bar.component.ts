import { Component, Input } from '@angular/core';

/** Barra de progreso (productos más vendidos, cupones, etc.). */
@Component({
  selector: 'progress-bar',
  standalone: false,
  template: `
    <div class="pbar" [style.height.px]="height" [style.background]="track">
      <div
        class="pbar__fill"
        [style.width.%]="pct"
        [style.background]="fill"
      ></div>
    </div>
  `,
  styles: [`
    .pbar {
      width: 100%;
      border-radius: 9999px;
      overflow: hidden;
    }
    .pbar__fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.5s;
    }
  `],
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() color = '#E13642';
  @Input() height = 6;

  get pct(): number { return Math.min(100, (this.value / this.max) * 100); }
  get track(): string { return this.color + '1a'; }
  get fill(): string { return `linear-gradient(90deg, ${this.color} 0%, ${this.color}cc 100%)`; }
}
