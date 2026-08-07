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
/** Contenido publicado en el slot izquierdo/central del header. */
export interface AdminHeaderLead {
  tpl: TemplateRef<unknown>;
  /**
   * Si es true, el título de la sección NO se oculta y el contenido se muestra a la
   * par (lo usa Configuración con su chip de estado). Por defecto el lead ocupa el
   * lugar del título, que es lo que hacen las páginas que suben sus KPIs.
   */
  conservaTitulo: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminHeaderService {
  private readonly actionsSubject = new BehaviorSubject<TemplateRef<unknown> | null>(null);
  readonly actions$ = this.actionsSubject.asObservable();

  /**
   * Segundo portal: contenido para la zona izquierda/central del header (donde
   * vive el título). Lo usa Pedidos para proyectar sus KPIs al header en tablet+.
   * Mismo mecanismo que las acciones (publicar en ionViewWillEnter, limpiar en
   * NavigationStart) para no dejar el template "pegado" al cambiar de página.
   */
  private readonly leadSubject = new BehaviorSubject<AdminHeaderLead | null>(null);
  readonly lead$ = this.leadSubject.asObservable();

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

  /** Publica el template del slot izquierdo (KPIs, chip de estado) de la página activa. */
  setLead(tpl: TemplateRef<unknown> | null, conservaTitulo = false): void {
    this.leadSubject.next(tpl ? { tpl, conservaTitulo } : null);
  }

  /** Limpia el lead SOLO si el actual es el mismo (mismo contrato que clearActions). */
  clearLead(tpl: TemplateRef<unknown>): void {
    if (this.leadSubject.value?.tpl === tpl) {
      this.leadSubject.next(null);
    }
  }
}
