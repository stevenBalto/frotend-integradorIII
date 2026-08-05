import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getRankingColor, formatCRC } from './analiticas.tokens';

export interface RankingItem {
  label: string;
  value: number;
}

interface RankingRow {
  label: string;
  formattedValue: string;
  /** Texto auxiliar del tooltip (monto exacto cuando se muestra el porcentaje). */
  hint: string;
  barWidth: number;
  color: string;
}

/**
 * Lista de ranking HTML/CSS pura (sin gráficos externos).
 * Cada fila: etiqueta a la izquierda, valor a la derecha y barra de progreso debajo
 * ocupando todo el ancho. El líder va en rojo de marca; el resto en grises neutros.
 */
@Component({
  selector: 'ranking-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rl">
      <div class="rl-row" *ngFor="let row of rows">
        <div class="rl-head">
          <span class="rl-label" [title]="row.hint || row.label">{{ row.label }}</span>
          <span class="rl-value" [style.color]="row.color">{{ row.formattedValue }}</span>
        </div>
        <div class="rl-track">
          <div class="rl-bar" [style.width.%]="row.barWidth" [style.background]="row.color"></div>
        </div>
      </div>
      <p *ngIf="rows.length === 0" class="rl-empty">Sin datos.</p>
    </div>
  `,
  styles: [`
    .rl {
      display: flex;
      flex-direction: column;
      gap: 18px;
      font-variant-numeric: tabular-nums;
    }
    .rl-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .rl-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .rl-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--admin-text, #2E2E2C);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rl-value {
      flex: none;
      font-size: 13px;
      font-weight: 700;
    }
    .rl-track {
      height: 8px;
      background: #F1F1EE;
      border-radius: 999px;
      overflow: hidden;
    }
    .rl-bar {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .rl-empty {
      text-align: center;
      font-size: 13px;
      color: var(--admin-text-muted, #76756F);
      padding: 24px 16px;
      margin: 0;
    }

    @media (max-width: 480px) {
      .rl { gap: 14px; }
      .rl-label,
      .rl-value { font-size: 12px; }
    }
  `],
})
export class RankingListComponent implements OnChanges {
  /** Datos del ranking: array de { label, value }. */
  @Input() items: RankingItem[] = [];
  /** Prefijo para el valor formateado. */
  @Input() prefix = '';
  /** Sufijo para el valor formateado (ej: " uds"). */
  @Input() suffix = '';
  /** Si true, formatea el valor como moneda CRC. */
  @Input() isCurrency = false;
  /**
   * Si true, muestra el peso porcentual sobre el total en vez del valor crudo.
   * El monto exacto queda disponible en el tooltip de la etiqueta.
   */
  @Input() asPercent = false;

  rows: RankingRow[] = [];

  ngOnChanges(): void {
    this.buildRows();
  }

  private buildRows(): void {
    if (!this.items || this.items.length === 0) {
      this.rows = [];
      return;
    }

    const maxValue = Math.max(...this.items.map((item) => item.value), 1);
    const total = this.items.reduce((acc, item) => acc + item.value, 0);

    this.rows = this.items.map((item, index) => {
      const color = getRankingColor(index);
      const pct = total > 0 ? (item.value / total) * 100 : 0;

      return {
        label: item.label,
        formattedValue: this.asPercent ? `${Math.round(pct)}%` : this.formatValor(item.value),
        // Con porcentajes el monto exacto se pierde de vista: queda en el tooltip.
        hint: this.asPercent ? `${item.label}: ${this.formatValor(item.value)}` : '',
        // La barra siempre es relativa al líder, para que el primero llene mejor el track.
        barWidth: (item.value / maxValue) * 100,
        color,
      };
    });
  }

  private formatValor(valor: number): string {
    if (this.isCurrency) {
      return formatCRC(valor);
    }
    return `${this.prefix}${new Intl.NumberFormat('es-CR').format(valor)}${this.suffix}`;
  }
}
