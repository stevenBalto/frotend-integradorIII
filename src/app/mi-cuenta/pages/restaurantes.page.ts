import { Component, OnInit } from '@angular/core';
import { ConfiguracionService, Restaurante } from '../../core/services/configuracion.service';

/**
 * Lista de restaurantes con ubicacion y contacto.
 *
 * La lista es DINAMICA: sale de la "Informacion del negocio" que cada sucursal
 * (instancia) carga en su Configuracion. Al crear una instancia nueva y llenar
 * sus datos, aparece sola — no hay restaurantes escritos en el codigo.
 */
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

        <div class="sub-card rest-card" *ngFor="let r of restaurantes">
          <p class="rest-name">{{ r.nombre }}</p>
          <div class="rest-row">
            <ion-icon name="location-outline"></ion-icon>
            <span>{{ r.direccion || 'Dirección no disponible' }}</span>
          </div>
          <div class="rest-row" *ngIf="r.telefono">
            <ion-icon name="call-outline"></ion-icon>
            <span>{{ r.telefono }}</span>
          </div>
          <div class="rest-row" *ngIf="r.sitio_web">
            <ion-icon name="globe-outline"></ion-icon>
            <span>{{ r.sitio_web }}</span>
          </div>
          <button class="rest-map" (click)="abrirMapa(r)">
            <ion-icon name="navigate-outline"></ion-icon> Abrir en Google Maps
          </button>
        </div>

        <p class="sub-empty" *ngIf="!cargando && !error && restaurantes.length === 0">
          No hay restaurantes para mostrar.
        </p>
      </div>
    </ion-content>
  `,
})
export class RestaurantesPage implements OnInit {
  restaurantes: Restaurante[] = [];
  cargando = false;
  error: string | null = null;

  constructor(private configuracionService: ConfiguracionService) {}

  ngOnInit(): void {
    this.cargando = true;
    this.configuracionService.listarRestaurantes().subscribe({
      next: (lista) => {
        this.restaurantes = lista;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los restaurantes.';
        this.cargando = false;
      },
    });
  }

  /**
   * Abre la ubicación: usa la URL de Google Maps que cargó la sucursal. Si no
   * la configuró, cae a una búsqueda por nombre + dirección.
   */
  abrirMapa(r: Restaurante): void {
    const url = r.maps_url?.trim()
      ? r.maps_url.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.nombre} ${r.direccion ?? ''}`)}`;
    window.open(url, '_blank');
  }
}
