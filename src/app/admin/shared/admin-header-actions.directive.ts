import { Directive, ElementRef, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { AdminHeaderService } from './admin-header.service';

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
 * para no chocar con el ciclo de detección de cambios ya corrido del shell.
 */
@Directive({
  selector: '[adminHeaderActions]',
  standalone: false,
})
export class AdminHeaderActionsDirective implements OnInit, OnDestroy {
  private hostPage: Element | null = null;
  private readonly onViewWillEnter = (): void => this.header.setActions(this.tpl);

  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly elRef: ElementRef<Comment>,
    private readonly header: AdminHeaderService,
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.header.setActions(this.tpl));

    // Ionic (IonicRouteStrategy) cachea las páginas: al volver de otra pantalla
    // el componente no se recrea (ngOnInit no vuelve a correr), solo se emite
    // este evento DOM sobre el <ion-page> — lo escuchamos para re-publicar las
    // acciones, si no quedan "pegadas" en null (bug: botón del header desaparece
    // al volver de una pantalla y hace falta refrescar).
    this.hostPage = this.elRef.nativeElement.parentElement?.closest('.ion-page') ?? null;
    this.hostPage?.addEventListener('ionViewWillEnter', this.onViewWillEnter);
  }

  ngOnDestroy(): void {
    this.header.clearActions(this.tpl);
    this.hostPage?.removeEventListener('ionViewWillEnter', this.onViewWillEnter);
  }
}
