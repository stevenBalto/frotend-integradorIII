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
  Plugin,
} from 'chart.js';
import { pluralizePedido } from './analiticas.tokens';

Chart.register(BarController, BarElement, CategoryScale, LinearScale);

export interface PeakHourDatum {
  label: string;
  value: number;
}

// Colores de barras escalonados por rango
const COLOR_TOP_1 = '#C41230';   // Rojo intenso (barra lider)
const COLOR_TOP_2 = '#CE4257';   // Rojo medio (segunda barra)
const COLOR_NEUTRAL = '#2E2E2C'; // Negro-gris, igual al resto de graficos del modulo

// Tooltip fijo
const TOOLTIP_BG = '#2D3748';
const TOOLTIP_TEXT = '#FFFFFF';

// Labels del eje X
const LABEL_COLOR_NORMAL = '#A0AEC0';
const LABEL_COLOR_ACTIVE = '#1A1A1A';

/**
 * Plugin de Chart.js que dibuja un tooltip fijo sobre la barra lider.
 * No es un tooltip de hover, es una etiqueta permanente.
 */
const fixedTooltipPlugin: Plugin<'bar'> = {
  id: 'fixedTooltip',
  afterDatasetsDraw(chart) {
    const data = chart.data.datasets[0]?.data as number[];
    if (!data || data.length === 0) return;

    // Encontrar el indice de la barra lider (valor maximo)
    const maxVal = Math.max(...data);
    const leaderIndex = data.indexOf(maxVal);
    if (leaderIndex < 0 || maxVal === 0) return;

    const meta = chart.getDatasetMeta(0);
    const bar = meta.data[leaderIndex];
    if (!bar) return;

    const ctx = chart.ctx;
    const x = bar.x;
    const y = bar.y;

    // Texto del tooltip (valor redondeado + unidad, ej: "85 pedidos")
    const roundedVal = Math.round(maxVal);
    const text = `${roundedVal} ${pluralizePedido(roundedVal)}`;
    ctx.save();

    // Configurar fuente para medir texto. Canvas NO resuelve var() de CSS: con una
    // fuente invalida measureText mide con la fuente por defecto (10px) y la caja
    // queda mas angosta que el texto, recortandolo.
    ctx.font = '600 13px Nunito, system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;

    // Dimensiones del tooltip
    const paddingH = 10;
    const boxWidth = textWidth + paddingH * 2;
    const boxHeight = 22;
    const arrowSize = 6;
    const gap = 8;

    // La caja se mantiene dentro del area del grafico: si la barra lider es la
    // primera (o la ultima), centrarla la sacaria del canvas y el numero se
    // cortaria. La flecha sigue apuntando a la barra.
    const { left, right } = chart.chartArea;
    const boxX = Math.min(Math.max(x - boxWidth / 2, left), Math.max(left, right - boxWidth));
    const boxY = y - gap - boxHeight - arrowSize;
    const arrowX = Math.min(Math.max(x, boxX + arrowSize + 2), boxX + boxWidth - arrowSize - 2);

    // Dibujar fondo del tooltip con bordes redondeados
    ctx.fillStyle = TOOLTIP_BG;
    ctx.beginPath();
    const radius = 6;
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
    ctx.lineTo(boxX + radius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fill();

    // Dibujar flecha triangular hacia abajo
    ctx.beginPath();
    ctx.moveTo(arrowX - arrowSize, boxY + boxHeight);
    ctx.lineTo(arrowX, boxY + boxHeight + arrowSize);
    ctx.lineTo(arrowX + arrowSize, boxY + boxHeight);
    ctx.closePath();
    ctx.fill();

    // Dibujar texto
    ctx.fillStyle = TOOLTIP_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2);

    ctx.restore();
  },
};

// OJO: este plugin NO se registra global (`Chart.register`). Un plugin global corre
// en TODOS los charts de la app y dibujaba la viñeta "N pedidos" tambien sobre el
// donut de Modalidad de pedido. Se pasa solo a este chart via `plugins: [...]`.

/**
 * Grafico de barras verticales para Horas pico.
 * Implementado con Chart.js nativo (no ApexCharts).
 *
 * Caracteristicas:
 * - Sin ejes ni grid
 * - Colores escalonados: rojo intenso para la barra lider, rojo medio para la segunda, gris para el resto
 * - Tooltip fijo sobre la barra lider (no hover)
 * - Labels del eje X con formato corto de hora ("8a", "12p", etc.)
 */
@Component({
  selector: 'peak-hours-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="phc-container">
      <canvas #canvas></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      min-height: 0;
    }
    .phc-container {
      flex: 1;
      min-height: 240px;
      position: relative;
    }
    .phc-container canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `],
})
export class PeakHoursChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  /**
   * Datos de horas pico.
   * Formato esperado: { label: "8a", value: 85 }
   * Las labels ya vienen en formato corto desde analiticas.page.ts
   */
  @Input() data: PeakHourDatum[] = [];

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart<'bar'>;
  private leaderIndex = -1;

  ngAfterViewInit(): void {
    this.calcularLeaderIndex();
    this.crearChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.calcularLeaderIndex();
      if (this.chart) {
        this.chart.data = this.buildChartData();
        Object.assign(this.chart.options ?? {}, this.buildOptions());
        this.chart.update();
      }
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private calcularLeaderIndex(): void {
    if (!this.data || this.data.length === 0) {
      this.leaderIndex = -1;
      return;
    }
    const values = this.data.map((d) => d.value);
    const maxVal = Math.max(...values);
    this.leaderIndex = values.indexOf(maxVal);
  }

  private crearChart(): void {
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: this.buildChartData(),
      options: this.buildOptions(),
      plugins: [fixedTooltipPlugin],
    });
  }

  private buildChartData(): ChartConfiguration<'bar'>['data'] {
    const labels = this.data.map((d) => d.label);
    const values = this.data.map((d) => d.value);
    const backgroundColors = this.buildBarColors(values);

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: backgroundColors,
        borderRadius: 3,
        barPercentage: 0.55,
        categoryPercentage: 0.8,
      }],
    };
  }

  /**
   * Genera colores escalonados por rango:
   * - Barra con valor MAS ALTO: #C41230 (rojo intenso)
   * - Barra con 2do valor mas alto: #CE4257 (rojo medio)
   * - Resto: #F2F5FB (gris-azul casi blanco)
   */
  private buildBarColors(values: number[]): string[] {
    if (values.length === 0) return [];

    // Crear copia ordenada de valores con sus indices originales
    const indexed = values.map((val, idx) => ({ val, idx }));
    const sorted = [...indexed].sort((a, b) => b.val - a.val);

    const top1Idx = sorted[0]?.idx ?? -1;
    const top2Idx = sorted.length > 1 ? sorted[1]?.idx ?? -1 : -1;

    return values.map((_, idx) => {
      if (idx === top1Idx) return COLOR_TOP_1;
      if (idx === top2Idx) return COLOR_TOP_2;
      return COLOR_NEUTRAL;
    });
  }

  private buildOptions(): ChartConfiguration<'bar'>['options'] {
    const leaderIdx = this.leaderIndex;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: {
        padding: {
          top: 40, // Espacio para el tooltip fijo
        },
      },
      scales: {
        y: {
          display: true,
          position: 'right',
          beginAtZero: true,
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            color: LABEL_COLOR_NORMAL,
            font: {
              size: 11,
              family: 'var(--rooster-font-sans), Nunito, sans-serif',
            },
            precision: 0,
            callback: (value) => Math.round(Number(value)),
          },
        },
        x: {
          grid: {
            display: false,
          },
          border: {
            display: false,
          },
          ticks: {
            // Fuerza las labels siempre horizontales: sin esto Chart.js las
            // rota automaticamente cuando hay mas horas de las que caben,
            // haciendo que la tipografia se vea distinta entre semanas/meses.
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            color: (context) => {
              return context.index === leaderIdx ? LABEL_COLOR_ACTIVE : LABEL_COLOR_NORMAL;
            },
            font: (context) => {
              return {
                size: 12,
                weight: context.index === leaderIdx ? 700 : 400,
                family: 'var(--rooster-font-sans), Nunito, sans-serif',
              };
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false, // Deshabilitamos el tooltip de hover
        },
      },
    };
  }
}
