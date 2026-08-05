import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { formatCRC } from './analiticas.tokens';
import { ImagenUrlPipe } from '../../shared/pipes/imagen-url.pipe';

export interface TopProductItem {
  nombre: string;
  unidades: number;
  /** Ingresos del periodo. null mientras el backend no los exponga. */
  ingresos: number | null;
  /** Foto del producto. null si no tiene o si el backend aún no la manda. */
  imagenUrl?: string | null;
}

interface TopProductRow {
  nombre: string;
  imagenUrl: string | null;
  icono: string;
  unidadesTexto: string;
  ingresosTexto: string;
}

/**
 * Tabla de "Productos más vendidos": columnas PRODUCTO / CANTIDAD / INGRESOS.
 * Cada fila lleva un icono derivado del nombre del producto (pizza, bebida, etc.).
 *
 * La columna INGRESOS muestra "—" mientras el backend no devuelva `ingresos` en
 * `top_productos`; nunca se estima en el frontend para no contradecir el KPI de ventas.
 */
@Component({
  selector: 'top-products-table',
  standalone: true,
  imports: [CommonModule, IonicModule, ImagenUrlPipe],
  template: `
    <div class="tpt">
      <div class="tpt__head" *ngIf="rows.length > 0">
        <span class="tpt__th">Producto</span>
        <span class="tpt__th tpt__th--num">Cantidad</span>
        <span class="tpt__th tpt__th--num">Ingresos</span>
      </div>

      <div class="tpt__row" *ngFor="let row of rows">
        <div class="tpt__product">
          <span class="tpt__thumb" aria-hidden="true">
            <!-- Foto del producto; si no hay (o el archivo falla) cae al icono. -->
            <img *ngIf="row.imagenUrl; else iconoFallback"
                 class="tpt__img"
                 [src]="row.imagenUrl | imagenUrl"
                 [alt]="row.nombre"
                 loading="lazy"
                 (error)="onImagenError(row)" />
            <ng-template #iconoFallback>
              <ion-icon [name]="row.icono"></ion-icon>
            </ng-template>
          </span>
          <span class="tpt__name" [title]="row.nombre">{{ row.nombre }}</span>
        </div>
        <span class="tpt__qty">{{ row.unidadesTexto }}</span>
        <span class="tpt__revenue">{{ row.ingresosTexto }}</span>
      </div>

      <p *ngIf="rows.length === 0" class="tpt__empty">Sin datos.</p>
    </div>
  `,
  styles: [`
    .tpt {
      display: flex;
      flex-direction: column;
      font-variant-numeric: tabular-nums;
    }

    .tpt__head,
    .tpt__row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 84px 104px;
      align-items: center;
      gap: 12px;
    }

    .tpt__head {
      padding-bottom: 10px;
      border-bottom: 1px solid var(--admin-border);
    }

    .tpt__th {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--admin-text-soft, #A0A09A);
    }

    .tpt__th--num { text-align: right; }

    .tpt__row {
      padding: 12px 0;
      border-bottom: 1px solid var(--admin-border);
    }

    .tpt__row:last-child { border-bottom: none; }

    .tpt__product {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    /* Tile: la foto lo llena por completo; sin foto queda el fondo rojo de marca
       al 8% con el icono (mismo tratamiento que los KPI cards). */
    .tpt__thumb {
      flex: none;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(225, 54, 66, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      ion-icon {
        font-size: 18px;
        color: var(--admin-accent, #E13642);
      }
    }
    .tpt__img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .tpt__name {
      font-size: 13px;
      font-weight: 700;
      color: var(--admin-text, #2E2E2C);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tpt__qty {
      font-size: 13px;
      text-align: right;
      color: var(--admin-text-muted, #76756F);
    }

    .tpt__revenue {
      font-size: 13px;
      font-weight: 700;
      text-align: right;
      color: var(--admin-text, #2E2E2C);
      white-space: nowrap;
    }

    .tpt__empty {
      text-align: center;
      font-size: 13px;
      color: var(--admin-text-muted, #76756F);
      padding: 24px 16px;
      margin: 0;
    }

    @media (max-width: 480px) {
      .tpt__head,
      .tpt__row {
        grid-template-columns: minmax(0, 1fr) 56px 84px;
        gap: 8px;
      }
      .tpt__thumb { width: 30px; height: 30px; border-radius: 8px; }
      .tpt__thumb ion-icon { font-size: 16px; }
      .tpt__name,
      .tpt__qty,
      .tpt__revenue { font-size: 12px; }
    }
  `],
})
export class TopProductsTableComponent implements OnChanges {
  @Input() items: TopProductItem[] = [];

  rows: TopProductRow[] = [];

  /** Si la imagen no carga (archivo borrado, ruta mala), se muestra el icono. */
  onImagenError(row: TopProductRow): void {
    row.imagenUrl = null;
  }

  ngOnChanges(): void {
    this.rows = (this.items ?? []).map((item) => ({
      nombre: item.nombre,
      imagenUrl: item.imagenUrl ?? null,
      icono: this.iconoProducto(item.nombre),
      unidadesTexto: new Intl.NumberFormat('es-CR').format(item.unidades),
      ingresosTexto: item.ingresos === null || item.ingresos === undefined
        ? '—'
        : formatCRC(item.ingresos),
    }));
  }

  /** Icono según el tipo de producto, deducido del nombre (el backend no manda categoría). */
  private iconoProducto(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('pizza')) { return 'pizza-outline'; }
    if (n.includes('hamburgu') || n.includes('burger') || n.includes('hot dog') || n.includes('sandwich')) {
      return 'fast-food-outline';
    }
    if (n.includes('cerveza') || n.includes('beer')) { return 'beer-outline'; }
    if (n.includes('café') || n.includes('cafe') || n.includes('capuchino')) { return 'cafe-outline'; }
    if (n.includes('refresco') || n.includes('gaseosa') || n.includes('soda') || n.includes('bebida')
      || n.includes('jugo') || n.includes('agua') || n.includes('batido') || n.includes('malteada')) {
      return 'wine-outline';
    }
    if (n.includes('helado') || n.includes('postre') || n.includes('brownie') || n.includes('pastel')
      || n.includes('torta') || n.includes('cheesecake')) {
      return 'ice-cream-outline';
    }
    if (n.includes('ensalada') || n.includes('vegetal')) { return 'nutrition-outline'; }
    if (n.includes('combo') || n.includes('familiar')) { return 'bag-handle-outline'; }
    return 'restaurant-outline';
  }
}
