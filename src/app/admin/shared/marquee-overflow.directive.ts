import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

/**
 * Anima el contenido (marquee suave ida-y-vuelta) SOLO cuando desborda su
 * contenedor. Si el texto cabe, no se anima. Pensado para el saludo del header
 * en Dashboard, que en móvil puede quedar muy largo y pegarse a la campana.
 *
 * Uso: contenedor con un único hijo de texto.
 *   <div class="admin-greeting" adminMarquee><p>Buenas tardes, …</p></div>
 */
@Directive({
  selector: '[adminMarquee]',
  standalone: false,
})
export class MarqueeOverflowDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  private ro?: ResizeObserver;

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    if (typeof ResizeObserver !== 'undefined') {
      this.zone.runOutsideAngular(() => {
        this.ro = new ResizeObserver(() => this.revisar());
        this.ro.observe(el);
      });
    }
    setTimeout(() => this.revisar(), 0);
  }

  private revisar(): void {
    const el = this.host.nativeElement;
    const hijo = el.firstElementChild as HTMLElement | null;
    if (!hijo) return;
    const desborde = hijo.scrollWidth - el.clientWidth;
    if (desborde > 4) {
      el.style.setProperty('--marquee-shift', `-${desborde + 12}px`);
      // Velocidad de lectura: ~25px/seg, mínimo 4s por tramo.
      el.style.setProperty('--marquee-time', `${Math.max(4, (desborde + 12) / 25)}s`);
      el.classList.add('marquee--run');
    } else {
      el.classList.remove('marquee--run');
      el.style.removeProperty('--marquee-shift');
      el.style.removeProperty('--marquee-time');
    }
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }
}
