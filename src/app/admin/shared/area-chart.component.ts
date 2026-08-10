import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, inject } from '@angular/core';

interface Guide { pos: number; label: string; }
interface Pt { i: number; cx: number; cy: number; }

/**
 * Gráfico de área (tendencia de ventas) — SVG con paths calculados.
 * Eje Y en COLONES: recibe los montos crudos (`values`), calcula un tope redondo
 * (ej. ₡19k → ₡20k) y rotula las guías en ₡.
 *
 * El SVG SIEMPRE mide exactamente el ancho del contenedor (1 unidad = 1 px, sin
 * distorsión), sin importar cuántos puntos haya: así el gráfico se ve idéntico en
 * mes, semana y día. Solo cuando los puntos no caben con la separación mínima
 * (`minGap`) el SVG crece más allá del contenedor y este hace scroll horizontal;
 * en ese caso emite `scrollableChange` para que el padre muestre el hint.
 * Cada punto es tocable/hovereable y muestra el dinero de ESE día en un tooltip.
 */
@Component({
  selector: 'area-chart',
  standalone: false,
  template: `
    <svg [attr.viewBox]="'0 0 ' + vbW + ' ' + H" class="area"
         [style.width.px]="vbW" [style.height.px]="H"
         preserveAspectRatio="xMinYMid meet">
      <defs>
        <linearGradient [attr.id]="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E13642" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#E13642" stop-opacity="0" />
        </linearGradient>
      </defs>

      <g *ngFor="let g of yGuides">
        <line [attr.x1]="padL" [attr.y1]="g.pos" [attr.x2]="vbW - padR" [attr.y2]="g.pos"
              stroke="#E5E7EB" stroke-dasharray="3 4" stroke-width="1" />
        <text [attr.x]="padL - 10" [attr.y]="g.pos + 4" text-anchor="end"
              font-size="10" fill="#9CA3AF" font-family="Nunito, system-ui" font-weight="600">{{ g.label }}</text>
      </g>

      <text *ngFor="let x of xGuides" [attr.x]="x.pos" [attr.y]="H - padB + 20"
            text-anchor="middle" font-size="9" fill="#9CA3AF" font-family="Nunito, system-ui" font-weight="600">{{ x.label }}</text>

      <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradId + ')'" />
      <path [attr.d]="linePath" stroke="#E13642" stroke-width="2.2" fill="none"
            stroke-linecap="round" stroke-linejoin="round" />

      <!-- Puntos interactivos: todos tocables (hit-area transparente amplia). -->
      <g *ngFor="let p of puntos" class="pt" style="cursor: pointer"
         (click)="seleccionar(p.i)" (mouseenter)="seleccionar(p.i)">
        <circle [attr.cx]="p.cx" [attr.cy]="p.cy" r="14" fill="transparent" />
        <circle [attr.cx]="p.cx" [attr.cy]="p.cy" [attr.r]="p.i === activeIdx ? 5.5 : 3.5"
                [attr.fill]="p.i === activeIdx ? '#E13642' : '#FFFFFF'" stroke="#E13642" stroke-width="2" />
      </g>

      <!-- Tooltip del punto activo (monto del día). -->
      <g *ngIf="active" style="pointer-events: none">
        <path [attr.d]="arrowPath" fill="#1E1E1E" />
        <rect [attr.x]="tipX" [attr.y]="tipY" [attr.width]="tipW" height="26" rx="6" fill="#1E1E1E" />
        <text [attr.x]="tipX + tipW / 2" [attr.y]="tipTextY" text-anchor="middle"
              font-size="11.5" font-weight="700" fill="#fff" font-family="Nunito, system-ui">{{ activeLabel }}</text>
      </g>
    </svg>
  `,
  styles: [`
    :host { display: block; }
    .area { display: block; overflow: visible; }
  `],
})
export class AreaChartComponent implements OnChanges, AfterViewInit, OnDestroy {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  /** Montos crudos por día (colones). Fuente principal del gráfico. */
  @Input() values: number[] = [];
  /** Etiquetas del eje X (un label por punto). */
  @Input() xLabels: string[] = [];
  /** true cuando los puntos no caben y el contenedor debe hacer scroll horizontal. */
  @Output() scrollableChange = new EventEmitter<boolean>();

  readonly H = 260;
  readonly padL = 56;
  readonly padR = 24;
  readonly padT = 44;
  readonly padB = 42;
  /** Separación mínima entre puntos; por debajo de esto el gráfico hace scroll. */
  readonly minGap = 44;

  vbW = 640;
  scrollable = false;
  yMax = 1000; // tope redondo del eje Y (colones)
  gradId = 'areaGrad-' + Math.round(Math.random() * 1e6);
  yGuides: Guide[] = [];
  xGuides: Guide[] = [];
  puntos: Pt[] = [];
  linePath = '';
  areaPath = '';

  // Punto seleccionado (tooltip). Se reinicia al pico en cada recarga de datos.
  activeIdx = 0;
  active?: Pt;
  activeLabel = '';
  tipX = 0;
  tipY = 0;
  tipTextY = 0;
  tipW = 68;
  arrowPath = '';

  /** Ancho disponible del contenedor (px). Se mide con ResizeObserver. */
  private contW = 640;
  private ro?: ResizeObserver;

  ngAfterViewInit(): void {
    if (typeof ResizeObserver === 'undefined') { return; }
    // Fuera de Angular: el observer dispara seguido y no queremos un CD por frame.
    this.zone.runOutsideAngular(() => {
      this.ro = new ResizeObserver((entries) => {
        const ancho = Math.round(entries[0]?.contentRect.width ?? 0);
        // Umbral de 1px: evita un bucle cuando aparece/desaparece la barra de scroll.
        if (ancho <= 0 || Math.abs(ancho - this.contW) <= 1) { return; }
        this.contW = ancho;
        this.zone.run(() => {
          this.recalcular();
          this.cdr.markForCheck();
        });
      });
      this.ro.observe(this.host.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  ngOnChanges(): void {
    // Datos nuevos: el tooltip vuelve al día pico.
    this.recalcular(true);
  }

  private xAt(i: number): number {
    const innerW = this.vbW - this.padL - this.padR;
    const n = this.values.length;
    return n <= 1 ? this.padL : this.padL + (i * innerW) / (n - 1);
  }

  private yAt(v: number): number {
    // Dominio fijo 0..yMax (colones): un día en ₡0 cae en la línea base (visible).
    const innerH = this.H - this.padT - this.padB;
    return this.padT + innerH * (1 - v / this.yMax);
  }

  /** @param resetActivo true al llegar datos nuevos; false en un simple resize. */
  private recalcular(resetActivo = false): void {
    if (!this.values.length) { return; }
    const n = this.values.length;

    // El SVG mide el contenedor salvo que los puntos necesiten más espacio.
    const necesario = this.padL + this.padR + Math.max(0, n - 1) * this.minGap;
    const anterior = this.scrollable;
    this.scrollable = necesario > this.contW;
    this.vbW = this.scrollable ? necesario : this.contW;
    if (this.scrollable !== anterior) {
      this.scrollableChange.emit(this.scrollable);
    }

    this.yMax = this.topeRedondo(Math.max(...this.values, 0));

    const last = n - 1;
    const points = this.values.map((v, i) => `${this.xAt(i).toFixed(1)},${this.yAt(v).toFixed(1)}`);
    this.linePath = `M ${points.join(' L ')}`;
    const baseY = this.yAt(0);
    this.areaPath = `M ${this.xAt(0)},${baseY} L ${points.join(' L ')} L ${this.xAt(last)},${baseY} Z`;

    // Guías Y en colones (5 niveles: 100%..20% del tope).
    this.yGuides = [1, 0.8, 0.6, 0.4, 0.2].map((f) => ({
      pos: this.yAt(this.yMax * f),
      label: this.formatMonto(this.yMax * f),
    }));
    this.xGuides = this.xLabels.map((l, i) => ({ pos: this.xAt(i), label: l }));
    this.puntos = this.values.map((_, i) => ({ i, cx: this.xAt(i), cy: this.yAt(this.values[i]) }));

    // Con datos nuevos el tooltip vuelve al día de mayor venta; en un resize se
    // conserva el punto que el usuario tenía seleccionado.
    if (resetActivo || this.activeIdx >= n) { this.activeIdx = this.indicePico(); }
    this.recalcActivo();
  }

  /** Selecciona el punto (click o hover) y recalcula el tooltip. */
  seleccionar(i: number): void {
    this.activeIdx = i;
    this.recalcActivo();
  }

  private indicePico(): number {
    let idx = 0;
    for (let i = 1; i < this.values.length; i++) {
      if (this.values[i] > this.values[idx]) { idx = i; }
    }
    return idx;
  }

  private recalcActivo(): void {
    const i = this.activeIdx;
    if (i < 0 || i >= this.puntos.length) {
      this.active = undefined;
      return;
    }
    this.active = this.puntos[i];
    this.activeLabel = this.formatMonto(this.values[i]);
    this.tipW = Math.max(56, this.activeLabel.length * 8 + 20);

    // La caja se mantiene dentro del SVG: en el primer/último punto se desplaza
    // en vez de salirse y quedar recortada (la flecha sigue apuntando al punto).
    const margen = 4;
    this.tipX = Math.min(
      Math.max(this.active.cx - this.tipW / 2, margen),
      Math.max(margen, this.vbW - this.tipW - margen),
    );
    const flechaX = Math.min(Math.max(this.active.cx, this.tipX + 10), this.tipX + this.tipW - 10);

    // Cerca del borde superior el tooltip va abajo (no se corta con el scroll).
    const arriba = this.active.cy > 70;
    if (arriba) {
      this.tipY = this.active.cy - 40;
      this.tipTextY = this.active.cy - 22.5;
      this.arrowPath = `M ${flechaX - 5} ${this.active.cy - 14} L ${flechaX} ${this.active.cy - 8} L ${flechaX + 5} ${this.active.cy - 14} Z`;
    } else {
      this.tipY = this.active.cy + 14;
      this.tipTextY = this.active.cy + 31.5;
      this.arrowPath = `M ${flechaX - 5} ${this.active.cy + 14} L ${flechaX} ${this.active.cy + 8} L ${flechaX + 5} ${this.active.cy + 14} Z`;
    }
  }

  /** Redondea el máximo hacia un tope "bonito" para el eje (ej. 19.000 → 20.000). */
  private topeRedondo(v: number): number {
    if (v <= 0) { return 1000; }
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    let nice: number;
    if (n <= 1) { nice = 1; }
    else if (n <= 2) { nice = 2; }
    else if (n <= 2.5) { nice = 2.5; }
    else if (n <= 5) { nice = 5; }
    else { nice = 10; }
    return nice * pow;
  }

  private formatMonto(v: number): string {
    if (v >= 1000) {
      const miles = v / 1000;
      const txt = Number.isInteger(miles) ? `${miles}` : miles.toFixed(1);
      return `₡${txt}k`;
    }
    return `₡${Math.round(v)}`;
  }
}
