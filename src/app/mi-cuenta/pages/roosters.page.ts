import { Component, OnInit } from '@angular/core';
import { PuntosService } from '../../core/services/puntos.service';
import { RoostersResumen, MovimientoRooster } from '../../core/models/puntos.model';

/** Roosters acumulados: saldo, acumulado, canjeado y movimientos (estilo Taco Bell). */
@Component({
  selector: 'app-roosters',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .roo-hero {
      border-radius: 20px;
      padding: 22px;
      text-align: center;
      background: linear-gradient(135deg, #7a1f27 0%, var(--rooster-red, #e13642) 100%);
      box-shadow: 0 10px 28px rgba(225,54,66,0.3);
      margin-bottom: 16px;
    }
    .roo-hero__label { font-family: var(--rooster-font-sans); font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85); margin: 0 0 4px; }
    .roo-hero__balance { font-family: var(--rooster-font-serif); font-size: 40px; font-weight: 800; color: #fff; margin: 0; }
    .roo-hero__hint { font-family: var(--rooster-font-sans); font-size: 12px; color: rgba(255,255,255,0.85); margin: 8px 0 0; }
    .roo-stats { display: flex; gap: 12px; margin-bottom: 18px; }
    .roo-stat {
      flex: 1; background: #fff; border-radius: 14px; padding: 14px; text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05);
    }
    .roo-stat__value { font-family: var(--rooster-font-serif); font-size: 18px; font-weight: 800; margin: 0; }
    .roo-stat__value--in { color: #15803d; }
    .roo-stat__value--out { color: var(--rooster-red); }
    .roo-stat__label { font-family: var(--rooster-font-sans); font-size: 11px; color: var(--rooster-brown); margin: 4px 0 0; }
    .roo-section-title { font-family: var(--rooster-font-sans); font-size: 12px; font-weight: 700; color: var(--rooster-brown); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 4px; }
    .roo-mov {
      display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 12px;
      padding: 12px 14px; margin-bottom: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .roo-mov__icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .roo-mov__icon--in { background: #ecfdf3; ion-icon { color: #15803d; } }
    .roo-mov__icon--out { background: #fff1f2; ion-icon { color: var(--rooster-red); } }
    .roo-mov__icon ion-icon { font-size: 17px; }
    .roo-mov__info { flex: 1; min-width: 0; }
    .roo-mov__desc { font-family: var(--rooster-font-sans); font-size: 13px; font-weight: 600; color: var(--rooster-dark); margin: 0; }
    .roo-mov__date { font-family: var(--rooster-font-sans); font-size: 11px; color: var(--rooster-brown); margin: 2px 0 0; }
    .roo-mov__amount { font-family: var(--rooster-font-sans); font-size: 14px; font-weight: 800; flex-shrink: 0; }
    .roo-mov__amount--in { color: #15803d; }
    .roo-mov__amount--out { color: var(--rooster-red); }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Roosters acumulados</h2>
      </div>

      <div class="sub-body">
        <p class="sub-status" *ngIf="cargando">Cargando tus Roosters...</p>
        <p class="sub-status" *ngIf="error">{{ error }}</p>

        <ng-container *ngIf="resumen && !cargando">
          <div class="roo-hero">
            <p class="roo-hero__label">Saldo disponible</p>
            <p class="roo-hero__balance">{{ resumen.balance | crcCurrency }}</p>
            <p class="roo-hero__hint">1 Rooster = ₡1 · canjealos en tu próximo pedido</p>
          </div>

          <div class="roo-stats">
            <div class="roo-stat">
              <p class="roo-stat__value roo-stat__value--in">{{ resumen.total_ganado | crcCurrency }}</p>
              <p class="roo-stat__label">Acumulados</p>
            </div>
            <div class="roo-stat">
              <p class="roo-stat__value roo-stat__value--out">{{ resumen.total_canjeado | crcCurrency }}</p>
              <p class="roo-stat__label">Canjeados</p>
            </div>
          </div>

          <p class="roo-section-title">Movimientos</p>
          <div class="roo-mov" *ngFor="let m of resumen.movimientos">
            <div class="roo-mov__icon" [ngClass]="m.puntos >= 0 ? 'roo-mov__icon--in' : 'roo-mov__icon--out'">
              <ion-icon [name]="m.puntos >= 0 ? 'add-outline' : 'remove-outline'"></ion-icon>
            </div>
            <div class="roo-mov__info">
              <p class="roo-mov__desc">{{ m.descripcion || (m.puntos >= 0 ? 'Roosters ganados' : 'Roosters canjeados') }}</p>
              <p class="roo-mov__date">{{ formatFecha(m.creado_en) }}</p>
            </div>
            <span class="roo-mov__amount" [ngClass]="m.puntos >= 0 ? 'roo-mov__amount--in' : 'roo-mov__amount--out'">
              {{ m.puntos >= 0 ? '+' : '-' }}{{ abs(m.puntos) | crcCurrency }}
            </span>
          </div>

          <p class="sub-empty" *ngIf="resumen.movimientos.length === 0">
            Todavía no tenés movimientos. Hacé un pedido para empezar a ganar Roosters.
          </p>
        </ng-container>
      </div>
    </ion-content>
  `,
})
export class RoostersPage implements OnInit {
  resumen: RoostersResumen | null = null;
  cargando = false;
  error: string | null = null;

  constructor(private puntosService: PuntosService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.puntosService.misRoosters().subscribe({
      next: (r) => {
        this.resumen = r;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar tus Roosters.';
        this.cargando = false;
      },
    });
  }

  abs(n: number): number {
    return Math.abs(n);
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
