import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Señala qué ítem del sidebar del panel debe "iluminarse" (pulso breve) cuando el
 * admin abre una notificación que lo redirige a otra sección. El shell escucha
 * `foco$` y aplica la clase de pulso al nav-item correspondiente; el estado activo
 * normal (routerLinkActive) lo sigue manejando el router.
 *
 * Es un canal aparte del enrutamiento porque el pulso solo debe dispararse cuando
 * el salto viene de una notificación, no en cada navegación del sidebar.
 */
@Injectable({ providedIn: 'root' })
export class SidebarFocusService {
  private readonly focoSubject = new Subject<string>();

  /** Emite el id de la sección a enfocar (p. ej. 'pedidos', 'resenas'). */
  readonly foco$ = this.focoSubject.asObservable();

  /** Pide enfocar el ítem del sidebar de la sección indicada. */
  enfocar(seccionId: string): void {
    this.focoSubject.next(seccionId);
  }
}
