import { Directive, ElementRef, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { AdminHeaderService } from './admin-header.service';

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
 * un microtask (ngOnInit) y se re-publica en 'ionViewWillEnter' (páginas cacheadas
 * por IonicRouteStrategy no re-corren ngOnInit al volver). El shell lo limpia en
 * NavigationStart para garantizar el orden clear→publish.
 */
@Directive({
  selector: '[adminHeaderLead]',
  standalone: false,
})
export class AdminHeaderLeadDirective implements OnInit, OnDestroy {
  private hostPage: Element | null = null;
  private readonly onViewWillEnter = (): void => this.header.setLead(this.tpl);

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly elRef: ElementRef<Comment>,
    private readonly header: AdminHeaderService,
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.header.setLead(this.tpl));

    this.hostPage = this.elRef.nativeElement.parentElement?.closest('.ion-page') ?? null;
    this.hostPage?.addEventListener('ionViewWillEnter', this.onViewWillEnter);
  }

  ngOnDestroy(): void {
    this.header.clearLead(this.tpl);
    this.hostPage?.removeEventListener('ionViewWillEnter', this.onViewWillEnter);
  }
}
