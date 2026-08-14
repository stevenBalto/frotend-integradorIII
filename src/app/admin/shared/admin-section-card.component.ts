import { Component, Input } from '@angular/core';

/** Tarjeta blanca contenedora de secciones del panel admin. */
@Component({
  selector: 'admin-section-card',
  standalone: false,
  // Evita que el @Input title se refleje como atributo HTML nativo (dispara tooltip del navegador).
  host: { '[attr.title]': 'null' },
  template: `
    <div class="section-card" [class.section-card--fill]="fill">
      <div class="section-card__head" *ngIf="title || hasAction" [class.section-card__head--inline]="actionInline">
        <span class="section-card__title" *ngIf="title" [class.section-card__title--has-short]="titleShort">
          <span class="section-card__title--full">{{ title }}</span>
          <span class="section-card__title--short" *ngIf="titleShort">{{ titleShort }}</span>
        </span>
        <div class="section-card__action">
          <ng-content select="[card-action]"></ng-content>
        </div>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .section-card {
      background: var(--admin-card);
      border: 1px solid var(--admin-border);
      border-radius: 12px;
      padding: 20px;
      font-family: var(--rooster-font-sans);
    }
    .section-card__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .section-card__title {
      font-size: 13px;
      font-weight: 700;
      color: var(--admin-text);
    }
    /* Llena el alto del contenedor (para simetría con cards vecinas en un grid). */
    .section-card--fill {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    /* Título corto (solo móvil, cuando se define titleShort). */
    .section-card__title--short { display: none; }
    /* En móvil el header envuelve: el área de acciones baja a fila completa. */
    @media (max-width: 767px) {
      .section-card__head { flex-wrap: wrap; gap: 12px; }
      .section-card__action { width: 100%; }
      .section-card__title--has-short .section-card__title--full { display: none; }
      .section-card__title--has-short .section-card__title--short { display: inline; }
      /* Variante inline: la accion se queda junto al titulo (no baja a fila completa). */
      .section-card__head--inline { flex-wrap: nowrap; gap: 8px; }
      .section-card__head--inline .section-card__action { width: auto; min-width: 0; flex: 1 1 auto; display: flex; justify-content: flex-end; }
    }
  `],
})
export class AdminSectionCardComponent {
  @Input() title?: string;
  /** Título corto alternativo mostrado en móvil (si se define). */
  @Input() titleShort?: string;
  /** Forzar el header aunque no haya title (cuando solo se proyecta action). */
  @Input() hasAction = false;
  /** En movil, mantiene la accion en la misma fila que el titulo (no baja a fila completa). */
  @Input() actionInline = false;
  /** Estira la tarjeta al alto de su contenedor (simetría en grids). */
  @Input() fill = false;
}
