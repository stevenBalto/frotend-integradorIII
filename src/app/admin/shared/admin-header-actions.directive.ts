import { Directive, OnDestroy, OnInit, TemplateRef } from '@angular/core';
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
  constructor(
    private readonly tpl: TemplateRef<unknown>,
    private readonly header: AdminHeaderService,
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.header.setActions(this.tpl));
  }

  ngOnDestroy(): void {
    this.header.clearActions(this.tpl);
  }
}
