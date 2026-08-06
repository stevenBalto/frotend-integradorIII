import { ApplicationRef, Directive, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AdminHeaderService } from './admin-header.service';

/**
 * Publica un <ng-template> como acciones del header global del panel.
 *
 * Uso en cualquier página admin:
 *   <ng-template adminHeaderActions>
 *     <admin-btn (clicked)="crear()">Nuevo</admin-btn>
 *   </ng-template>
 *
 * El template NO se renderiza en la página (ng-template): el shell lo pinta junto a
 * la campana de notificaciones. Publicación diferida un microtask para no chocar con
 * el ciclo de detección de cambios ya corrido del shell.
 *
 * Re-publicación al volver: Ionic cachea las páginas (ngOnInit no re-corre al
 * regresar), así que el botón desaparecía hasta refrescar. Se re-publica en cada
 * NavigationEnd cuya ruta coincida con la de ESTA página (capturada en ngOnInit) —
 * robusto y sin depender de eventos de ciclo de vida Ionic ni del DOM en transición.
 */
@Directive({
  selector: '[adminHeaderActions]',
  standalone: false,
})
export class AdminHeaderActionsDirective implements OnInit, OnDestroy {
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
    this.myPath = this.pathOf(this.router.url);
    Promise.resolve().then(() => this.header.setActions(this.tpl));

    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        if (this.destroyed) return;
        if (this.pathOf(e.urlAfterRedirects) === this.myPath) {
          this.header.setActions(this.tpl);
          this.appRef.tick();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.sub?.unsubscribe();
    this.header.clearActions(this.tpl);
  }

  private pathOf(url: string): string {
    return url.split('?')[0].split('#')[0];
  }
}
