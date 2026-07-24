import { Component, OnInit } from '@angular/core';
import { SucursalService } from '../../core/services/sucursal.service';
import { Sucursal } from '../../core/models/sucursal.model';

/** Lista de restaurantes (sucursales) con ubicacion y contacto. */
@Component({
  selector: 'app-restaurantes',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .rest-card { display: flex; flex-direction: column; gap: 10px; }
    .rest-name {
      font-family: var(--rooster-font-serif);
      font-size: 17px;
      font-weight: 700;
      color: var(--rooster-dark);
      margin: 0;
    }
    .rest-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-family: var(--rooster-font-sans);
      font-size: 13px;
      color: var(--rooster-brown);
      ion-icon { font-size: 17px; color: var(--rooster-red); flex-shrink: 0; margin-top: 1px; }
      span { line-height: 1.4; }
    }
    .rest-map {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px;
      margin-top: 4px;
      border: 1.5px solid rgba(225,54,66,0.3);
      border-radius: 12px;
      background: #fff1f2;
      color: var(--rooster-red);
      font-family: var(--rooster-font-sans);
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      &:active { transform: scale(0.98); }
    }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Restaurantes</h2>
      </div>

      <div class="sub-body">
        <p class="sub-status" *ngIf="cargando">Cargando restaurantes...</p>
        <p class="sub-status" *ngIf="error">{{ error }}</p>

        <div class="sub-card rest-card" *ngFor="let s of sucursales">
          <p class="rest-name">{{ s.nombre }}</p>
          <div class="rest-row">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ s.direccion || 'Dirección no disponible' }}</span>
          </div>
          <div class="rest-row" *ngIf="s.telefono">
            <ion-icon name="call-outline"></ion-icon>
            <span>{{ s.telefono }}</span>
          </div>
          <button class="rest-map" (click)="abrirMapa(s)">
            <ion-icon name="navigate-outline"></ion-icon> Abrir en Google Maps
          </button>
        </div>

        <p class="sub-empty" *ngIf="!cargando && !error && sucursales.length === 0">
          No hay restaurantes para mostrar.
        </p>
      </div>
    </ion-content>
  `,
})
export class RestaurantesPage implements OnInit {
  sucursales: Sucursal[] = [];
  cargando = false;
  error: string | null = null;

  constructor(private sucursalService: SucursalService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.sucursalService.listarActivas().subscribe({
      next: (s) => {
        this.sucursales = s.filter((x) => x.activa);
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los restaurantes.';
        this.cargando = false;
      },
    });
  }

  abrirMapa(s: Sucursal): void {
    const query =
      s.latitud != null && s.longitud != null
        ? `${s.latitud},${s.longitud}`
        : encodeURIComponent(`${s.nombre} ${s.direccion ?? ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }
}
