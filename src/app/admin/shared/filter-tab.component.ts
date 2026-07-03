import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Pastilla de filtro (tabs de tablas del panel). */
@Component({
  selector: 'filter-tab',
  standalone: false,
  template: `
    <button
      type="button"
      class="filter-tab"
      [class.filter-tab--active]="active"
      (click)="select.emit()"
    >
      {{ label }}
    </button>
  `,
  styles: [`
    .filter-tab {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      font-family: var(--rooster-font-sans);
      background: var(--admin-card);
      color: var(--admin-text-muted);
      border: 1px solid var(--admin-border);
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-tab--active {
      background: var(--admin-accent);
      color: #fff;
      border-color: var(--admin-accent);
    }
  `],
})
export class FilterTabComponent {
  @Input() label = '';
  @Input() active = false;
  @Output() select = new EventEmitter<void>();
}
