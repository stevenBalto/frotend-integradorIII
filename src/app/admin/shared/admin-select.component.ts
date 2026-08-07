import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  HostListener,
  Inject,
  Input,
  OnDestroy,
  Output,
  QueryList,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * Opción de <admin-select>. Reemplaza 1:1 a un <option> nativo: acepta `value`
 * (equivalente a [ngValue]) y su contenido proyectado es la etiqueta, así que
 * siguen funcionando *ngFor, interpolaciones y pipes.
 */
@Component({
  selector: 'admin-option',
  standalone: false,
  template: `
    <span class="opt__label"><ng-content></ng-content></span>
    <ion-icon class="opt__check" name="checkmark-outline" *ngIf="seleccionada"></ion-icon>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-family: var(--rooster-font-sans);
        font-size: 12px;
        color: var(--admin-text);
        white-space: nowrap;
      }
      :host(.opt--resaltada) { background: var(--admin-panel); }
      :host(.opt--seleccionada) {
        background: rgba(225, 54, 66, 0.08);
        color: var(--admin-accent);
        font-weight: 600;
      }
      :host(.opt--deshabilitada) {
        color: var(--admin-text-muted);
        cursor: default;
      }
      .opt__check { font-size: 14px; flex: 0 0 auto; }
    `,
  ],
})
export class AdminOptionComponent {
  @Input() value: unknown;
  @Input() disabled = false;

  @HostBinding('class.opt--seleccionada') seleccionada = false;
  @HostBinding('class.opt--resaltada') resaltada = false;
  @HostBinding('attr.role') readonly rol = 'option';

  constructor(
    readonly el: ElementRef<HTMLElement>,
    @Inject(forwardRef(() => AdminSelectComponent)) private readonly select: AdminSelectComponent,
  ) {}

  @HostBinding('class.opt--deshabilitada')
  get esDeshabilitada(): boolean {
    return this.disabled;
  }

  /** Texto que muestra el disparador cuando esta opción está elegida. */
  get etiqueta(): string {
    return (this.el.nativeElement.textContent ?? '').trim();
  }

  @HostListener('click')
  onClick(): void {
    if (!this.disabled) {
      this.select.elegir(this);
    }
  }
}

/**
 * Select propio del panel admin.
 *
 * Existe porque la lista desplegable de un <select> nativo la dibuja el sistema
 * operativo: no acepta border-radius ni ningún estilo (limitación del navegador).
 * Este componente la dibuja en HTML, así que el panel puede ir redondeado y con la
 * paleta del proyecto.
 *
 * Uso (reemplazo 1:1 del nativo, funciona con ngModel y con formControlName):
 *   <admin-select [(ngModel)]="rangoDias">
 *     <admin-option *ngFor="let op of rangos" [value]="op.v">{{ op.l }}</admin-option>
 *   </admin-select>
 *
 * El panel se mantiene SIEMPRE en el DOM (se oculta por CSS, no con *ngIf) para
 * poder leer la etiqueta de la opción elegida desde su contenido proyectado.
 */
@Component({
  selector: 'admin-select',
  standalone: false,
  exportAs: 'adminSelect',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdminSelectComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      class="sel__trigger"
      [class.sel__trigger--abierto]="abierto"
      [class.sel__trigger--placeholder]="!haySeleccion"
      [disabled]="disabled"
      role="combobox"
      [attr.aria-expanded]="abierto"
      [attr.aria-label]="ariaLabel || null"
      (click)="alternar()"
      (keydown)="onTeclaDisparador($event)"
    >
      <span class="sel__texto">{{ textoVisible }}</span>
      <ion-icon class="sel__chevron" name="chevron-down-outline"></ion-icon>
    </button>

    <div
      class="sel__panel"
      [class.sel__panel--abierto]="abierto"
      [class.sel__panel--arriba]="abrirHaciaArriba"
      role="listbox"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      /* Las páginas ajustan el disparador con estas variables (alto, tipografía,
         fondo) en vez de aplicarle su clase de input al host: si le pusieran su
         clase, el borde de la clase y el del disparador se dibujarían los dos. */
      :host {
        position: relative;
        display: inline-block;
        font-family: var(--rooster-font-sans);
      }
      .sel__trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        height: var(--admin-select-height, auto);
        /* Mismo radio que tenían los <select> del panel. */
        border-radius: var(--admin-select-radius, 12px);
        border: 1px solid var(--admin-border);
        background: var(--admin-select-bg, var(--admin-card));
        color: var(--admin-text);
        font-family: inherit;
        font-size: var(--admin-select-font-size, 12px);
        font-weight: var(--admin-select-font-weight, 600);
        padding: var(--admin-select-padding, 8px 12px);
        cursor: pointer;
        transition: border-color 0.15s;
      }
      .sel__trigger:hover:not(:disabled) { border-color: rgba(225, 54, 66, 0.4); }
      .sel__trigger--abierto {
        border-color: var(--admin-accent);
        box-shadow: 0 0 0 1px var(--admin-accent);
      }
      .sel__trigger--placeholder { color: var(--admin-text-muted); font-weight: 500; }
      .sel__trigger:disabled { opacity: 0.6; cursor: not-allowed; }
      .sel__texto {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sel__chevron {
        flex: 0 0 auto;
        font-size: 14px;
        color: var(--admin-text-muted);
        transition: transform 0.15s;
      }
      .sel__trigger--abierto .sel__chevron { transform: rotate(180deg); }

      /* El panel NO se desmonta (se oculta) para poder leer las etiquetas
         proyectadas aunque esté cerrado. */
      .sel__panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        min-width: 100%;
        max-height: 240px;
        overflow-y: auto;
        z-index: 220;
        display: none;
        flex-direction: column;
        gap: 2px;
        padding: 6px;
        /* Lo que el <select> nativo no dejaba hacer: esquinas redondeadas. */
        border-radius: 12px;
        border: 1px solid var(--admin-border);
        background: var(--admin-card);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      }
      .sel__panel--abierto { display: flex; }
      .sel__panel--arriba {
        top: auto;
        bottom: calc(100% + 6px);
      }
    `,
  ],
})
export class AdminSelectComponent implements AfterContentInit, ControlValueAccessor, OnDestroy {
  /** Texto cuando no hay nada elegido (equivale al <option> deshabilitado del nativo). */
  @Input() placeholder = 'Seleccioná una opción';
  @Input() ariaLabel = '';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<unknown>();

  @ContentChildren(AdminOptionComponent) opciones!: QueryList<AdminOptionComponent>;

  abierto = false;
  abrirHaciaArriba = false;

  private valor: unknown = null;
  private resaltadoIdx = -1;
  private subOpciones?: Subscription;
  private alTocar: () => void = () => undefined;
  private alCambiar: (valor: unknown) => void = () => undefined;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly cd: ChangeDetectorRef,
  ) {}

  /**
   * Valor actual, para leerlo con una referencia de plantilla igual que el nativo
   * (`#x="adminSelect"` … `x.value`). Se tipa `any` a propósito: el valor lo define
   * cada `<admin-option>` y el nativo expone `.value` sin tipo útil tampoco.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get value(): any {
    return this.valor;
  }

  get haySeleccion(): boolean {
    return !!this.opcionElegida;
  }

  get textoVisible(): string {
    return this.opcionElegida?.etiqueta ?? this.placeholder;
  }

  ngAfterContentInit(): void {
    this.sincronizar();
    // Las opciones pueden llegar después (*ngFor sobre datos de la API).
    this.subOpciones = this.opciones.changes.subscribe(() => {
      this.sincronizar();
      this.cd.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subOpciones?.unsubscribe();
  }

  // ── ControlValueAccessor (ngModel y formControlName) ────────────────────────
  writeValue(valor: unknown): void {
    this.valor = valor;
    this.sincronizar();
  }

  registerOnChange(fn: (valor: unknown) => void): void {
    this.alCambiar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  // ── Interacción ─────────────────────────────────────────────────────────────
  elegir(opcion: AdminOptionComponent): void {
    this.valor = opcion.value;
    this.sincronizar();
    this.alCambiar(this.valor);
    this.valueChange.emit(this.valor);
    this.cerrar();
  }

  alternar(): void {
    if (this.disabled) {
      return;
    }
    if (this.abierto) {
      this.cerrar();
      return;
    }

    // Si el disparador está en la mitad de abajo de la pantalla, el panel abre
    // hacia arriba para no quedar cortado.
    const caja = this.host.nativeElement.getBoundingClientRect();
    this.abrirHaciaArriba = caja.bottom > window.innerHeight * 0.6;

    this.abierto = true;
    this.resaltadoIdx = this.indiceElegido();
    this.pintarResaltado();
  }

  cerrar(): void {
    if (!this.abierto) {
      return;
    }
    this.abierto = false;
    this.resaltadoIdx = -1;
    this.pintarResaltado();
    this.alTocar();
  }

  @HostListener('document:click', ['$event'])
  onClickFuera(evento: MouseEvent): void {
    if (this.abierto && !this.host.nativeElement.contains(evento.target as Node)) {
      this.cerrar();
      this.cd.markForCheck();
    }
  }

  onTeclaDisparador(evento: KeyboardEvent): void {
    const seleccionables = this.seleccionables();

    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        evento.preventDefault();
        if (!this.abierto) {
          this.alternar();
          return;
        }
        const paso = evento.key === 'ArrowDown' ? 1 : -1;
        const total = seleccionables.length;
        if (total === 0) {
          return;
        }
        const actual = seleccionables.indexOf(this.opciones.toArray()[this.resaltadoIdx]);
        const siguiente = (actual + paso + total) % total;
        this.resaltadoIdx = this.opciones.toArray().indexOf(seleccionables[siguiente]);
        this.pintarResaltado();
        break;
      }
      case 'Enter':
      case ' ': {
        evento.preventDefault();
        if (!this.abierto) {
          this.alternar();
          return;
        }
        const resaltada = this.opciones.toArray()[this.resaltadoIdx];
        if (resaltada && !resaltada.disabled) {
          this.elegir(resaltada);
        }
        break;
      }
      case 'Escape':
        if (this.abierto) {
          evento.preventDefault();
          this.cerrar();
        }
        break;
      case 'Home':
      case 'End':
        if (this.abierto && seleccionables.length) {
          evento.preventDefault();
          const objetivo =
            evento.key === 'Home' ? seleccionables[0] : seleccionables[seleccionables.length - 1];
          this.resaltadoIdx = this.opciones.toArray().indexOf(objetivo);
          this.pintarResaltado();
        }
        break;
      default:
        break;
    }
  }

  // ── Internos ────────────────────────────────────────────────────────────────
  private get opcionElegida(): AdminOptionComponent | undefined {
    return this.opciones?.find((o) => o.value === this.valor && !o.disabled);
  }

  private seleccionables(): AdminOptionComponent[] {
    return this.opciones?.filter((o) => !o.disabled) ?? [];
  }

  private indiceElegido(): number {
    const elegida = this.opcionElegida;
    const lista = this.opciones?.toArray() ?? [];
    if (elegida) {
      return lista.indexOf(elegida);
    }
    const primera = this.seleccionables()[0];
    return primera ? lista.indexOf(primera) : -1;
  }

  /** Marca cuál está elegida (para el check) y cuál está bajo el cursor de teclado. */
  private sincronizar(): void {
    if (!this.opciones) {
      return;
    }
    const elegida = this.opcionElegida;
    this.opciones.forEach((o) => (o.seleccionada = o === elegida));
  }

  private pintarResaltado(): void {
    const lista = this.opciones?.toArray() ?? [];
    lista.forEach((o, i) => (o.resaltada = i === this.resaltadoIdx));
    lista[this.resaltadoIdx]?.el.nativeElement.scrollIntoView({ block: 'nearest' });
  }
}
