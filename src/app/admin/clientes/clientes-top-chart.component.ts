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
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  LinearScale,
  Tooltip,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export interface ClienteTopChartDatum {
  nombre: string;
  totalGastado: number;
}

/** Rojo de acento del panel admin (var(--admin-accent) / var(--rooster-red)). Reservado, per ReglasUX, solo para el dato pico de un gráfico. */
const COLOR_PICO = '#e13642';
/** Gris neutral del esquema 70-20-10 para el resto de las barras. */
const COLOR_NEUTRAL = '#6b728033';

/**
 * Ranking horizontal (Chart.js) del top clientes por gasto total.
 * El input `data` debe venir ya ordenado desc (no se reordena acá).
 */
@Component({
  selector: 'clientes-top-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ctc-wrap" [style.height.px]="alturaPx">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel"></canvas>
    </div>
  `,
  styles: [`
    .ctc-wrap { position: relative; width: 100%; }
    canvas { width: 100% !important; height: 100% !important; }
  `],
})
export class ClientesTopChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ClienteTopChartDatum[] = [];
  @Input() alturaPx = 220;

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'bar'>;

  get ariaLabel(): string {
    if (this.data.length === 0) return 'Top clientes por gasto total: sin datos.';
    const detalle = this.data.map((d) => `${d.nombre}, ${this.formatCorto(d.totalGastado)}`).join('; ');
    return `Top ${this.data.length} clientes por gasto total: ${detalle}.`;
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
      type: 'bar',
      data: this.buildData(),
      options: this.buildOptions(),
    });
  }

  private buildData(): ChartConfiguration<'bar'>['data'] {
    return {
      labels: this.data.map((d) => d.nombre),
      datasets: [
        {
          data: this.data.map((d) => d.totalGastado),
          backgroundColor: this.data.map((_, i) => (i === 0 ? COLOR_PICO : COLOR_NEUTRAL)),
          borderRadius: { topRight: 6, bottomRight: 6, topLeft: 0, bottomLeft: 0 },
          borderSkipped: false,
          barThickness: 22,
        },
      ],
    };
  }

  private buildOptions(): ChartConfiguration<'bar'>['options'] {
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      // Ionic anima la transición de página y el ResizeObserver de Chart.js reacciona
      // a esos cambios de tamaño transitorios reiniciando la animación → se ve "bugeada".
      animation: false,
      resizeDelay: 200,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => this.formatCorto(item.parsed.x as number),
          },
        },
      },
      scales: {
        x: {
          ticks: { callback: (value) => this.formatCorto(Number(value)) },
        },
        y: {
          grid: { display: false },
        },
      },
    };
  }

  /** Colones abreviados: ₡184k, ₡1.2M. */
  private formatCorto(valor: number): string {
    if (valor >= 1_000_000) {
      return `₡${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 }).format(valor / 1_000_000)}M`;
    }
    if (valor >= 1_000) {
      return `₡${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 }).format(valor / 1_000)}k`;
    }
    return `₡${new Intl.NumberFormat('es-CR').format(valor)}`;
  }
}
