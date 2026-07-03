import { Component, Input, OnChanges } from '@angular/core';

interface Bar { h: number; c: string; }
interface MiniBarVM extends Bar { isMax: boolean; }

/** Mini gráfico de barras con líneas guía (componente reutilizable del prototipo). */
@Component({
  selector: 'mini-bar',
  standalone: false,
  template: `
    <div class="mini">
      <div class="mini__chart" [style.height.px]="height">
        <div class="mini__grid" *ngFor="let g of grid" [style.bottom.%]="g"></div>
        <div class="mini__col" *ngFor="let b of vm">
          <span class="mini__badge" *ngIf="b.isMax" [style.background]="b.c">{{ b.h }}</span>
          <div class="mini__bar" [style.height.%]="b.h" [style.background]="barBg(b.c)"></div>
        </div>
      </div>
      <div class="mini__days" *ngIf="days?.length">
        <span *ngFor="let d of days">{{ d }}</span>
      </div>
    </div>
  `,
  styles: [`
    .mini { font-family: var(--rooster-font-sans); }
    .mini__chart {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      position: relative;
    }
    .mini__grid {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px dashed var(--admin-border);
      opacity: 0.6;
    }
    .mini__col {
      flex: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
    }
    .mini__badge {
      margin-bottom: 4px;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 700;
      color: #fff;
    }
    .mini__bar {
      width: 100%;
      border-radius: 6px 6px 0 0;
      min-height: 4px;
      transition: opacity 0.3s;
    }
    .mini__days {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .mini__days span {
      flex: 1;
      text-align: center;
      font-size: 9px;
      font-weight: 600;
      color: var(--admin-text-muted);
    }
  `],
})
export class MiniBarComponent implements OnChanges {
  @Input() bars: Bar[] = [];
  @Input() days?: string[];
  @Input() height = 100;

  vm: MiniBarVM[] = [];
  readonly grid = [25, 50, 75];

  ngOnChanges(): void {
    const max = Math.max(...this.bars.map(b => b.h), 0);
    this.vm = this.bars.map(b => ({ ...b, isMax: b.h === max }));
  }

  barBg(c: string): string {
    return `linear-gradient(180deg, ${c} 0%, ${c}cc 100%)`;
  }
}
