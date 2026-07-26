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

export interface SalesBarDatum {
  label: string;
  value: number;
}

/** Rojo de acento del panel admin. Reservado solo para el dato pico, regla 70-20-10. */
const COLOR_PICO = '#e13642';
/** Gris neutral del esquema 70-20-10 para el resto de las barras. */
const COLOR_NEUTRAL = '#6b728033';

/**
 * Grafico de barras verticales generico (Chart.js).
 * Usado para "Ventas por dia" y "Horas pico".
 * El valor maximo (pico) se resalta en rojo, el resto en gris.
 */
@Component({
  selector: 'sales-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sbc-wrap" [style.height.px]="height">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel"></canvas>
    </div>
  `,
  styles: [`
    .sbc-wrap { position: relative; width: 100%; }
    canvas { width: 100% !important; height: 100% !important; }
  `],
})
export class SalesBarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: SalesBarDatum[] = [];
  @Input() height = 150;
  /** Prefijo para el tooltip (ej. "₡" para montos, "" para cantidades). */
  @Input() prefix = '';
  /** Sufijo para el tooltip (ej. " pedidos"). */
  @Input() suffix = '';

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'bar'>;

  get ariaLabel(): string {
    if (this.data.length === 0) return 'Grafico de barras: sin datos.';
    const max = Math.max(...this.data.map((d) => d.value));
    const pico = this.data.find((d) => d.value === max);
    return `Grafico de barras con ${this.data.length} valores. Pico: ${pico?.label ?? '?'} con ${this.prefix}${max}${this.suffix}.`;
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
    const max = Math.max(...this.data.map((d) => d.value), 0);
    return {
      labels: this.data.map((d) => d.label),
      datasets: [
        {
          data: this.data.map((d) => d.value),
          backgroundColor: this.data.map((d) => (d.value === max && max > 0 ? COLOR_PICO : COLOR_NEUTRAL)),
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  }

  private buildOptions(): ChartConfiguration<'bar'>['options'] {
    const prefix = this.prefix;
    const suffix = this.suffix;
    return {
      responsive: true,
      maintainAspectRatio: false,
      // Ionic anima la transicion de pagina y el ResizeObserver de Chart.js reacciona
      // a esos cambios de tamano transitorios reiniciando la animacion → se ve "bugeada".
      animation: false,
      resizeDelay: 200,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `${prefix}${new Intl.NumberFormat('es-CR').format(item.parsed.y ?? 0)}${suffix}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${prefix}${this.formatCorto(Number(value))}${suffix}`,
          },
        },
      },
    };
  }

  /** Formato abreviado: 1.2k, 1.5M. */
  private formatCorto(valor: number): string {
    if (valor >= 1_000_000) {
      return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 }).format(valor / 1_000_000) + 'M';
    }
    if (valor >= 1_000) {
      return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 1 }).format(valor / 1_000) + 'k';
    }
    return new Intl.NumberFormat('es-CR').format(valor);
  }
}
