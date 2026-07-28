import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Portal de acciones para el header global del panel admin.
 *
 * Cada página puede publicar un <ng-template> con sus botones de acción
 * (crear, filtros, avisos) vía la directiva [adminHeaderActions]; el shell lo
 * renderiza junto al botón de notificaciones. Así las acciones viven arriba,
 * a la par de la campana, y el contenido de cada sección gana espacio.
 */
@Injectable({ providedIn: 'root' })
export class AdminHeaderService {
  private readonly actionsSubject = new BehaviorSubject<TemplateRef<unknown> | null>(null);
  readonly actions$ = this.actionsSubject.asObservable();

  /** Publica el template de acciones de la página activa. */
  setActions(tpl: TemplateRef<unknown> | null): void {
    this.actionsSubject.next(tpl);
  }

  /**
   * Limpia el template SOLO si el actual es el mismo (evita que el ngOnDestroy
   * de la página saliente borre las acciones que ya publicó la entrante).
   */
  clearActions(tpl: TemplateRef<unknown>): void {
    if (this.actionsSubject.value === tpl) {
      this.actionsSubject.next(null);
    }
  }
}
