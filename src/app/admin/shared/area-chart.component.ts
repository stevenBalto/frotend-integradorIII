import { Component, Input, OnChanges } from '@angular/core';

interface Guide { pos: number; label: string; }
interface Marker { cx: number; cy: number; }

/** Gráfico de área (ventas de la semana) — SVG con paths calculados como el prototipo. */
@Component({
  selector: 'area-chart',
  standalone: false,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" class="area" preserveAspectRatio="none">
      <defs>
        <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E13642" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#E13642" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g *ngFor="let g of yGuides">
        <line [attr.x1]="padL" [attr.y1]="g.pos" [attr.x2]="W - padR" [attr.y2]="g.pos"
              stroke="#E5E7EB" stroke-dasharray="3 4" stroke-width="1" />
        <text [attr.x]="padL - 10" [attr.y]="g.pos + 4" text-anchor="end"
              font-size="10" fill="#9CA3AF" font-family="Nunito, system-ui" font-weight="600">{{ g.label }}</text>
      </g>

      <text *ngFor="let x of xGuides" [attr.x]="x.pos" [attr.y]="H - padB + 20"
            text-anchor="middle" font-size="9" fill="#9CA3AF" font-family="Nunito, system-ui" font-weight="600">{{ x.label }}</text>

      <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradId + ')'" />
      <path [attr.d]="linePath" stroke="#E13642" stroke-width="2.2" fill="none"
            stroke-linecap="round" stroke-linejoin="round" />

      <circle *ngFor="let m of markers" [attr.cx]="m.cx" [attr.cy]="m.cy" r="3.5"
              fill="#FFFFFF" stroke="#E13642" stroke-width="2" />

      <g *ngIf="peak">
        <circle [attr.cx]="peak.cx" [attr.cy]="peak.cy" r="5.5" fill="#E13642" stroke="#fff" stroke-width="2.5" />
        <path [attr.d]="'M ' + (peak.cx - 5) + ' ' + (peak.cy - 14) + ' L ' + peak.cx + ' ' + (peak.cy - 8) + ' L ' + (peak.cx + 5) + ' ' + (peak.cy - 14) + ' Z'" fill="#1E1E1E" />
        <rect [attr.x]="peak.cx - 34" [attr.y]="peak.cy - 40" width="68" height="26" rx="6" fill="#1E1E1E" />
        <text [attr.x]="peak.cx" [attr.y]="peak.cy - 22.5" text-anchor="middle"
              font-size="11.5" font-weight="700" fill="#fff" font-family="Nunito, system-ui">{{ peakValue }}</text>
      </g>
    </svg>
  `,
  styles: [`
    .area { width: 100%; height: auto; display: block; overflow: visible; }
  `],
})
export class AreaChartComponent implements OnChanges {
  @Input() data: number[] = [];
  @Input() peakIdx?: number;
  @Input() peakValue?: string;
  @Input() yLabels: number[] = [100, 80, 60, 40, 20];
  @Input() xLabels: string[] = ['5k', '10k', '15k', '20k', '25k', '30k', '35k', '40k', '45k', '50k', '55k', '60k'];

  readonly W = 640;
  readonly H = 260;
  readonly padL = 52;
  readonly padR = 24;
  readonly padT = 36;
  readonly padB = 42;

  gradId = 'areaGrad-' + Math.round(Math.random() * 1e6);
  yGuides: Guide[] = [];
  xGuides: Guide[] = [];
  markers: Marker[] = [];
  linePath = '';
  areaPath = '';
  peak?: Marker;

  private xAt(i: number): number {
    const innerW = this.W - this.padL - this.padR;
    return this.padL + (i * innerW) / (this.data.length - 1);
  }

  private yAt(v: number): number {
    const innerH = this.H - this.padT - this.padB;
    const yMin = Math.min(...this.yLabels);
    const yMax = Math.max(...this.yLabels);
    return this.padT + innerH * (1 - (v - yMin) / (yMax - yMin));
  }

  ngOnChanges(): void {
    if (!this.data.length) { return; }
    const yMin = Math.min(...this.yLabels);
    const last = this.data.length - 1;

    const points = this.data.map((v, i) => `${this.xAt(i).toFixed(1)},${this.yAt(v).toFixed(1)}`);
    this.linePath = `M ${points.join(' L ')}`;
    const baseY = this.yAt(yMin);
    this.areaPath = `M ${this.xAt(0)},${baseY} L ${points.join(' L ')} L ${this.xAt(last)},${baseY} Z`;

    this.yGuides = this.yLabels.map(y => ({ pos: this.yAt(y), label: `${y}%` }));
    this.xGuides = this.xLabels.map((l, i) => ({ pos: this.xAt(i), label: l }));

    this.markers = this.data
      .map((_, i) => i)
      .filter(i => i === 0 || i === last || i % 3 === 0 || i === this.peakIdx)
      .map(i => ({ cx: this.xAt(i), cy: this.yAt(this.data[i]) }));

    this.peak = this.peakIdx !== undefined && this.peakValue
      ? { cx: this.xAt(this.peakIdx), cy: this.yAt(this.data[this.peakIdx]) }
      : undefined;
  }
}
