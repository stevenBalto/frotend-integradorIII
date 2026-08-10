import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { InactivityService } from '../../core/services/inactivity.service';

/**
 * Aviso de sesion por inactividad para paneles administrativos (admin_sede /
 * superadmin). Cada host lo agrega a sus propios `providers: [InactivityService]`
 * (instancia aislada) y escucha `(expirar)` para cerrar la sesion real y redirigir.
 *
 * Uso:
 *   providers: [InactivityService]
 *   <idle-session-modal (expirar)="onSesionExpirada()"></idle-session-modal>
 */
@Component({
  selector: 'idle-session-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="idle-modal" *ngIf="warning$ | async">
      <div class="idle-modal__panel">
        <div class="idle-modal__icon">
          <ion-icon name="time-outline"></ion-icon>
        </div>
        <p class="idle-modal__title">¿Seguís ahí?</p>
        <p class="idle-modal__text">
          Tu sesión está por cerrarse por inactividad en
          <strong>{{ remaining$ | async }}s</strong>.
        </p>
        <div class="idle-modal__actions">
          <button type="button" class="idle-modal__btn idle-modal__btn--ghost" (click)="cerrarAhora()">
            Cerrar sesión
          </button>
          <button type="button" class="idle-modal__btn idle-modal__btn--primary" (click)="seguirConectado()">
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .idle-modal {
      position: fixed;
      inset: 0;
      z-index: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(20, 20, 20, 0.6);
      font-family: var(--rooster-font-sans, system-ui);
    }
    .idle-modal__panel {
      width: 100%;
      max-width: 340px;
      background: var(--admin-card, #fff);
      border-radius: 16px;
      padding: 24px 22px 20px;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    }
    .idle-modal__icon {
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
    .idle-modal__title {
      margin: 0 0 6px;
      font-size: 17px;
      font-weight: 800;
      color: var(--admin-text, #1e1e1e);
    }
    .idle-modal__text {
      margin: 0 0 18px;
      font-size: 13px;
      color: var(--admin-text-muted, #6b7280);
      line-height: 1.5;
    }
    .idle-modal__text strong { color: var(--rooster-red, #e13642); }
    .idle-modal__actions { display: flex; gap: 10px; }
    .idle-modal__btn {
      flex: 1;
      padding: 11px 10px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      font-family: inherit;
      border: none;
      cursor: pointer;
    }
    .idle-modal__btn--ghost {
      background: var(--admin-neutral1, #f3f4f6);
      color: var(--admin-text, #1e1e1e);
    }
    .idle-modal__btn--primary {
      background: var(--rooster-red, #e13642);
      color: #fff;
    }
  `],
})
export class IdleSessionModalComponent implements OnInit, OnDestroy {
  private inactivity = inject(InactivityService);

  /** Minutos sin actividad antes de mostrar el aviso. */
  @Input() avisoMinutos = 15;
  /** Segundos de cuenta regresiva del aviso antes de cerrar sesion. */
  @Input() cuentaRegresivaSegundos = 60;
  /** Tope absoluto de sesion (horas), aunque el usuario este activo todo el tiempo. */
  @Input() maxSesionHoras = 10;

  /** Se emite una vez cuando hay que cerrar la sesion de verdad (backend + redirect). */
  @Output() expirar = new EventEmitter<void>();

  readonly warning$ = this.inactivity.warning$;
  readonly remaining$ = this.inactivity.remainingSeconds$;

  private expiredSub?: Subscription;

  ngOnInit(): void {
    this.inactivity.configure({
      avisoMinutos: this.avisoMinutos,
      cuentaRegresivaSegundos: this.cuentaRegresivaSegundos,
      maxSesionHoras: this.maxSesionHoras,
    });
    this.inactivity.start();
    this.expiredSub = this.inactivity.expired$.subscribe(() => this.expirar.emit());
  }

  seguirConectado(): void {
    this.inactivity.extender();
  }

  cerrarAhora(): void {
    this.expirar.emit();
  }

  ngOnDestroy(): void {
    this.expiredSub?.unsubscribe();
    this.inactivity.stop();
  }
}
