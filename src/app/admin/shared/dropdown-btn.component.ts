import { Component, Input } from '@angular/core';

/** Botón tipo dropdown (solo visual). */
@Component({
  selector: 'dropdown-btn',
  standalone: false,
  template: `
    <button type="button" class="dropdown">
      {{ label }}
      <ion-icon name="chevron-down-outline"></ion-icon>
    </button>
  `,
  styles: [`
    .dropdown {
      display: flex;
      align-items: center;
      gap: 6px;
      border-radius: 8px;
      padding: 6px 12px;
      background: var(--admin-card);
      border: 1px solid var(--admin-border);
      color: var(--admin-text);
      font-size: 11px;
      font-weight: 600;
      font-family: var(--rooster-font-sans);
      cursor: pointer;
    }
    .dropdown ion-icon { font-size: 14px; color: var(--admin-text-muted); }
  `],
})
export class DropdownBtnComponent {
  @Input() label = '';
}
