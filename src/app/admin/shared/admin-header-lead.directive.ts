import { ApplicationRef, Directive, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminHeaderService } from './admin-header.service';

/**
 * Publica un <ng-template> como contenido del slot izquierdo/central del header
 * global del panel (donde vive el título). Lo usan las secciones para llevar sus
 * KPIs al header en tablet/PC, ocupando el espacio del título.
 *
 * Uso en cualquier página admin:
 *   <ng-template adminHeaderLead>
 *     <div class="mis-kpis"> ... </div>
 *   </ng-template>
 *
 * Re-publicación al volver: Ionic (IonicRouteStrategy) cachea las páginas, así que
 * al regresar el componente NO se recrea (ngOnInit no re-corre) y el KPI/lead
 * quedaba en null hasta refrescar. Se re-publica en cada NavigationEnd cuya ruta
 * coincida con la de ESTA página (capturada en ngOnInit). No depende de eventos de
 * ciclo de vida Ionic (poco fiables) ni de inspeccionar el DOM durante la
 * transición (que podía dar por activa a la página saliente).
 */
@Directive({
  selector: '[adminHeaderLead]',
  standalone: false,
})
export class AdminHeaderLeadDirective implements OnInit, OnDestroy {
  private destroyed = false;
  private sub?: Subscription;
  private myPath = '';

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly header: AdminHeaderService,
    private readonly router: Router,
    private readonly appRef: ApplicationRef,
  ) {}

  ngOnInit(): void {
    // Ruta de esta página (al crearse, router.url ya es el destino).
    this.myPath = this.pathOf(this.router.url);
    Promise.resolve().then(() => this.header.setLead(this.tpl));

    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.destroyed) return;
        if (this.pathOf(e.urlAfterRedirects) === this.myPath) {
          this.header.setLead(this.tpl);
          // Página cacheada: el handler corre fuera del CD de una página que se
          // re-crea, así que forzamos la detección para que el async pipe del shell
          // pinte los KPIs sin necesidad de refrescar.
          this.appRef.tick();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.sub?.unsubscribe();
    this.header.clearLead(this.tpl);
  }

  private pathOf(url: string): string {
    return url.split('?')[0].split('#')[0];
  }
}
