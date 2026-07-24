import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Usuario } from '../../core/models/usuario.model';

/** "Mi cuenta": muestra los datos con los que el usuario se registró. */
@Component({
  selector: 'app-perfil',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .perfil-top { display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 18px; }
    .perfil-avatar {
      width: 82px; height: 82px; border-radius: 26px; background: #fff1f2;
      display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
      ion-icon { font-size: 44px; color: var(--rooster-red); }
    }
    .perfil-nombre { font-family: var(--rooster-font-serif); font-size: 21px; font-weight: 700; color: var(--rooster-dark); margin: 0; }
    .perfil-rol { font-family: var(--rooster-font-sans); font-size: 12px; color: var(--rooster-brown); margin: 4px 0 0; text-transform: capitalize; }
    .dato {
      display: flex; align-items: center; gap: 12px; padding: 14px 4px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      &:last-child { border-bottom: none; }
    }
    .dato__icon { width: 36px; height: 36px; border-radius: 11px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; ion-icon { font-size: 17px; color: var(--rooster-brown); } }
    .dato__label { font-family: var(--rooster-font-sans); font-size: 11px; color: var(--rooster-brown); margin: 0; }
    .dato__value { font-family: var(--rooster-font-sans); font-size: 14px; font-weight: 600; color: var(--rooster-dark); margin: 1px 0 0; }
    .perfil-action {
      display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 16px;
      background: #fff; border: none; border-radius: 14px; margin-top: 14px; cursor: pointer;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      ion-icon:first-child { font-size: 18px; color: var(--rooster-red); }
      &:active { transform: scale(0.99); }
    }
    .perfil-action__label { flex: 1; text-align: left; font-family: var(--rooster-font-sans); font-size: 14px; font-weight: 600; color: var(--rooster-dark); }
    .perfil-action__arrow { font-size: 16px; color: var(--rooster-gold, #a8895e); }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Mi cuenta</h2>
      </div>

      <div class="sub-body" *ngIf="(usuario$ | async) as u">
        <div class="perfil-top">
          <div class="perfil-avatar"><ion-icon name="person-circle-outline"></ion-icon></div>
          <p class="perfil-nombre">{{ u.nombre }}</p>
          <p class="perfil-rol">{{ u.rol }}</p>
        </div>

        <div class="sub-card">
          <div class="dato">
            <div class="dato__icon"><ion-icon name="mail-outline"></ion-icon></div>
            <div><p class="dato__label">Correo</p><p class="dato__value">{{ u.email }}</p></div>
          </div>
          <div class="dato">
            <div class="dato__icon"><ion-icon name="call-outline"></ion-icon></div>
            <div><p class="dato__label">Teléfono</p><p class="dato__value">{{ u.telefono || 'Sin teléfono' }}</p></div>
          </div>
          <div class="dato">
            <div class="dato__icon"><ion-icon name="ribbon-outline"></ion-icon></div>
            <div><p class="dato__label">Roosters</p><p class="dato__value">{{ u.puntos_balance | crcCurrency }}</p></div>
          </div>
        </div>

        <button class="perfil-action" routerLink="/cambiar-password">
          <ion-icon name="lock-closed-outline"></ion-icon>
          <span class="perfil-action__label">Cambiar contraseña</span>
          <ion-icon name="chevron-forward-outline" class="perfil-action__arrow"></ion-icon>
        </button>
      </div>
    </ion-content>
  `,
})
export class PerfilPage implements OnInit {
  readonly usuario$: Observable<Usuario | null>;

  constructor(private auth: AuthService) {
    this.usuario$ = this.auth.usuarioActual$;
  }

  ngOnInit(): void {
    // Refresca datos por si cambiaron (ej. saldo de Roosters tras un pedido).
    this.auth.refrescarPerfil().subscribe({ error: () => {} });
  }
}
