import { Directive, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminHeaderService } from './admin-header.service';
import { alEntrarALaPagina } from './admin-header-portal.util';

/**
 * Publica un <ng-template> como acciones del header global del panel.
 *
 * Uso en cualquier página admin:
 *   <ng-template adminHeaderActions>
 *     <admin-btn (clicked)="crear()">Nuevo</admin-btn>
 *   </ng-template>
 *
 * El template NO se renderiza en la página (ng-template): el shell lo pinta
 * junto a la campana de notificaciones. La publicación se difiere un microtask
 * para no chocar con el ciclo de detección de cambios ya corrido del shell, y se
 * RE-publica en cada NavigationEnd que caiga en esta misma página: como
 * IonicRouteStrategy cachea las páginas, al volver de otra pantalla el componente
 * no se recrea (ngOnInit no vuelve a correr) y el botón quedaba "pegado" en null
 * hasta refrescar. Ver admin-header-portal.util.ts.
 */
@Directive({
  selector: '[adminHeaderActions]',
  standalone: false,
})
export class AdminHeaderActionsDirective implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly header: AdminHeaderService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.header.setActions(this.tpl));

    alEntrarALaPagina(this.router, this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.header.setActions(this.tpl));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.header.clearActions(this.tpl);
  }
}
