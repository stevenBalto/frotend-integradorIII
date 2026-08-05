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
import ApexCharts from 'apexcharts';

export interface ApexBarDatum {
  label: string;
  value: number;
}

/** Paleta de colores consistente con area-chart. */
const COLOR_ACCENT = '#E11D2E';
const COLOR_NEUTRAL = '#2E2E2C';

/**
 * Wrapper reutilizable de ApexCharts para barras verticales/horizontales.
 *
 * Caracteristicas visuales (imitando el area-chart de Tendencia de ventas):
 * - Grid punteado gris tenue
 * - Rojo #E13642 SOLO en el valor pico, resto en gris
 * - Gradiente sutil en las barras
 * - Tooltip oscuro flotante
 * - Tipografia Nunito
 * - Transiciones suaves
 */
@Component({
  selector: 'apex-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="abc-wrap" [style.height.px]="height">
      <div #chartEl class="abc-chart"></div>
    </div>
  `,
  styles: [`
    .abc-wrap {
      position: relative;
      width: 100%;
    }
    .abc-chart {
      width: 100%;
      height: 100%;
    }
    /* Forzar fondo transparente para integracion con admin-section-card */
    :host ::ng-deep .apexcharts-canvas {
      background: transparent !important;
    }
    :host ::ng-deep .apexcharts-inner {
      background: transparent;
    }
  `],
})
export class ApexBarChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: ApexBarDatum[] = [];
  @Input() height = 200;
  /** true = barras horizontales, false = verticales. */
  @Input() horizontal = false;
  /** Prefijo para el tooltip y eje (ej. "C$" para montos). */
  @Input() prefix = '';
  /** Sufijo para el tooltip y eje (ej. " pedidos"). */
  @Input() suffix = '';
  /** Si true, no resalta el pico en rojo (todas las barras en gris). */
  @Input() noHighlight = false;
  /** Colores personalizados por barra (opcional). Si se provee, sobreescribe la logica de pico. */
  @Input() colors: string[] = [];

  @ViewChild('chartEl', { static: true }) chartElRef!: ElementRef<HTMLDivElement>;

  private chart?: ApexCharts;

  ngAfterViewInit(): void {
    this.crearChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    const relevantChange = changes['data'] || changes['colors'] || changes['noHighlight'] || changes['horizontal'];
    if (relevantChange && this.chart) {
      this.chart.updateOptions(this.buildOptions(), true, true);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private crearChart(): void {
    const options = this.buildOptions();
    this.chart = new ApexCharts(this.chartElRef.nativeElement, options);
    this.chart.render();
  }

  private buildOptions(): ApexCharts.ApexOptions {
    const values = this.data.map((d) => d.value);
    const labels = this.data.map((d) => d.label);

    // Determinar colores
    const fillColors = this.buildColors(values);

    return {
      chart: {
        type: 'bar',
        height: this.height,
        background: 'transparent',
        fontFamily: 'var(--rooster-font-sans), Nunito, sans-serif',
        toolbar: { show: false },
        sparkline: { enabled: false },
        parentHeightOffset: 0,
        animations: {
          enabled: true,
          speed: 400,
          animateGradually: { enabled: true, delay: 50 },
          dynamicAnimation: { enabled: true, speed: 300 },
        },
      },
      series: [{ name: '', data: values }],
      colors: fillColors,
      plotOptions: {
        bar: {
          horizontal: this.horizontal,
          borderRadius: 5,
          borderRadiusApplication: 'end',
          // Barras mas gruesas para mayor densidad visual
          columnWidth: this.data.length <= 3 ? '55%' : this.data.length <= 6 ? '65%' : '75%',
          barHeight: this.data.length <= 3 ? '55%' : this.data.length <= 6 ? '65%' : '75%',
          distributed: true,
          dataLabels: {
            position: this.horizontal ? 'center' : 'top',
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          return `${this.prefix}${new Intl.NumberFormat('es-CR').format(val)}${this.suffix}`;
        },
        offsetY: this.horizontal ? 0 : -20,
        offsetX: this.horizontal ? 0 : 0,
        style: {
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--rooster-font-sans), Nunito, sans-serif',
          colors: ['#2E2E2C'],
        },
        dropShadow: { enabled: false },
      },
      grid: {
        borderColor: '#E5E7EB',
        strokeDashArray: 4,
        xaxis: { lines: { show: this.horizontal } },
        yaxis: { lines: { show: !this.horizontal } },
        padding: { left: 0, right: 0, top: 0, bottom: 0 },
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: '#2E2E2C',
            fontFamily: 'var(--rooster-font-sans), Nunito, sans-serif',
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: '#2E2E2C',
            fontFamily: 'var(--rooster-font-sans), Nunito, sans-serif',
          },
          formatter: (val: number) => {
            if (typeof val !== 'number') return '';
            // Forzar enteros en el eje Y (sin decimales como 0,5 pedidos)
            const rounded = Math.round(val);
            return `${this.prefix}${new Intl.NumberFormat('es-CR').format(rounded)}${this.suffix}`;
          },
        },
        // Forzar enteros: sin decimales en el eje Y
        decimalsInFloat: 0,
        tickAmount: undefined,
        forceNiceScale: true,
      },
      tooltip: {
        enabled: true,
        theme: 'dark' as const,
        style: {
          fontSize: '12px',
          fontFamily: 'var(--rooster-font-sans), Nunito, sans-serif',
        },
        y: {
          formatter: (val: number) => {
            return `${this.prefix}${new Intl.NumberFormat('es-CR').format(val)}${this.suffix}`;
          },
          title: {
            formatter: () => '',
          },
        },
      },
      fill: {
        type: 'solid',
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
          },
        },
        active: {
          filter: {
            type: 'darken',
          },
        },
      },
      legend: { show: false },
    };
  }

  private buildColors(values: number[]): string[] {
    if (this.colors.length === values.length) {
      return this.colors;
    }
    if (this.noHighlight) {
      return values.map(() => COLOR_NEUTRAL);
    }

    // Rojo solo para el valor maximo
    const maxVal = Math.max(...values);
    const maxIdx = values.indexOf(maxVal);

    return values.map((_, i) => (i === maxIdx ? COLOR_ACCENT : COLOR_NEUTRAL));
  }

  /** Aclara un color hex un cierto porcentaje. */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.round(255 * percent / 100));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * percent / 100));
    const b = Math.min(255, (num & 0xff) + Math.round(255 * percent / 100));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}
