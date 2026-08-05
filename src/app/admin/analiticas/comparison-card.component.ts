import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import {
  COLOR_ACTUAL,
  COLOR_ANTERIOR,
  BADGE_UP,
  BADGE_DOWN,
  formatCRC,
  formatPctES,
  pluralizePedido,
} from './analiticas.tokens';

/** Alineación de las etiquetas del marcador cuando queda cerca de un borde. */
type MarkerAlign = 'start' | 'center' | 'end';

/**
 * Formato del comparativo:
 * - `marker`: barra con marcador (bullet chart). La barra roja es lo logrado y la
 *   línea negra marca el período anterior como meta implícita.
 * - `bars`: dos barras horizontales apiladas (anterior arriba, actual abajo).
 */
export type ComparisonVariant = 'marker' | 'bars';

/**
 * Tarjeta de comparativo (período actual vs anterior) — HTML/CSS puro.
 * KPI grande + badge de variación + el cuerpo que indique `variant`.
 */
@Component({
  selector: 'comparison-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="cc-card" [class.cc-card--bars]="variant === 'bars'">
      <p class="cc-label">{{ label }}</p>

      <div class="cc-header">
        <span class="cc-value">{{ formattedValue }}</span>
        <span class="cc-badge" [style.background]="badgeBg" [style.color]="badgeColor">
          <ion-icon *ngIf="variant === 'bars' && badgeIcon" [name]="badgeIcon"></ion-icon>
          {{ badgeText }}
        </span>
      </div>

      <!-- Variante barra con marcador -->
      <ng-container *ngIf="variant === 'marker'">
        <div class="cc-meter">
          <!-- Marcador del período anterior (meta implícita). -->
          <div class="cc-marker"
               *ngIf="showMarker"
               [class.cc-marker--start]="markerAlign === 'start'"
               [class.cc-marker--end]="markerAlign === 'end'"
               [style.left.%]="markerPct">
            <span class="cc-marker__label">{{ prevLabel }}</span>
            <span class="cc-marker__line"></span>
            <span class="cc-marker__value">{{ formattedPrev }}</span>
          </div>

          <div class="cc-track">
            <div class="cc-fill" [style.width.%]="currentPct" [style.background]="colorActual">
              <span class="cc-fill__value" *ngIf="valueInsideBar">{{ formattedCurrent }}</span>
            </div>
          </div>
        </div>

        <p class="cc-hint">{{ hintText }}</p>
      </ng-container>

      <!-- Variante dos barras apiladas -->
      <div class="cc-bars" *ngIf="variant === 'bars'">
        <div class="cc-bar-row">
          <span class="cc-bar-label">{{ prevLabel }}</span>
          <div class="cc-bar-track">
            <div class="cc-bar" [style.width.%]="prevBarWidth" [style.background]="colorAnterior"></div>
          </div>
          <span class="cc-bar-value">{{ formattedPrev }}</span>
        </div>
        <div class="cc-bar-row">
          <span class="cc-bar-label">Actual</span>
          <div class="cc-bar-track">
            <div class="cc-bar" [style.width.%]="currentBarWidth" [style.background]="colorActual"></div>
          </div>
          <span class="cc-bar-value">{{ formattedCurrent }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* El host llena la celda del grid y la tarjeta hereda ese alto, para que dos
       comparativos lado a lado cierren al mismo nivel aunque su contenido difiera
       (la variante con marcador es más alta que la de dos barras). */
    :host {
      display: block;
      height: 100%;
    }
    .cc-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 1rem 1.25rem;
      background: #fff;
      border: 0.5px solid #E5E5E0;
      border-radius: 12px;
    }
    .cc-card--bars { gap: 14px; }
    .cc-label {
      margin: 0;
      font-size: 13px;
      color: #76756F;
    }
    .cc-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .cc-value {
      font-size: 30px;
      font-weight: 600;
      color: #2E2E2C;
      font-variant-numeric: tabular-nums;
      line-height: 1.1;
    }
    .cc-card--bars .cc-value {
      font-size: 26px;
      font-weight: 500;
    }
    .cc-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;

      ion-icon { font-size: 12px; }
    }
    .cc-card--bars .cc-badge { font-weight: 500; }

    /* -- Variante barra con marcador -----------------------------------------
       Alturas fijas para que la línea del marcador y el track queden alineados:
       etiqueta 0-14, línea 18-66, track 26-58, valor 68-82. La línea sobresale
       del track arriba y abajo a propósito, para que se lea como marcador.
       ---------------------------------------------------------------------- */
    .cc-meter {
      position: relative;
      height: 84px;
    }
    .cc-track {
      position: absolute;
      top: 26px;
      left: 0;
      right: 0;
      height: 32px;
      background: #F1F1EE;
      border-radius: 6px;
      /* Debajo del marcador: si no, el track tapa la línea a lo largo de la barra. */
      z-index: 1;
    }
    .cc-fill {
      height: 100%;
      border-radius: 6px;
      display: flex;
      align-items: center;
      transition: width 0.3s ease;
    }
    .cc-fill__value {
      padding-left: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .cc-marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 0;
      /* Por encima del track y de la barra, para que la línea se vea entera. */
      z-index: 2;
      /* El marcador se centra en su posición; cerca de los bordes se recuesta
         hacia adentro para que las etiquetas no se salgan de la tarjeta. */
      --cc-marker-shift: -50%;
    }
    .cc-marker--start { --cc-marker-shift: 0%; }
    .cc-marker--end { --cc-marker-shift: -100%; }

    .cc-marker__line {
      position: absolute;
      top: 18px;
      left: -1.5px;
      width: 3px;
      height: 48px;
      background: #000;
      border-radius: 1px;
    }
    .cc-marker__label,
    .cc-marker__value {
      position: absolute;
      white-space: nowrap;
      transform: translateX(var(--cc-marker-shift));
      font-variant-numeric: tabular-nums;
    }
    .cc-marker__label {
      top: 0;
      font-size: 11px;
      font-weight: 700;
      color: #2E2E2C;
    }
    .cc-marker__value {
      top: 68px;
      font-size: 11px;
      color: #76756F;
    }

    .cc-hint {
      margin: 0;
      font-size: 11px;
      color: #A0A09A;
      line-height: 1.5;
    }

    /* -- Variante dos barras apiladas ---------------------------------------- */
    .cc-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .cc-bar-row {
      display: grid;
      grid-template-columns: 90px 1fr 80px;
      align-items: center;
      gap: 12px;
    }
    .cc-bar-label {
      font-size: 12px;
      color: #5F5E5A;
    }
    .cc-bar-track {
      height: 20px;
      background: #F3F3F1;
      border-radius: 4px;
      overflow: hidden;
    }
    .cc-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .cc-bar-value {
      font-size: 13px;
      color: #2E2E2C;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    @media (max-width: 480px) {
      .cc-value { font-size: 24px; }
      .cc-marker__label,
      .cc-marker__value { font-size: 10px; }
      .cc-bar-row {
        grid-template-columns: 70px 1fr 70px;
        gap: 8px;
      }
    }
  `],
})
export class ComparisonCardComponent implements OnChanges {
  @Input() label = '';
  @Input() currentValue = 0;
  @Input() previousValue = 0;
  @Input() changePercent: number | null = null;
  /** Si true, formatea como moneda CRC. */
  @Input() isCurrency = false;
  /** Sufijo para valores no monetarios (ej: " pedidos"). */
  @Input() suffix = '';
  @Input() prevLabel = 'Mes anterior';
  /** Formato del cuerpo de la tarjeta. */
  @Input() variant: ComparisonVariant = 'marker';
  /** Texto al pie (solo variante `marker`). Si se omite se arma según el tipo de dato. */
  @Input() hint?: string;

  /** Aire sobre el mayor de los dos valores, para que el marcador no toque el borde. */
  private readonly HEADROOM = 1.15;
  /** Ancho mínimo de barra (%) para que el monto quepa adentro. */
  private readonly ANCHO_MIN_VALOR = 28;

  formattedValue = '';
  formattedCurrent = '';
  formattedPrev = '';
  hintText = '';

  // Variante marker
  currentPct = 0;
  markerPct = 0;
  showMarker = false;
  markerAlign: MarkerAlign = 'center';
  valueInsideBar = false;

  // Variante bars
  currentBarWidth = 0;
  prevBarWidth = 0;

  badgeText = '';
  badgeColor = '';
  badgeBg = '';
  badgeIcon = '';

  colorActual = COLOR_ACTUAL;
  colorAnterior = COLOR_ANTERIOR;

  ngOnChanges(): void {
    this.calculate();
  }

  private calculate(): void {
    this.formattedValue = this.formatValor(this.currentValue);
    this.formattedCurrent = this.formatValor(this.currentValue);
    this.formattedPrev = this.formatValor(this.previousValue);

    // Variante marker: escala común para barra y marcador (el mayor, con aire).
    const escala = Math.max(this.currentValue, this.previousValue, 1) * this.HEADROOM;
    this.currentPct = Math.min((this.currentValue / escala) * 100, 100);
    this.markerPct = Math.min((this.previousValue / escala) * 100, 100);

    // Sin período anterior no hay meta que marcar.
    this.showMarker = this.previousValue > 0;
    this.markerAlign = this.markerPct >= 82 ? 'end' : this.markerPct <= 18 ? 'start' : 'center';
    this.valueInsideBar = this.currentPct >= this.ANCHO_MIN_VALOR;

    // Variante bars: cada barra relativa al mayor de los dos.
    const maxVal = Math.max(this.currentValue, this.previousValue, 1);
    this.currentBarWidth = (this.currentValue / maxVal) * 100;
    this.prevBarWidth = (this.previousValue / maxVal) * 100;

    this.buildBadge();
    this.hintText = this.hint ?? this.buildHint();
  }

  private formatValor(valor: number): string {
    if (this.isCurrency) {
      return formatCRC(valor);
    }
    const sufijo = this.suffix || ` ${pluralizePedido(valor)}`;
    return `${new Intl.NumberFormat('es-CR').format(valor)}${sufijo}`;
  }

  private buildBadge(): void {
    if (this.changePercent === null || this.changePercent === undefined) {
      this.badgeText = 'Sin datos previos';
      this.badgeColor = '#5F5E5A';
      this.badgeBg = '#F3F3F1';
      this.badgeIcon = 'remove-outline';
      return;
    }
    if (this.changePercent === 0) {
      this.badgeText = '0 %';
      this.badgeColor = '#5F5E5A';
      this.badgeBg = '#F3F3F1';
      this.badgeIcon = 'remove-outline';
      return;
    }

    const subio = this.changePercent > 0;
    this.badgeIcon = subio ? 'arrow-up-outline' : 'arrow-down-outline';
    this.badgeColor = subio ? BADGE_UP.text : BADGE_DOWN.text;
    this.badgeBg = subio ? BADGE_UP.bg : BADGE_DOWN.bg;
    // En `bars` la flecha ya indica la dirección; en `marker` no hay icono, así
    // que el signo va explícito (si no, "41,2 %" no dice si subió o bajó).
    this.badgeText = this.variant === 'bars'
      ? formatPctES(this.changePercent)
      : `${subio ? '+' : '−'}${formatPctES(this.changePercent)}`;
  }

  private buildHint(): string {
    const que = this.isCurrency ? 'lo vendido' : 'los pedidos del período';
    if (!this.showMarker) {
      return `La barra roja es ${que}. No hay ${this.prevLabel.toLowerCase()} con que comparar.`;
    }
    return `La barra roja es ${que}. La línea negra es la meta implícita: lo del ${this.prevLabel.toLowerCase()}.`;
  }
}
