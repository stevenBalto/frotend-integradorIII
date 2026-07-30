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
  Tooltip,
} from 'chart.js';

Chart.register(DoughnutController, ArcElement, Tooltip);

export interface ModalityDatum {
  modalidad: string;
  cantidad: number;
  pct: number;
}

/** Rojo de acento del panel admin. Reservado solo para el segmento principal (mayor pct). */
const COLOR_PICO = '#e13642';
/** Gris neutral para el resto de segmentos. */
const COLOR_NEUTRAL = '#374151';

/**
 * Grafico de dona (doughnut) para modalidad de pedido.
 * El segmento con mayor porcentaje se resalta en rojo.
 */
@Component({
  selector: 'modality-donut-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mdc-wrap" [style.width.px]="size" [style.height.px]="size">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel"></canvas>
      <div class="mdc-center" *ngIf="centerLabel">
        <span class="mdc-pct">{{ centerPct }}%</span>
        <span class="mdc-label">{{ centerLabel }}</span>
      </div>
    </div>
  `,
  styles: [`
    .mdc-wrap {
      position: relative;
      width: 140px;
      height: 140px;
    }
    canvas { width: 100% !important; height: 100% !important; }
    .mdc-center {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      pointer-events: none;
    }
    .mdc-pct {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #e13642;
    }
    .mdc-label {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }
  `],
})
export class ModalityDonutChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ModalityDatum[] = [];
  /** Diametro del donut en px (por defecto 140). */
  @Input() size = 140;

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'doughnut'>;

  /** El segmento con mayor porcentaje se muestra en el centro. */
  get centerLabel(): string {
    if (this.data.length === 0) return '';
    const max = this.data.reduce((a, b) => (b.pct > a.pct ? b : a), this.data[0]);
    return max.modalidad;
  }

  get centerPct(): number {
    if (this.data.length === 0) return 0;
    const max = this.data.reduce((a, b) => (b.pct > a.pct ? b : a), this.data[0]);
    return Math.round(max.pct);
  }

  get ariaLabel(): string {
    if (this.data.length === 0) return 'Grafico de modalidad: sin datos.';
    const detalle = this.data.map((d) => `${d.modalidad} ${d.pct}%`).join(', ');
    return `Modalidad de pedido: ${detalle}.`;
  }

  ngAfterViewInit(): void {
    this.crearChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) {
      this.chart.data = this.buildData();
      this.chart.update();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private crearChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: this.buildData(),
      options: this.buildOptions(),
    });
  }

  private buildData(): ChartConfiguration<'doughnut'>['data'] {
    const maxPct = Math.max(...this.data.map((d) => d.pct), 0);
    return {
      labels: this.data.map((d) => d.modalidad),
      datasets: [
        {
          data: this.data.map((d) => d.cantidad),
          backgroundColor: this.data.map((d) => (d.pct === maxPct && maxPct > 0 ? COLOR_PICO : COLOR_NEUTRAL)),
          borderWidth: 0,
        },
      ],
    };
  }

  private buildOptions(): ChartConfiguration<'doughnut'>['options'] {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      // Ionic anima la transicion de pagina y el ResizeObserver de Chart.js reacciona
      // a esos cambios de tamano transitorios reiniciando la animacion → se ve "bugeada".
      animation: false,
      resizeDelay: 200,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => {
              const datum = this.data[item.dataIndex];
              return `${datum.modalidad}: ${datum.cantidad} pedidos (${datum.pct}%)`;
            },
          },
        },
      },
    };
  }
}
