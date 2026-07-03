import { Component, Input, OnChanges } from '@angular/core';

interface BarDatum { day: string; val: number; }
interface BarVM extends BarDatum { pct: number; isMax: boolean; gridPct: number; }

/** Gráfico de barras vertical con eje Y y líneas guía (pedidos/ventas por día). */
@Component({
  selector: 'bar-chart',
  standalone: false,
  template: `
    <div class="bc">
      <!-- Eje Y -->
      <div class="bc__yaxis" [style.height.px]="height">
        <span *ngFor="let s of steps">{{ s }}</span>
      </div>

      <!-- Cuerpo -->
      <div class="bc__body">
        <div class="bc__bars" [style.height.px]="barH">
          <div class="bc__grid" *ngFor="let g of gridLines" [style.bottom.%]="g"></div>
          <div class="bc__col" *ngFor="let b of vm">
            <span class="bc__badge" *ngIf="b.isMax">{{ b.val }}</span>
            <span class="bc__tip" *ngIf="!b.isMax" [style.bottom]="'calc(' + b.pct + '% + 6px)'">{{ b.val }}</span>
            <div
              class="bc__bar"
              [style.height.%]="b.pct"
              [style.background]="b.isMax ? 'var(--admin-accent)' : 'var(--admin-neutral1)'"
            ></div>
          </div>
        </div>
        <div class="bc__days">
          <span *ngFor="let b of vm">{{ b.day }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bc { display: flex; gap: 8px; font-family: var(--rooster-font-sans); }
    .bc__yaxis {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-between;
      padding-bottom: 22px;
      min-width: 20px;
    }
    .bc__yaxis span { font-size: 8px; color: var(--admin-text-soft); line-height: 1; }
    .bc__body { flex: 1; display: flex; flex-direction: column; }
    .bc__bars {
      position: relative;
      display: flex;
      align-items: flex-end;
      gap: 6px;
    }
    .bc__grid {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px dashed var(--admin-border);
      pointer-events: none;
    }
    .bc__col {
      position: relative;
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .bc__badge {
      margin-bottom: 4px;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
      background: var(--admin-accent);
    }
    .bc__tip {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
      background: var(--admin-text);
      white-space: nowrap;
    }
    .bc__col:hover .bc__tip { opacity: 1; }
    .bc__bar {
      width: 100%;
      border-radius: 4px 4px 0 0;
      min-height: 4px;
      transition: opacity 0.15s;
    }
    .bc__col:hover .bc__bar { opacity: 0.75; }
    .bc__days { display: flex; gap: 6px; margin-top: 6px; }
    .bc__days span {
      flex: 1;
      text-align: center;
      font-size: 9px;
      font-weight: 600;
      color: var(--admin-text-muted);
    }
  `],
})
export class BarChartComponent implements OnChanges {
  @Input() data: BarDatum[] = [];
  @Input() height = 140;

  vm: BarVM[] = [];
  steps: number[] = [];
  gridLines: number[] = [];
  barH = 118;

  ngOnChanges(): void {
    const maxVal = Math.max(...this.data.map(d => d.val), 0);
    const yTop = Math.ceil(maxVal / 10) * 10 || 10;
    this.steps = [0, yTop * 0.25, yTop * 0.5, yTop * 0.75, yTop].map(Math.round);
    this.gridLines = this.steps.slice(1).map(s => (s / yTop) * 100);
    this.barH = this.height - 22;
    this.vm = this.data.map(d => ({
      ...d,
      pct: (d.val / yTop) * 100,
      isMax: d.val === maxVal,
      gridPct: (d.val / yTop) * 100,
    }));
  }
}
