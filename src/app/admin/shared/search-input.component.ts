import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';

/** Clase que el buscador pone en su contenedor-fila al abrirse, para que el CSS global
 *  oculte los demas controles/filtros de esa fila (regla en global.scss). */
const CLASE_FILA_ABIERTA = 'admin-search-open';

/**
 * Buscador colapsable/animado del sistema (mismo comportamiento en toda vista, admin o cliente).
 * Colapsado: solo la lupa. Al tocarla, el input se despliega en overlay (animacion de ancho)
 * creciendo desde la lupa hacia la izquierda, con fondo opaco que tapa los filtros de su fila.
 * Al click-fuera se colapsa. Mantiene el contrato: [(value)] + (searchChange) + placeholder.
 * El input es position:absolute relativo a .asi (position:relative) y desborda hacia la izquierda,
 * NO usa position:fixed (evita EF-16/EF-18 del contain:size de .ion-page).
 */
@Component({
  selector: 'admin-search-input',
  standalone: false,
  template: `
    <div class="asi" [class.asi--open]="abierto" #box>
      <button type="button" class="asi__toggle" (click)="toggle($event)" aria-label="Buscar">
        <ion-icon name="search-outline"></ion-icon>
      </button>
      <input
        #inp
        class="asi__input"
        [placeholder]="placeholder"
        [value]="value"
        [attr.maxlength]="maxlength"
        (input)="onInput($event)"
        (keydown.escape)="cerrar()"
      />
    </div>
  `,
  styles: [`
    :host { display: inline-flex; }
    .asi { position: relative; display: inline-flex; align-items: center; }
    .asi__toggle {
      width: 36px;
      height: 36px;
      border-radius: 9999px;
      background: var(--admin-panel);
      border: 1px solid var(--admin-border);
      color: var(--admin-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      position: relative;      /* por encima del input abierto: se puede cerrar tocandola */
      z-index: 31;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .asi__toggle ion-icon { font-size: 15px; }
    .asi__toggle:hover { border-color: var(--rooster-red); }
    .asi--open .asi__toggle { border-color: var(--rooster-red); color: var(--rooster-red); }
    .asi__input {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;                /* ancla en la lupa; crece hacia la izquierda */
      width: 0;
      opacity: 0;
      pointer-events: none;
      z-index: 30;
      box-sizing: border-box;
      padding: 0 44px 0 16px;  /* aire a la derecha para la lupa que queda encima */
      border: 1px solid var(--rooster-red);
      border-radius: 9999px;
      background: var(--admin-card);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.14);
      font-size: 13px;
      font-family: var(--rooster-font-sans);
      color: var(--admin-text);
      outline: none;
      white-space: nowrap;
      overflow: hidden;
      transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease;
    }
    .asi--open .asi__input {
      /* --asi-width: override por instancia (custom property, atraviesa la
         view encapsulation) para cards angostas donde 240px choca con el título. */
      width: min(var(--asi-width, 240px), 74vw);
      opacity: 1;
      pointer-events: auto;
    }
  `],
})
export class SearchInputComponent {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input() placeholder = '';
  @Input() value = '';
  /** Límite de caracteres del texto de búsqueda (coherente con lo que se busca). */
  @Input() maxlength = 60;
  @Output() valueChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  /** Emite true/false al abrir/cerrar (para vistas cuyos filtros NO son hermanos directos). */
  @Output() openChange = new EventEmitter<boolean>();

  abierto = false;

  @ViewChild('box') box?: ElementRef<HTMLElement>;
  @ViewChild('inp') inp?: ElementRef<HTMLInputElement>;

  onInput(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.valueChange.emit(texto);
    this.searchChange.emit(texto);
  }

  /** Abre/cierra el buscador. stopPropagation evita que el mismo click dispare el cierre por click-fuera. */
  toggle(ev: Event): void {
    ev.stopPropagation();
    this.setAbierto(!this.abierto);
    if (this.abierto) {
      setTimeout(() => this.inp?.nativeElement.focus(), 0);
    }
  }

  cerrar(): void {
    this.setAbierto(false);
  }

  /**
   * Cierra al tocar fuera del componente.
   *
   * Escucha `pointerdown` y no `click` a propósito: al seleccionar texto
   * arrastrando (o tras un Ctrl+A), el gesto empieza dentro del input y termina
   * fuera, y el navegador dispara el `click` en el ANCESTRO COMÚN. Con `click`,
   * `host.contains(target)` daba verdadero y el buscador se quedaba abierto.
   * `pointerdown` se evalúa donde empieza el gesto, que es lo que interesa.
   */
  @HostListener('document:pointerdown', ['$event'])
  onDocPointerDown(ev: PointerEvent): void {
    if (!this.abierto) return;
    const host = this.box?.nativeElement;
    if (host && !host.contains(ev.target as Node)) {
      this.setAbierto(false);
    }
  }

  /** Cambia el estado y marca al contenedor-fila para que el CSS global oculte los filtros hermanos. */
  private setAbierto(v: boolean): void {
    if (this.abierto === v) return;
    this.abierto = v;
    this.el.nativeElement.parentElement?.classList.toggle(CLASE_FILA_ABIERTA, v);
    this.openChange.emit(v);

    if (!v) {
      this.limpiarFocoYSeleccion();
    }
  }

  /**
   * Al cerrar hay que soltar el input, no solo animar su ancho a 0.
   *
   * Con un texto largo el input queda desplazado por dentro (scrollLeft > 0) y,
   * si además está TODO seleccionado (Ctrl+A), el navegador sigue pintando esa
   * selección fuera del control aunque el contenedor tenga overflow:hidden — se
   * ve el texto "escapado" del buscador. Quitando foco, selección y scroll el
   * input queda realmente vacío a la vista.
   */
  private limpiarFocoYSeleccion(): void {
    const input = this.inp?.nativeElement;
    if (!input) return;

    input.blur();
    input.setSelectionRange(0, 0);
    input.scrollLeft = 0;
  }
}
