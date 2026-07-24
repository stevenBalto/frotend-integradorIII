import { Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido } from '../../core/models/pedido.model';
import { MODALIDAD_LABEL } from '../../shared/constants/modalidad';

/** Historial de compras: pedidos ya pagados (salen de "Mis pedidos"). */
@Component({
  selector: 'app-historial',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .hist-card { }
    .hist-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
    .hist-codigo-row { display: flex; align-items: center; gap: 6px; }
    .hist-codigo { font-family: var(--rooster-font-sans); font-size: 15px; font-weight: 800; color: var(--rooster-dark); }
    .hist-copy {
      width: 24px; height: 24px; border: none; border-radius: 7px; background: #fff1f2;
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      ion-icon { font-size: 13px; color: var(--rooster-red); }
      &:active { transform: scale(0.9); }
    }
    .hist-badge { font-family: var(--rooster-font-sans); font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; background: #DCFCE7; color: #15803D; flex-shrink: 0; }
    .hist-fecha { font-family: var(--rooster-font-sans); font-size: 11px; color: var(--rooster-brown); margin: 0 0 10px; }
    .hist-item { display: flex; justify-content: space-between; gap: 8px; font-family: var(--rooster-font-sans); font-size: 12px; color: var(--rooster-dark); margin-bottom: 4px; }
    .hist-item__name { font-weight: 600; }
    .hist-foot { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(0,0,0,0.06); margin-top: 8px; padding-top: 10px; }
    .hist-suc { font-family: var(--rooster-font-sans); font-size: 12px; color: var(--rooster-brown); display: flex; align-items: center; gap: 4px; ion-icon { font-size: 14px; } }
    .hist-total { font-family: var(--rooster-font-sans); font-size: 15px; font-weight: 800; color: var(--rooster-red); }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Historial de compras</h2>
      </div>

      <div class="sub-body">
        <p class="sub-status" *ngIf="cargando">Cargando historial...</p>
        <p class="sub-status" *ngIf="error">{{ error }}</p>

        <div class="sub-card hist-card" *ngFor="let p of pedidos">
          <div class="hist-top">
            <div class="hist-codigo-row">
              <span class="hist-codigo">{{ p.codigo }}</span>
              <button class="hist-copy" (click)="copiar(p.codigo)" aria-label="Copiar código">
                <ion-icon name="copy-outline"></ion-icon>
              </button>
            </div>
            <span class="hist-badge">Pagado</span>
          </div>
          <p class="hist-fecha">{{ formatFecha(p.created_at) }}</p>

          <div class="hist-item" *ngFor="let it of p.items">
            <span class="hist-item__name">{{ it.cantidad }}x {{ it.producto_nombre }}<span *ngIf="it.tamano_nombre"> ({{ it.tamano_nombre }})</span></span>
            <span>{{ it.subtotal | crcCurrency }}</span>
          </div>

          <div class="hist-foot">
            <span class="hist-suc"><ion-icon name="location-outline"></ion-icon>{{ p.sucursal.nombre }} · {{ MODALIDAD_LABEL[p.modalidad] }}</span>
            <span class="hist-total">{{ p.total | crcCurrency }}</span>
          </div>
        </div>

        <p class="sub-empty" *ngIf="!cargando && !error && pedidos.length === 0">
          Todavía no tenés compras pagadas. Cuando pagués un pedido en caja, aparecerá aquí.
        </p>
      </div>
    </ion-content>
  `,
})
export class HistorialPage implements OnInit {
  pedidos: Pedido[] = [];
  cargando = false;
  error: string | null = null;
  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  constructor(
    private pedidoService: PedidoService,
    private toast: ToastController,
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    this.pedidoService.misPedidos().subscribe({
      next: (pedidos) => {
        this.pedidos = pedidos.filter((p) => p.pagado);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el historial.';
        this.cargando = false;
      },
    });
  }

  async copiar(codigo: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(codigo);
      const t = await this.toast.create({ message: 'Código copiado', duration: 1500, position: 'bottom', color: 'success' });
      await t.present();
    } catch {
      // Clipboard no disponible; ignorar.
    }
  }

  formatFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
