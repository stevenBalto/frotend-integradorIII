import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

/** Variante visual: define el color del icono y del boton de confirmar. */
export type ConfirmTono = 'normal' | 'peligro';

/**
 * Dialogo de confirmacion propio de la app, centrado en pantalla.
 *
 * Reemplaza a `window.confirm()`/`window.alert()`, que ademas de verse como un
 * cartel del navegador ("localhost:4200 says") pegado arriba y sin estilo,
 * tienen un problema real: **Chrome sale del fullscreen cuando se abre un
 * dialogo nativo de JS**. Eso rompia el modo extendido de Pedidos (el
 * `fullscreenchange` disparaba `cerrarPantallaCompleta()`). Al ser un dialogo
 * dentro del documento, esto no pasa.
 *
 * No se usa directo: se abre con `ConfirmService`, que lo monta y lo destruye.
 */
@Component({
  selector: 'confirm-dialog',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <!-- keydown se maneja ACA y no en document: el foco vive adentro del dialogo,
         asi que el evento pasa por este nodo y podemos frenarlo antes de que llegue
         a los @HostListener de la pagina de atras (ej. el Esc que cierra el modo
         extendido de Pedidos). -->
    <div
      class="cdlg"
      [class.cdlg--saliendo]="cerrando"
      role="alertdialog"
      aria-modal="true"
      [attr.aria-label]="titulo"
      (keydown)="onKeydown($event)"
      (click)="onBackdrop($event)"
    >
      <div class="cdlg__panel" #panel tabindex="-1">
        <div class="cdlg__icon" [class.cdlg__icon--peligro]="tono === 'peligro'">
          <ion-icon [name]="icono"></ion-icon>
        </div>

        <p class="cdlg__title">{{ titulo }}</p>
        <p class="cdlg__text" *ngIf="mensaje">{{ mensaje }}</p>

        <div class="cdlg__actions" [class.cdlg__actions--sola]="soloAceptar">
          <button
            *ngIf="!soloAceptar"
            type="button"
            class="cdlg__btn cdlg__btn--ghost"
            (click)="responder(false)"
          >
            {{ textoCancelar }}
          </button>
          <button
            #confirmBtn
            type="button"
            class="cdlg__btn"
            [class.cdlg__btn--peligro]="tono === 'peligro'"
            [class.cdlg__btn--primary]="tono !== 'peligro'"
            (click)="responder(true)"
          >
            {{ textoConfirmar }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cdlg {
      position: fixed;
      inset: 0;
      /* Por encima de los overlays de Ionic (~1001) y del overlay .ped-fs. */
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(20, 17, 15, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      font-family: var(--rooster-font-sans, system-ui);
      animation: cdlg-fade 0.18s ease both;
    }
    .cdlg--saliendo { animation: cdlg-fade 0.14s ease both reverse; }

    .cdlg__panel {
      width: 100%;
      max-width: 360px;
      background: var(--admin-card, #fff);
      border-radius: 18px;
      padding: 24px 22px 20px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      outline: none;
      animation: cdlg-pop 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .cdlg--saliendo .cdlg__panel { animation: none; }

    .cdlg__icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 12px;
      border-radius: 50%;
      background: rgba(225, 54, 66, 0.12);
      color: var(--rooster-red, #e13642);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }
    .cdlg__icon--peligro {
      background: rgba(150, 26, 36, 0.12);
      color: #961a24;
    }

    .cdlg__title {
      margin: 0 0 6px;
      font-size: 17px;
      font-weight: 800;
      line-height: 1.35;
      color: var(--admin-text, #1e1e1e);
    }
    .cdlg__text {
      margin: 0 0 18px;
      font-size: 13px;
      color: var(--admin-text-muted, #6b7280);
      line-height: 1.5;
    }
    .cdlg__title:last-of-type { margin-bottom: 18px; }

    .cdlg__actions { display: flex; gap: 10px; }
    .cdlg__actions--sola { justify-content: center; }
    .cdlg__actions--sola .cdlg__btn { flex: 0 1 160px; }

    .cdlg__btn {
      flex: 1;
      padding: 11px 10px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      border: none;
      cursor: pointer;
      transition: filter 0.15s ease;
    }
    .cdlg__btn:hover { filter: brightness(0.94); }
    .cdlg__btn:focus-visible { outline: 2px solid var(--rooster-red, #e13642); outline-offset: 2px; }
    .cdlg__btn--ghost {
      background: var(--admin-neutral1, #f3f4f6);
      color: var(--admin-text, #1e1e1e);
    }
    .cdlg__btn--primary { background: var(--rooster-red, #e13642); color: #fff; }
    .cdlg__btn--peligro { background: #961a24; color: #fff; }

    @keyframes cdlg-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cdlg-pop {
      from { opacity: 0; transform: translateY(8px) scale(0.96); }
      to   { opacity: 1; transform: none; }
    }

    @media (prefers-reduced-motion: reduce) {
      .cdlg, .cdlg__panel { animation: none; }
    }
  `],
})
export class ConfirmDialogComponent implements AfterViewInit {
  @Input() titulo = '¿Confirmar?';
  @Input() mensaje = '';
  @Input() textoConfirmar = 'Confirmar';
  @Input() textoCancelar = 'Cancelar';
  @Input() tono: ConfirmTono = 'normal';
  /** Modo aviso: un solo boton, sin cancelar (reemplazo de `window.alert`). */
  @Input() soloAceptar = false;
  @Input() icono = 'help-circle-outline';

  /** true = confirmo, false = cancelo. Lo consume `ConfirmService`. */
  @Output() resolver = new EventEmitter<boolean>();

  cerrando = false;

  @ViewChild('panel') private panel?: ElementRef<HTMLElement>;
  @ViewChild('confirmBtn') private confirmBtn?: ElementRef<HTMLButtonElement>;

  /** Elemento que tenia el foco antes de abrir, para devolverselo al cerrar. */
  private focoPrevio: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.focoPrevio = document.activeElement as HTMLElement | null;
    // El boton de confirmar arranca con el foco: se puede responder con Enter.
    this.confirmBtn?.nativeElement.focus();
  }

  onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      // stopPropagation es lo que evita que el Esc llegue al @HostListener de la
      // pagina de atras y cierre, por ejemplo, el modo extendido de Pedidos.
      ev.stopPropagation();
      ev.preventDefault();
      this.responder(false);
      return;
    }

    if (ev.key === 'Tab') {
      this.atraparFoco(ev);
    }
  }

  /** Click afuera del panel = cancelar (en modo aviso no cierra: hay que aceptar). */
  onBackdrop(ev: MouseEvent): void {
    if (this.soloAceptar) {
      return;
    }
    if (!this.panel?.nativeElement.contains(ev.target as Node)) {
      this.responder(false);
    }
  }

  responder(valor: boolean): void {
    if (this.cerrando) {
      return;
    }
    this.cerrando = true;
    // Se devuelve el foco a donde estaba: en el modo extendido de Pedidos esto
    // evita que el usuario quede "flotando" sin foco tras responder.
    this.focoPrevio?.focus?.();
    this.resolver.emit(valor);
  }

  /** Ciclo de Tab acotado a los botones del dialogo. */
  private atraparFoco(ev: KeyboardEvent): void {
    const foco = Array.from(
      this.panel?.nativeElement.querySelectorAll<HTMLButtonElement>('button') ?? [],
    );
    if (foco.length === 0) {
      return;
    }
    const primero = foco[0];
    const ultimo = foco[foco.length - 1];
    const activo = document.activeElement;

    if (ev.shiftKey && activo === primero) {
      ev.preventDefault();
      ultimo.focus();
    } else if (!ev.shiftKey && activo === ultimo) {
      ev.preventDefault();
      primero.focus();
    }
  }
}
