import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, ViewChild, inject } from '@angular/core';

/**
 * Carril horizontal para los KPIs compactos del header (portal [adminHeaderLead]).
 *
 * Los KPIs se reparten el ancho disponible; cuando no caben todos (pantallas
 * angostas, o páginas con varios botones en el header como Menú u Ofertas), en vez
 * de encogerse hasta ser ilegibles se corren de a uno con las flechas laterales.
 * Las flechas aparecen solo si hay algo que correr hacia ese lado.
 *
 * Uso:
 *   <ng-template adminHeaderLead>
 *     <admin-hkpi-strip>
 *       <button class="admin-hkpi"> ... </button>
 *     </admin-hkpi-strip>
 *   </ng-template>
 */
@Component({
  selector: 'admin-hkpi-strip',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hkpi-strip">
      <button
        type="button"
        class="hkpi-strip__nav hkpi-strip__nav--left"
        *ngIf="puedeIzquierda"
        (click)="desplazar(-1)"
        aria-label="Ver KPIs anteriores"
      >
        <ion-icon name="chevron-back-outline"></ion-icon>
      </button>

      <div class="hkpi-strip__viewport admin-hkpis" #viewport>
        <ng-content></ng-content>
      </div>

      <button
        type="button"
        class="hkpi-strip__nav hkpi-strip__nav--right"
        *ngIf="puedeDerecha"
        (click)="desplazar(1)"
        aria-label="Ver más KPIs"
      >
        <ion-icon name="chevron-forward-outline"></ion-icon>
      </button>
    </div>
  `,
  styles: [
    `
      /* El slot del header (.admin-header__lead) es flex: el carril toma todo el
         ancho disponible y puede encogerse (min-width: 0) para que el scroll
         interno funcione en vez de desbordar el header. */
      :host {
        display: block;
        flex: 1 1 auto;
        min-width: 0;
        width: 100%;
      }
      /* position:relative → las flechas se posicionan encima (overlay), NO en el flujo:
         así el viewport mantiene su ancho constante aparezcan o no las flechas, y el
         scrollTo(scrollWidth) aterriza EXACTO en el final (el último KPI queda completo).
         Antes las flechas eran items flex y al aparecer robaban ancho, dejando un pedazo
         cortado y obligando a un segundo click. */
      .hkpi-strip {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 0;
      }
      /* El viewport hereda .admin-hkpis (global.scss): fila flex con los chips. */
      .hkpi-strip__viewport {
        flex: 1 1 auto;
        min-width: 0;
        overflow-x: auto;
        scroll-behavior: smooth;
        /* Con flechas no hace falta la barra de scroll nativa. */
        scrollbar-width: none;
      }
      .hkpi-strip__viewport::-webkit-scrollbar {
        display: none;
      }
      .hkpi-strip__nav {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 3;
        width: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 8px;
        border: 1px solid var(--admin-border);
        background: var(--admin-card);
        box-shadow: 0 0 8px 4px var(--admin-card);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s;
      }
      .hkpi-strip__nav--left { left: 0; }
      .hkpi-strip__nav--right { right: 0; }
      .hkpi-strip__nav ion-icon {
        font-size: 15px;
        color: var(--admin-text);
      }
      .hkpi-strip__nav:hover {
        border-color: rgba(225, 54, 66, 0.4);
      }
      .hkpi-strip__nav:active {
        transform: scale(0.95);
      }
    `,
  ],
})
export class AdminHkpiStripComponent implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly cd = inject(ChangeDetectorRef);

  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLElement>;

  puedeIzquierda = false;
  puedeDerecha = false;

  private observer?: ResizeObserver;
  private mutaciones?: MutationObserver;
  private readonly onScroll = (): void => this.recalcular();

  ngAfterViewInit(): void {
    const el = this.viewport.nativeElement;

    // Scroll y resize fuera de la zona: solo entramos a Angular si cambia el
    // estado de las flechas (evita una detección de cambios por cada píxel).
    this.zone.runOutsideAngular(() => {
      el.addEventListener('scroll', this.onScroll, { passive: true });

      if (typeof ResizeObserver !== 'undefined') {
        this.observer = new ResizeObserver(() => this.recalcular());
        this.observer.observe(el);
      }

      // El contenido también cambia el overflow: páginas que intercambian sus KPIs
      // según una pestaña (Ofertas ↔ Cupones) o que los cargan por API.
      if (typeof MutationObserver !== 'undefined') {
        this.mutaciones = new MutationObserver(() => this.recalcular());
        this.mutaciones.observe(el, { childList: true, subtree: true, characterData: true });
      }
    });

    this.recalcular();
  }

  ngOnDestroy(): void {
    this.viewport.nativeElement.removeEventListener('scroll', this.onScroll);
    this.observer?.disconnect();
    this.mutaciones?.disconnect();
  }

  /** Corre el carril COMPLETAMENTE hasta el extremo (derecha o izquierda), así el KPI
   *  del borde queda totalmente visible de un solo click (no a medias). */
  desplazar(direccion: 1 | -1): void {
    const el = this.viewport.nativeElement;
    el.scrollTo({ left: direccion === 1 ? el.scrollWidth : 0, behavior: 'smooth' });
  }

  private recalcular(): void {
    const el = this.viewport.nativeElement;
    // 1px de tolerancia: el ancho de scroll puede quedar fraccionado.
    const izquierda = el.scrollLeft > 1;
    const derecha = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;

    if (izquierda === this.puedeIzquierda && derecha === this.puedeDerecha) {
      return;
    }

    this.zone.run(() => {
      this.puedeIzquierda = izquierda;
      this.puedeDerecha = derecha;
      this.cd.markForCheck();
    });
  }
}
