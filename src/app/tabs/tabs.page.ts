import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CarritoService } from '../core/services/carrito.service';

interface TabDef {
  key: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements AfterViewInit, OnDestroy {
  @ViewChild('tabBar', { read: ElementRef }) tabBarRef!: ElementRef<HTMLElement>;

  /** Orden = orden de las pestañas en el tab bar y de las rutas hijas de /tabs. */
  readonly tabs: TabDef[] = [
    { key: 'home', icon: 'home-outline', label: 'Home' },
    { key: 'pedir', icon: 'cart-outline', label: 'Carrito' },
    { key: 'ofertas', icon: 'pricetag-outline', label: 'Promociones' },
    { key: 'mi-cuenta', icon: 'person-outline', label: 'Mi cuenta' },
  ];

  activeIndex = 0;
  /** Índice cuyo ícono/label muestra la cápsula (cambia en vivo mientras se arrastra). */
  displayIndex = 0;
  dragging = false;
  /** Cantidad de productos en el carrito (badge del tab Carrito). Vale para todo
   *  usuario: depende solo de lo que haya en el carrito (persistido en storage). */
  cartCount = 0;

  // Geometría medida del tab bar real (px, coords de viewport).
  barLeft = 0;
  barTop = 0;
  barWidth = 0;
  barHeight = 0;
  /** Centro X (relativo al tab bar) de cada ion-tab-button real. */
  slotCenters: number[] = [];
  /** Ancho de una pestaña (el de la celda que sigue a la cápsula). */
  slotW = 0;
  /** Borde izquierdo de la celda activa/arrastrada dentro del overlay (px). */
  cellLeft = 0;

  private readonly sub = new Subscription();
  private ro?: ResizeObserver;
  private startX = 0;
  private startLeft = 0;
  private moved = false;
  private readonly onMoveBound = (e: PointerEvent) => this.onMove(e);
  private readonly onUpBound = (e: PointerEvent) => this.onUp(e);
  private readonly onResize = () => this.measure();

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly carrito: CarritoService,
  ) {}

  ngAfterViewInit(): void {
    this.setActiveFromUrl(this.router.url);
    this.sub.add(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe((e) => this.setActiveFromUrl(e.urlAfterRedirects)),
    );
    // Badge del carrito: se actualiza en vivo al agregar/quitar/vaciar.
    this.sub.add(
      this.carrito.cantidadItems$.subscribe((n) => {
        this.cartCount = n;
        this.cdr.detectChanges();
      }),
    );

    this.scheduleMeasure();
    // Ionic reacomoda los botones unos ms después sin cambiar el ancho de la
    // barra (el ResizeObserver no lo capta), así que re-medimos en diferido.
    setTimeout(() => this.measure(), 120);
    setTimeout(() => this.measure(), 450);
    const el = this.tabBarRef?.nativeElement;
    if (el && 'ResizeObserver' in window) {
      this.ro = new ResizeObserver(() => this.measure());
      this.ro.observe(el);
    }
    window.addEventListener('resize', this.onResize);
  }

  /** Se dispara cuando la transicion de entrada YA termino (a diferencia de
      los setTimeout de ngAfterViewInit, que son un tiempo adivinado): vuelve
      a medir para que la capsula quede en el slot correcto si el shell se
      recreo al volver de una ruta fuera de /tabs (ej. login/register) y el
      layout tardo mas de lo esperado en asentar (movil mas lento, o el
      viewport todavia se estaba acomodando por el teclado que se cerro). */
  ionViewDidEnter(): void {
    this.scheduleMeasure();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.ro?.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onMoveBound);
    window.removeEventListener('pointerup', this.onUpBound);
  }

  /** El tab bar puede renderizar unos frames después: reintenta medir hasta tener ancho. */
  private scheduleMeasure(tries = 0): void {
    requestAnimationFrame(() => {
      this.measure();
      if (this.barWidth === 0 && tries < 20) {
        this.scheduleMeasure(tries + 1);
      }
    });
  }

  /** Mide el tab bar y el centro real de cada ion-tab-button (robusto a paddings/gaps). */
  private measure(): void {
    const el = this.tabBarRef?.nativeElement;
    if (!el) {
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0) {
      return;
    }
    const btns = Array.from(el.querySelectorAll('ion-tab-button'));
    if (btns.length !== this.tabs.length) {
      return;
    }
    this.barLeft = r.left;
    this.barTop = r.top;
    this.barWidth = r.width;
    this.barHeight = r.height;
    this.slotCenters = btns.map((b) => {
      const br = b.getBoundingClientRect();
      return br.left - r.left + br.width / 2;
    });
    this.slotW = btns[0].getBoundingClientRect().width;
    if (!this.dragging) {
      this.cellLeft = this.leftForIndex(this.activeIndex);
    }
    this.cdr.detectChanges();
  }

  /** Borde izquierdo de la celda para que su centro coincida con el del botón i. */
  private leftForIndex(i: number): number {
    return (this.slotCenters[i] ?? 0) - this.slotW / 2;
  }

  private nearestIndex(centerX: number): number {
    let best = 0;
    let bestDist = Infinity;
    this.slotCenters.forEach((c, i) => {
      const d = Math.abs(centerX - c);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  }

  private setActiveFromUrl(url: string): void {
    const seg = url.split('?')[0].split('/').filter(Boolean); // p.ej. ['tabs','home']
    const key = seg[1] ?? 'home';
    const idx = this.tabs.findIndex((t) => t.key === key);
    this.activeIndex = idx >= 0 ? idx : 0;
    if (!this.dragging) {
      this.displayIndex = this.activeIndex;
      // Re-medir con el layout ya asentado de la ruta destino (evita quedar con
      // centros viejos si Ionic reacomodó los botones).
      this.measure();
    }
    this.cdr.detectChanges();
  }

  // ── Arrastre de la cápsula ─────────────────────────────────────────────
  onDown(ev: PointerEvent): void {
    if (!this.slotCenters.length) {
      this.measure();
    }
    if (!this.slotCenters.length) {
      return;
    }
    this.dragging = true;
    this.moved = false;
    this.startX = ev.clientX;
    this.startLeft = this.leftForIndex(this.activeIndex);
    (ev.target as HTMLElement).setPointerCapture?.(ev.pointerId);
    window.addEventListener('pointermove', this.onMoveBound);
    window.addEventListener('pointerup', this.onUpBound);
    ev.preventDefault();
  }

  private onMove(ev: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const dx = ev.clientX - this.startX;
    if (Math.abs(dx) > 3) {
      this.moved = true;
    }
    const max = this.barWidth - this.slotW;
    const left = Math.max(0, Math.min(max, this.startLeft + dx));
    this.cellLeft = left;
    this.displayIndex = this.nearestIndex(left + this.slotW / 2);
    this.cdr.detectChanges();
  }

  private onUp(_ev: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    window.removeEventListener('pointermove', this.onMoveBound);
    window.removeEventListener('pointerup', this.onUpBound);

    const idx = this.displayIndex;
    if (this.moved && idx !== this.activeIndex) {
      this.cellLeft = this.leftForIndex(idx);
      this.router.navigate(['/tabs', this.tabs[idx].key]);
    } else {
      this.displayIndex = this.activeIndex;
      this.cellLeft = this.leftForIndex(this.activeIndex);
    }
    this.cdr.detectChanges();
  }
}
