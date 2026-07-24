import { Component, OnInit } from '@angular/core';
import { ProductoService } from '../../core/services/producto.service';
import { Producto } from '../../core/models/producto.model';

/** Vitrina de productos con movimiento infinito y lento (marquee de dos filas). */
@Component({
  selector: 'app-productos',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .prod-intro { font-family: var(--rooster-font-sans); font-size: 14px; line-height: 1.5; color: var(--rooster-brown); text-align: center; margin: 0 0 18px; }
    .mq { overflow: hidden; margin: 0 -16px 18px; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
    .mq-track { display: flex; gap: 14px; width: max-content; padding: 0 7px; animation: mq-left 48s linear infinite; }
    .mq-track--rev { animation: mq-right 60s linear infinite; }
    .mq:hover .mq-track { animation-play-state: paused; }
    @keyframes mq-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @keyframes mq-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
    @media (prefers-reduced-motion: reduce) { .mq-track { animation: none; } }

    .prod-card {
      width: 150px; flex-shrink: 0; background: #fff; border-radius: 16px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05);
    }
    .prod-card__img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; display: block; background: #f0f0f0; }
    .prod-card__ph { width: 100%; aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center; background: #f5f5f5; ion-icon { font-size: 34px; color: #ccc; } }
    .prod-card__body { padding: 10px 12px 12px; }
    .prod-card__name { font-family: var(--rooster-font-sans); font-size: 13px; font-weight: 700; color: var(--rooster-dark); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prod-card__price { font-family: var(--rooster-font-sans); font-size: 13px; font-weight: 700; color: var(--rooster-red); margin: 4px 0 0; }
    .prod-cta {
      display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%;
      padding: 15px; border: none; border-radius: 16px; background: var(--rooster-red); color: #fff;
      font-family: var(--rooster-font-sans); font-size: 15px; font-weight: 700; cursor: pointer;
      box-shadow: 0 6px 20px rgba(225,54,66,0.28);
      &:active { transform: scale(0.98); }
    }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Productos</h2>
      </div>

      <div class="sub-body">
        <p class="prod-intro">Un vistazo a lo que preparamos con gusto en Rooster. 🍕🔥</p>
        <p class="sub-status" *ngIf="cargando">Cargando productos...</p>

        <ng-container *ngIf="!cargando && productos.length > 0">
          <div class="mq">
            <div class="mq-track">
              <div class="prod-card" *ngFor="let p of fila1">
                <img *ngIf="p.imagen_url" [src]="p.imagen_url" [alt]="p.nombre" class="prod-card__img" />
                <div *ngIf="!p.imagen_url" class="prod-card__ph"><ion-icon name="restaurant-outline"></ion-icon></div>
                <div class="prod-card__body">
                  <p class="prod-card__name">{{ p.nombre }}</p>
                  <p class="prod-card__price">{{ p.precio_base | crcCurrency }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mq">
            <div class="mq-track mq-track--rev">
              <div class="prod-card" *ngFor="let p of fila2">
                <img *ngIf="p.imagen_url" [src]="p.imagen_url" [alt]="p.nombre" class="prod-card__img" />
                <div *ngIf="!p.imagen_url" class="prod-card__ph"><ion-icon name="restaurant-outline"></ion-icon></div>
                <div class="prod-card__body">
                  <p class="prod-card__name">{{ p.nombre }}</p>
                  <p class="prod-card__price">{{ p.precio_base | crcCurrency }}</p>
                </div>
              </div>
            </div>
          </div>

          <button class="prod-cta" routerLink="/tabs/pedir">
            <ion-icon name="cart-outline"></ion-icon> Ver el menú completo
          </button>
        </ng-container>
      </div>
    </ion-content>
  `,
})
export class ProductosPage implements OnInit {
  productos: Producto[] = [];
  /** Cada fila se renderiza con la lista DUPLICADA para que el loop sea continuo (-50%). */
  fila1: Producto[] = [];
  fila2: Producto[] = [];
  cargando = false;

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.productoService.listarDisponibles().subscribe({
      next: (productos) => {
        this.productos = productos;
        const mitad = Math.ceil(productos.length / 2);
        const a = productos.slice(0, mitad);
        const b = productos.slice(mitad).concat(a.slice(0, 1));
        this.fila1 = [...a, ...a];
        this.fila2 = [...b, ...b];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      },
    });
  }
}
