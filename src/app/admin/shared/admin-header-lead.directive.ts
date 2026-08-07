import { Directive, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AdminHeaderService } from './admin-header.service';
import { alEntrarALaPagina } from './admin-header-portal.util';

/**
 * Publica un <ng-template> como contenido del slot izquierdo/central del header
 * global del panel (donde vive el título). Lo usa Pedidos para llevar sus KPIs
 * al header en tablet/PC, ocupando el espacio del título.
 *
 * Uso en cualquier página admin:
 *   <ng-template adminHeaderLead>
 *     <div class="mis-kpis"> ... </div>
 *   </ng-template>
 *
 * Es un clon de [adminHeaderActions] pero apunta al portal "lead". Se publica en
 * un microtask (ngOnInit) y se RE-publica en cada NavigationEnd que caiga en esta
 * misma página — imprescindible porque IonicRouteStrategy cachea las páginas y al
 * volver no se re-ejecuta ngOnInit (ver admin-header-portal.util.ts). El shell
 * limpia en NavigationStart, garantizando el orden clear→publish.
 */
@Directive({
  selector: '[adminHeaderLead]',
  standalone: false,
})
export class AdminHeaderLeadDirective implements OnInit, OnDestroy {
  /**
   * true = el contenido se muestra A LA PAR del título de la sección, sin ocultarlo
   * (Configuración: chip de estado del negocio). Por defecto el lead reemplaza al
   * título, que es lo que necesitan las páginas que suben sus KPIs.
   */
  @Input() conservaTitulo = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly header: AdminHeaderService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.header.setLead(this.tpl, this.conservaTitulo));

    alEntrarALaPagina(this.router, this.route)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.header.setLead(this.tpl, this.conservaTitulo));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.header.clearLead(this.tpl);
  }
}
