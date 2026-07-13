import { Component, EventEmitter, Input, Output } from '@angular/core';

/** Input de búsqueda del panel, con filtrado en vivo via [(value)]. */
@Component({
  selector: 'admin-search-input',
  standalone: false,
  template: `
    <div class="search">
      <ion-icon name="search-outline"></ion-icon>
      <input
        [placeholder]="placeholder"
        [value]="value"
        maxlength="100"
        (input)="onInput($event)"
      />
    </div>
  `,
  styles: [`
    .search {
      display: flex;
      align-items: center;
      gap: 8px;
      border-radius: 8px;
      padding: 8px 12px;
      background: var(--admin-card);
      border: 1px solid var(--admin-border);
    }
    .search ion-icon { font-size: 13px; color: var(--admin-text-soft); flex-shrink: 0; }
    .search input {
      background: transparent;
      border: none;
      outline: none;
      font-size: 12px;
      width: 128px;
      font-family: var(--rooster-font-sans);
      color: var(--admin-text);
    }
  `],
})
export class SearchInputComponent {
  @Input() placeholder = '';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.valueChange.emit(texto);
  }
}
