import { Component, Input } from '@angular/core';

/** Encabezado de cada página del panel (logo + título + subtítulo + acciones). */
@Component({
  selector: 'admin-page-header',
  standalone: false,
  template: `
    <div class="page-header">
      <div class="page-header__left">
        <img src="assets/logo/rooster-logo.png" alt="Rooster" class="page-header__logo" />
        <div>
          <h2 class="page-header__title">{{ title }}</h2>
          <p class="page-header__subtitle" *ngIf="subtitle">{{ subtitle }}</p>
          <ng-content select="[header-subtitle]"></ng-content>
        </div>
      </div>
      <div class="page-header__right">
        <ng-content select="[header-right]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--admin-border);
      font-family: var(--rooster-font-sans);
    }
    .page-header__left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .page-header__logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .page-header__title {
      font-family: var(--rooster-font-serif);
      font-size: 22px;
      font-weight: 700;
      color: var(--admin-text);
      line-height: 1.1;
      margin: 0;
    }
    .page-header__subtitle {
      font-size: 11px;
      color: var(--admin-text-muted);
      margin: 3px 0 0;
    }
    .page-header__right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  `],
})
export class AdminPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
}
