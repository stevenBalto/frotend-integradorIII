import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { INFO_TEMAS, SeccionInfo } from '../../shared/constants/mi-cuenta-contenido';
import { NEGOCIO, DESARROLLADORES, Desarrollador } from '../../shared/constants/negocio';

/** Pagina de prosa reutilizable: Quienes somos / Terminos / Privacidad / Sobre la app. */
@Component({
  selector: 'app-info',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .info-parrafo {
      font-family: var(--rooster-font-sans);
      font-size: 14px;
      line-height: 1.6;
      color: var(--rooster-dark);
      margin: 0 0 14px;
    }
    .info-web {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px;
      margin-top: 6px;
      border: none;
      border-radius: 14px;
      background: var(--rooster-red);
      color: #fff;
      font-family: var(--rooster-font-sans);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(225, 54, 66, 0.28);
      &:active { transform: scale(0.97); }
    }
    .info-devs { margin-top: 6px; }
    .info-dev {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      &:last-child { border-bottom: none; }
    }
    .info-dev__avatar {
      width: 40px; height: 40px; border-radius: 12px; background: #fff1f2;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      ion-icon { font-size: 20px; color: var(--rooster-red); }
    }
    .info-dev__name { font-family: var(--rooster-font-sans); font-size: 14px; font-weight: 700; color: var(--rooster-dark); }
    .info-dev__rol { font-family: var(--rooster-font-sans); font-size: 12px; color: var(--rooster-brown); }
    .info-meta { font-family: var(--rooster-font-sans); font-size: 12px; color: var(--rooster-brown); text-align: center; margin: 10px 0 0; line-height: 1.6; }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">{{ seccion?.titulo || 'Información' }}</h2>
      </div>

      <div class="sub-body" *ngIf="seccion; else noData">
        <div class="sub-card">
          <p class="info-parrafo" *ngFor="let p of seccion.parrafos">{{ p }}</p>

          <!-- Quienes somos: enlace a la web informativa -->
          <button class="info-web" *ngIf="tema === 'quienes-somos'" (click)="abrirWeb()">
            <ion-icon name="globe-outline"></ion-icon> Visitar nuestra web
          </button>
        </div>

        <!-- Sobre la app: desarrolladores + datos tecnicos -->
        <div class="sub-card" *ngIf="tema === 'sobre-app'">
          <div class="info-devs">
            <div class="info-dev" *ngFor="let d of devs">
              <div class="info-dev__avatar"><ion-icon name="person-outline"></ion-icon></div>
              <div>
                <div class="info-dev__name">{{ d.nombre }}</div>
                <div class="info-dev__rol">{{ d.rol }}<span *ngIf="d.contacto"> · {{ d.contacto }}</span></div>
              </div>
            </div>
          </div>
          <p class="info-meta">
            {{ negocio.nombre }} · versión {{ negocio.version }}<br>
            {{ negocio.proyecto }} — {{ negocio.anio }}<br>
            {{ negocio.stack }}
          </p>
        </div>
      </div>

      <ng-template #noData>
        <p class="sub-empty">No encontramos esta sección.</p>
      </ng-template>
    </ion-content>
  `,
})
export class InfoPage implements OnInit {
  tema = '';
  seccion: SeccionInfo | null = null;
  readonly negocio = NEGOCIO;
  readonly devs: Desarrollador[] = DESARROLLADORES;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.tema = params.get('tema') ?? '';
      this.seccion = INFO_TEMAS[this.tema] ?? null;
    });
  }

  abrirWeb(): void {
    window.open(NEGOCIO.webInformativa, '_blank');
  }
}
