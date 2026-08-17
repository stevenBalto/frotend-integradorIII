import { Component, OnInit, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { PedidoService } from '../../core/services/pedido.service';
import { Pedido } from '../../core/models/pedido.model';
import { MODALIDAD_LABEL } from '../../shared/constants/modalidad';

/** Historial de compras: pedidos ya pagados (salen de "Mis pedidos").
    Mismo estilo/comportamiento de tarjeta que Mis pedidos (.pedido-card,
    colapsa/expande al tocar) -- antes tenia su propia tarjeta "recibo" con
    alto fijo y scroll interno para los items, pero quedaba innecesariamente
    alta para compras de 1-2 items, y el pie (sucursal) se leia cortado con
    "..." sin forma de ver el nombre completo. Reusar la tarjeta de Mis
    pedidos resuelve ambas cosas: colapsada es compacta, y al expandir se ve
    todo sin truncar. */
@Component({
  selector: 'app-historial',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    /* Fondo animado de roosters (mismo que Mi cuenta/Carrito): titulo blanco
       porque en sub-page.scss es oscuro para las demas sub-paginas (claras) --
       estos estilos son de este componente solamente, no tocan sub-page.scss
       ni las paginas que la comparten. */
    .sub-title { color: #ffffff; }
    .sub-status, .sub-empty { color: rgba(255, 255, 255, 0.75); }
    .roo-page-body { position: relative; z-index: 1; }

    /* ion-header (fuera de ion-content, arriba): Ionic ya lo saca del area
       scrolleable -- no hace falta position:sticky ni fondo de ningun tipo
       para que el titulo/boton queden fijos, eso lo resuelve la estructura
       ion-header + ion-content sola. Position+z-index aca es SOLO para que
       pinte encima de .pedir-rooster-bg (fixed, z-index:0): sin esto, el
       patron animado (positioned) pintaria por ENCIMA del header (estatico)
       sin importar el orden en el DOM, tapando el titulo. */
    ion-header { position: relative; z-index: 1; }

    /* ── Tarjeta de pedido: copia exacta de .pedido-card (Mis pedidos) ──
       Duplicada aca (no importada) porque las sub-paginas de Mi cuenta ya
       usan estilos inline por componente (mismo patron que .roo-mov,
       .roo-hero, etc. en esta misma carpeta) en vez de partials compartidos. */
    .pedido-card {
      background: #fff;
      border: 1px solid rgba(20, 17, 15, 0.05);
      border-radius: var(--rooster-radius-md);
      padding: 18px;
      box-shadow: var(--rooster-shadow-sm);
      cursor: pointer;
      transition: box-shadow var(--rooster-ease-fast), transform var(--rooster-ease-fast);
      animation: rooster-rise var(--rooster-ease-med) both;
      margin-bottom: 12px;
      height: 132px;
      overflow: hidden;
    }
    .pedido-card--expanded { height: auto; overflow: visible; }
    .pedido-card:hover { box-shadow: var(--rooster-shadow-md); }
    .pedido-card:active { transform: scale(0.99); }
    .pedido-card__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .pedido-card__info { display: flex; flex-direction: column; gap: 2px; }
    .pedido-card__codigo-row { display: flex; align-items: center; gap: 6px; }
    .pedido-card__codigo { font-family: var(--client-font-body); font-size: 15px; font-weight: 800; color: var(--client-ink); letter-spacing: 0.02em; }
    .pedido-card__copy {
      display: flex; align-items: center; justify-content: center; width: 24px; height: 24px;
      border: none; border-radius: 7px; background: #fff1f2; cursor: pointer;
      transition: transform var(--rooster-ease-fast), background var(--rooster-ease-fast);
    }
    .pedido-card__copy:hover { background: #ffe4e6; }
    .pedido-card__copy:active { transform: scale(0.9); }
    .pedido-card__copy ion-icon { font-size: 13px; color: var(--client-red); }
    .pedido-card__fecha { font-family: var(--client-font-body); font-size: 11px; color: var(--client-text-muted); }
    .pedido-card__estado { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-family: var(--client-font-body); font-size: 10px; font-weight: 700; background: #DCFCE7; color: #15803D; }
    .pedido-card__row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .pedido-card__sucursal { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; font-family: var(--client-font-body); font-size: 12px; color: var(--client-text); }
    .pedido-card__sucursal ion-icon { font-size: 14px; color: var(--client-text-muted); flex-shrink: 0; }
    .pedido-card__sucursal-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pedido-card__modalidad { font-family: var(--client-font-body); font-size: 11px; color: var(--client-text-muted); padding: 3px 8px; border-radius: 6px; background: var(--client-bg); flex-shrink: 0; }
    .pedido-card__footer { display: flex; justify-content: space-between; align-items: center; }
    .pedido-card__total { font-family: var(--client-font-body); font-size: 19px; font-weight: 800; color: var(--client-red); }
    .pedido-card__expand { font-size: 20px; color: var(--client-text-muted); }
    .pedido-card__detalle { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--client-border); }
    .pedido-card__detalle-title { font-family: var(--client-font-body); font-size: 11px; font-weight: 700; color: var(--client-text-muted); text-transform: uppercase; margin: 0 0 12px; }
    .pedido-card__item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .pedido-card__item-info { display: flex; align-items: center; gap: 8px; }
    .pedido-card__item-qty { font-family: var(--client-font-body); font-size: 13px; font-weight: 700; color: var(--client-red); min-width: 24px; }
    .pedido-card__item-name { font-family: var(--client-font-body); font-size: 13px; color: var(--client-text); }
    .pedido-card__item-price { font-family: var(--client-font-body); font-size: 13px; font-weight: 600; color: var(--client-text); }
    .pedido-card__extras { padding-left: 32px; margin-bottom: 8px; }
    .pedido-card__extra { display: block; font-family: var(--client-font-body); font-size: 11px; color: var(--client-text-muted); padding: 2px 0; }
    .pedido-card__summary { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--client-border); }
    .pedido-card__summary-row { display: flex; justify-content: space-between; font-family: var(--client-font-body); font-size: 13px; color: var(--client-text); padding: 4px 0; }
    .pedido-card__summary-row--discount { color: #16A34A; }
    .pedido-card__summary-row--total { font-weight: 700; font-size: 15px; padding-top: 8px; }
    .pedido-card__summary-row--total span:last-child { color: var(--client-red); }
    .pedido-card__puntos {
      display: flex; align-items: center; gap: 6px; margin: 12px 0 0; padding: 10px; border-radius: 10px;
      background: rgba(245, 158, 11, 0.1); font-family: var(--client-font-body); font-size: 12px; font-weight: 600; color: #D97706;
    }
    .pedido-card__puntos ion-icon { font-size: 16px; }
  `],
  template: `
    <ion-header class="ion-no-border">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Historial de compras</h2>
      </div>
    </ion-header>

    <ion-content class="sub-content">
      <div class="pedir-rooster-bg" aria-hidden="true"></div>
      <div class="roo-page-body">
      <div class="sub-body">
        <p class="sub-status" *ngIf="cargando">Cargando historial...</p>
        <p class="sub-status" *ngIf="error">{{ error }}</p>

        <div class="pedido-card" [class.pedido-card--expanded]="pedidoExpandido === p.id" *ngFor="let p of pedidos" (click)="toggleDetalle(p.id)">
          <div class="pedido-card__header">
            <div class="pedido-card__info">
              <div class="pedido-card__codigo-row">
                <span class="pedido-card__codigo">{{ p.codigo }}</span>
                <button type="button" class="pedido-card__copy" (click)="$event.stopPropagation(); copiar(p.codigo)" aria-label="Copiar código">
                  <ion-icon name="copy-outline"></ion-icon>
                </button>
              </div>
              <span class="pedido-card__fecha">{{ formatFecha(p.created_at) }}</span>
            </div>
            <span class="pedido-card__estado">Pagado</span>
          </div>

          <div class="pedido-card__row">
            <span class="pedido-card__sucursal">
              <ion-icon name="location-outline"></ion-icon>
              <span class="pedido-card__sucursal-text">{{ p.sucursal.nombre }}</span>
            </span>
            <span class="pedido-card__modalidad">{{ MODALIDAD_LABEL[p.modalidad] }}</span>
          </div>

          <div class="pedido-card__footer">
            <span class="pedido-card__total">{{ p.total | crcCurrency }}</span>
            <ion-icon [name]="pedidoExpandido === p.id ? 'chevron-up-outline' : 'chevron-down-outline'"
              class="pedido-card__expand"></ion-icon>
          </div>

          <div class="pedido-card__detalle" *ngIf="pedidoExpandido === p.id" (click)="$event.stopPropagation()">
            <p class="pedido-card__detalle-title">Productos</p>
            <div class="pedido-card__item" *ngFor="let item of p.items">
              <div class="pedido-card__item-info">
                <span class="pedido-card__item-qty">{{ item.cantidad }}x</span>
                <span class="pedido-card__item-name">
                  {{ item.producto_nombre }}
                  <span *ngIf="item.tamano_nombre">({{ item.tamano_nombre }})</span>
                </span>
              </div>
              <span class="pedido-card__item-price">{{ item.subtotal | crcCurrency }}</span>
            </div>

            <div class="pedido-card__extras" *ngFor="let item of p.items">
              <div *ngIf="item.extras && item.extras.length > 0">
                <span class="pedido-card__extra" *ngFor="let e of item.extras">
                  + {{ e.nombre }} ({{ e.precio | crcCurrency }})
                </span>
              </div>
            </div>

            <div class="pedido-card__summary">
              <div class="pedido-card__summary-row">
                <span>Subtotal</span>
                <span>{{ p.subtotal | crcCurrency }}</span>
              </div>
              <div class="pedido-card__summary-row pedido-card__summary-row--discount" *ngIf="p.descuento > 0">
                <span>Descuento</span>
                <span>-{{ p.descuento | crcCurrency }}</span>
              </div>
              <div class="pedido-card__summary-row pedido-card__summary-row--total">
                <span>Total</span>
                <span>{{ p.total | crcCurrency }}</span>
              </div>
            </div>

            <p class="pedido-card__puntos" *ngIf="p.puntos_ganados > 0">
              <ion-icon name="ribbon-outline"></ion-icon>
              +{{ p.puntos_ganados | crcCurrency }} en Roosters
            </p>
          </div>
        </div>

        <p class="sub-empty" *ngIf="!cargando && !error && pedidos.length === 0">
          Todavía no tenés compras pagadas. Cuando pagués un pedido en caja, aparecerá aquí.
        </p>
      </div>
      </div>
    </ion-content>
  `,
})
export class HistorialPage implements OnInit {
  private pedidoService = inject(PedidoService);
  private toast = inject(ToastController);

  pedidos: Pedido[] = [];
  cargando = false;
  error: string | null = null;
  readonly MODALIDAD_LABEL = MODALIDAD_LABEL;

  // Detalle expandido (mismo patron que Mis pedidos).
  pedidoExpandido: number | null = null;

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

  toggleDetalle(pedidoId: number): void {
    this.pedidoExpandido = this.pedidoExpandido === pedidoId ? null : pedidoId;
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
