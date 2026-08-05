import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ArcElement,
  Chart,
  ChartConfiguration,
  DoughnutController,
} from 'chart.js';
import {
  COLOR_MODALIDAD_LIDER,
  COLOR_MODALIDAD_SECUNDARIA,
} from './analiticas.tokens';
import { PluralizePipe } from './pluralize.pipe';

// Sin Tooltip: el donut no muestra viñeta al pasar el mouse (la leyenda ya da
// cantidad y porcentaje de ambas modalidades, así que era información repetida).
Chart.register(DoughnutController, ArcElement);

export interface ModalityItem {
  modalidad: string;
  cantidad: number;
  pct: number;
}

interface LegendRow {
  label: string;
  cantidad: number;
  pct: string;
  color: string;
  isLeader: boolean;
  isZero: boolean;
}

/**
 * Modalidad de pedido — versión compacta.
 * Donut pequeño (96px) con leyenda horizontal.
 * Muestra SIEMPRE ambas modalidades aunque una tenga 0.
 */
@Component({
  selector: 'modality-compact',
  standalone: true,
  imports: [CommonModule, PluralizePipe],
  template: `
    <div class="mc-container">
      <div class="mc-donut-wrap">
        <canvas #canvas></canvas>
        <div class="mc-center">
          <span class="mc-pct">{{ leaderPct }}%</span>
          <span class="mc-count">{{ totalPedidos }} {{ totalPedidos | pluralize }}</span>
        </div>
      </div>

      <div class="mc-legend">
        <div
          class="mc-legend-row"
          *ngFor="let row of legendRows; let last = last"
          [class.mc-legend-row--last]="last"
          [class.mc-legend-row--zero]="row.isZero">
          <span class="mc-color" [style.background]="row.color"></span>
          <span class="mc-label">{{ row.label }}</span>
          <span class="mc-cantidad">{{ row.cantidad }}</span>
          <span class="mc-row-pct" [style.color]="row.isLeader ? row.color : '#5F5E5A'">{{ row.pct }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mc-container {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .mc-donut-wrap {
      position: relative;
      width: 96px;
      height: 96px;
      flex-shrink: 0;
    }
    .mc-donut-wrap canvas {
      width: 100% !important;
      height: 100% !important;
    }
    .mc-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
      width: 64px;
    }
    .mc-pct {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #E11D2E;
      line-height: 1.1;
    }
    .mc-count {
      display: block;
      font-size: 10px;
      color: #76756F;
      line-height: 1.2;
    }
    .mc-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .mc-legend-row {
      display: grid;
      grid-template-columns: 14px 1fr auto auto;
      align-items: center;
      gap: 8px;
      padding: 10px 0;
      border-bottom: 0.5px solid #E5E5E0;
    }
    .mc-legend-row--last {
      border-bottom: none;
    }
    .mc-legend-row--zero {
      opacity: 0.5;
    }
    .mc-color {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
    .mc-label {
      font-size: 13px;
      color: #2E2E2C;
    }
    .mc-cantidad {
      font-size: 13px;
      color: #5F5E5A;
      font-variant-numeric: tabular-nums;
    }
    .mc-row-pct {
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      min-width: 36px;
      text-align: right;
    }

    @media (max-width: 400px) {
      .mc-container {
        flex-direction: column;
        gap: 16px;
      }
    }
  `],
})
export class ModalityCompactComponent implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * Datos de modalidad del backend.
   * Puede venir incompleto (solo una modalidad) — el componente rellena con 0 la que falte.
   */
  @Input() data: ModalityItem[] = [];

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'doughnut'>;

  legendRows: LegendRow[] = [];
  leaderPct = 0;
  totalPedidos = 0;

  // Las dos modalidades que SIEMPRE deben aparecer
  private readonly MODALIDADES_FIJAS = ['Comer aquí', 'Para llevar'];

  ngAfterViewInit(): void {
    this.buildLegend();
    this.crearChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.buildLegend();
      if (this.chart) {
        this.chart.data = this.buildChartData();
        this.chart.update();
      }
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private buildLegend(): void {
    // Normalizar y garantizar que ambas modalidades existan
    const normalized = this.normalizeData();

    this.totalPedidos = normalized.reduce((sum, m) => sum + m.cantidad, 0);
    const maxPct = Math.max(...normalized.map((m) => m.pct), 0);
    this.leaderPct = Math.round(maxPct);

    this.legendRows = normalized.map((m) => {
      const isLeader = m.pct === maxPct && maxPct > 0;
      return {
        label: m.modalidad,
        cantidad: m.cantidad,
        pct: `${Math.round(m.pct)}%`,
        color: isLeader ? COLOR_MODALIDAD_LIDER : COLOR_MODALIDAD_SECUNDARIA,
        isLeader,
        isZero: m.cantidad === 0,
      };
    });
  }

  /**
   * Garantiza que siempre estén las dos modalidades fijas.
   * Rellena con 0 la que falte, sin inventar datos.
   */
  private normalizeData(): ModalityItem[] {
    const result: ModalityItem[] = [];

    for (const nombre of this.MODALIDADES_FIJAS) {
      const existing = this.data.find((m) => m.modalidad === nombre);
      if (existing) {
        result.push(existing);
      } else {
        result.push({ modalidad: nombre, cantidad: 0, pct: 0 });
      }
    }

    return result;
  }

  private crearChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: this.buildChartData(),
      options: this.buildOptions(),
    });
  }

  private buildChartData(): ChartConfiguration<'doughnut'>['data'] {
    const normalized = this.normalizeData();
    const maxPct = Math.max(...normalized.map((m) => m.pct), 0);

    // Si todos tienen 0, mostrar un anillo gris vacío
    const allZero = normalized.every((m) => m.cantidad === 0);
    if (allZero) {
      return {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E5E0'],
          borderWidth: 0,
        }],
      };
    }

    return {
      labels: normalized.map((m) => m.modalidad),
      datasets: [{
        data: normalized.map((m) => m.cantidad),
        backgroundColor: normalized.map((m) =>
          m.pct === maxPct && maxPct > 0 ? COLOR_MODALIDAD_LIDER : COLOR_MODALIDAD_SECUNDARIA
        ),
        borderWidth: 0,
      }],
    };
  }

  private buildOptions(): ChartConfiguration<'doughnut'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%', // Centro de 64px aprox en donut de 96px
      animation: false,
      resizeDelay: 200,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
    };
  }
}
