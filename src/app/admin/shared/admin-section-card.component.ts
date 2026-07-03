import { Component, Input } from '@angular/core';

/** Tarjeta blanca contenedora de secciones del panel admin. */
@Component({
  selector: 'admin-section-card',
  standalone: false,
  template: `
    <div class="section-card">
      <div class="section-card__head" *ngIf="title || hasAction">
        <span class="section-card__title" *ngIf="title">{{ title }}</span>
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
  `],
})
export class AdminSectionCardComponent {
  @Input() title?: string;
  /** Forzar el header aunque no haya title (cuando solo se proyecta action). */
  @Input() hasAction = false;
}
