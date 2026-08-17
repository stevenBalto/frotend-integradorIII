import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { INFO_TEMAS, SeccionInfo } from '../../shared/constants/mi-cuenta-contenido';
import { NEGOCIO, DESARROLLADORES, Desarrollador } from '../../shared/constants/negocio';

/** Pagina de prosa reutilizable: Quienes somos / Terminos / Privacidad / Sobre la app. */
@Component({
  selector: 'app-info',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .sub-title { color: #ffffff; }
    .sub-status, .sub-empty { color: rgba(255, 255, 255, 0.75); }
    ion-header { position: relative; z-index: 1; }
    /* min-height + flex centra el bloque cuando la prosa es corta (Quienes
       somos); en Terminos/Privacidad, que son largos, el contenido desborda y
       justify-content:center deja de tener efecto -- se lee normal desde arriba. */
    .info-page-body {
      position: relative;
      z-index: 1;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .info-page-body > .sub-body { width: 100%; }

    .info-parrafo {
      font-family: var(--client-font-body);
      font-size: 14px;
      line-height: 1.6;
      color: var(--client-text);
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
      background: var(--client-red);
      color: #fff;
      font-family: var(--client-font-body);
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(225, 54, 66, 0.28);
      &:active { transform: scale(0.97); }
    }
    /* Equipo: cuadricula de fotos grandes (2 columnas en movil, 4 desde 560px)
       -- se pidio que las fotos se vean bien visibles, no como avatar chico de
       lista. Cada tarjeta abre el modal con la foto en grande y el aporte. */
    .info-equipo-titulo {
      font-family: var(--client-font-body); font-size: 11px; font-weight: 700;
      color: var(--client-text-muted); text-transform: uppercase;
      letter-spacing: 0.08em; margin: 0 0 12px;
    }
    .info-devs {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      @media (min-width: 560px) { grid-template-columns: repeat(4, 1fr); }
    }
    .info-dev {
      display: flex; flex-direction: column; gap: 8px;
      padding: 0; border: none; background: none; cursor: pointer;
      text-align: center; font-family: var(--client-font-body);
      transition: transform var(--rooster-ease-fast);
      &:active { transform: scale(0.97); }
    }
    .info-dev__foto {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 16px;
      overflow: hidden;
      background: #fff1f2;
      box-shadow: 0 4px 14px rgba(0,0,0,0.12);

      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    }
    /* Lupa: marca que la foto se puede abrir en grande. */
    .info-dev__zoom {
      position: absolute; right: 6px; bottom: 6px;
      width: 24px; height: 24px; border-radius: 50%;
      background: rgba(11,11,12,0.62);
      display: flex; align-items: center; justify-content: center;
      ion-icon { font-size: 13px; color: #fff; }
    }
    .info-dev__name { font-size: 12px; font-weight: 700; color: var(--client-text); line-height: 1.3; }
    .info-dev__rol { font-size: 10px; color: var(--client-text-muted); line-height: 1.35; margin-top: 2px; }

    /* ── Modal del integrante ── */
    .dev-modal {
      position: fixed; inset: 0; z-index: 200;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: rooster-fade var(--rooster-ease-fast) both;
    }
    .dev-modal__backdrop {
      position: absolute; inset: 0;
      background: rgba(11,11,12,0.72);
      backdrop-filter: blur(3px);
    }
    .dev-modal__panel {
      position: relative;
      width: 100%; max-width: 340px;
      box-sizing: border-box;
      border-radius: var(--rooster-radius-lg);
      background: #fff;
      overflow: hidden;
      box-shadow: var(--rooster-shadow-xl);
      animation: rooster-rise var(--rooster-ease-med) both;
    }
    .dev-modal__foto {
      width: 100%; aspect-ratio: 1 / 1; display: block; object-fit: cover;
      background: #fff1f2;
    }
    .dev-modal__close {
      position: absolute; top: 10px; right: 10px;
      width: 34px; height: 34px; border-radius: 50%; border: none;
      background: rgba(11,11,12,0.55);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      ion-icon { font-size: 19px; color: #fff; }
      &:active { transform: scale(0.92); }
    }
    .dev-modal__body { padding: 16px 18px 20px; }
    .dev-modal__name {
      font-family: var(--client-font-display); font-size: 18px; font-weight: 700;
      color: var(--client-ink); margin: 0;
    }
    .dev-modal__rol {
      font-family: var(--client-font-body); font-size: 12px; font-weight: 600;
      color: var(--client-red); margin: 4px 0 0;
    }
    .dev-modal__aporte {
      font-family: var(--client-font-body); font-size: 13px; line-height: 1.6;
      color: var(--client-text-muted); margin: 10px 0 0;
    }
    .info-meta { font-family: var(--client-font-body); font-size: 12px; color: var(--client-text-muted); text-align: center; margin: 10px 0 0; line-height: 1.6; }

    /* Ficha del proyecto: etiqueta + valor. En movil apilado (la etiqueta
       arriba); desde 420px en dos columnas, con la etiqueta de ancho fijo para
       que todos los valores arranquen alineados. */
    .info-ficha-titulo { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.07); }
    .info-ficha { margin: 0; }
    .info-ficha__row {
      padding: 9px 0;
      border-bottom: 1px solid rgba(0,0,0,0.05);
      &:last-child { border-bottom: none; }

      @media (min-width: 420px) { display: flex; gap: 12px; }

      dt {
        font-family: var(--client-font-body); font-size: 10px; font-weight: 700;
        color: var(--client-text-muted); text-transform: uppercase;
        letter-spacing: 0.07em; margin-bottom: 3px;

        @media (min-width: 420px) { flex: 0 0 92px; margin-bottom: 0; padding-top: 2px; }
      }

      dd {
        margin: 0;
        font-family: var(--client-font-body); font-size: 13px; font-weight: 600;
        color: var(--client-text); line-height: 1.5;

        @media (min-width: 420px) { flex: 1; min-width: 0; }
      }
    }
  `],
  template: `
    <ion-header class="ion-no-border">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">{{ seccion?.titulo || 'Información' }}</h2>
      </div>
    </ion-header>

    <ion-content class="sub-content">
      <div class="pedir-rooster-bg" aria-hidden="true"></div>
      <div class="info-page-body">
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
          <p class="info-equipo-titulo">Equipo de desarrollo</p>
          <div class="info-devs">
            <button type="button" class="info-dev" *ngFor="let d of devs"
              (click)="abrirDev(d)" [attr.aria-label]="'Ver el aporte de ' + d.nombre">
              <div class="info-dev__foto">
                <img [src]="d.foto" [alt]="'Foto de ' + d.nombre" />
                <span class="info-dev__zoom"><ion-icon name="expand-outline"></ion-icon></span>
              </div>
              <div>
                <div class="info-dev__name">{{ d.nombre }}</div>
                <div class="info-dev__rol">{{ d.rol }}<span *ngIf="d.contacto"> · {{ d.contacto }}</span></div>
              </div>
            </button>
          </div>
          <p class="info-equipo-titulo info-ficha-titulo">Sobre el proyecto</p>
          <dl class="info-ficha">
            <div class="info-ficha__row">
              <dt>Proyecto</dt>
              <dd>{{ negocio.proyecto }} · {{ negocio.anio }}</dd>
            </div>
            <div class="info-ficha__row">
              <dt>Universidad</dt>
              <dd>{{ negocio.universidad }}<br>{{ negocio.campus }}</dd>
            </div>
            <div class="info-ficha__row">
              <dt>Carrera</dt>
              <dd>{{ negocio.carrera }}</dd>
            </div>
            <div class="info-ficha__row">
              <dt>Entregable</dt>
              <dd>{{ negocio.plataformas }}</dd>
            </div>
            <div class="info-ficha__row">
              <dt>Tecnologías</dt>
              <dd>{{ negocio.stack }}</dd>
            </div>
          </dl>
          <p class="info-meta">{{ negocio.nombre }} · versión {{ negocio.version }}</p>
        </div>
      </div>

      <ng-template #noData>
        <p class="sub-empty">No encontramos esta sección.</p>
      </ng-template>
      </div>

      <!-- Foto en grande + aporte del integrante -->
      <div class="dev-modal" *ngIf="devAbierto">
        <div class="dev-modal__backdrop" (click)="cerrarDev()"></div>
        <div class="dev-modal__panel">
          <img class="dev-modal__foto" [src]="devAbierto.foto" [alt]="'Foto de ' + devAbierto.nombre" />
          <button type="button" class="dev-modal__close" (click)="cerrarDev()" aria-label="Cerrar">
            <ion-icon name="close-outline"></ion-icon>
          </button>
          <div class="dev-modal__body">
            <p class="dev-modal__name">{{ devAbierto.nombre }}</p>
            <p class="dev-modal__rol">{{ devAbierto.rol }}</p>
            <p class="dev-modal__aporte">{{ devAbierto.aporte }}</p>
          </div>
        </div>
      </div>
    </ion-content>
  `,
})
export class InfoPage implements OnInit {
  private route = inject(ActivatedRoute);

  tema = '';
  seccion: SeccionInfo | null = null;
  readonly negocio = NEGOCIO;
  readonly devs: Desarrollador[] = DESARROLLADORES;

  /** Integrante cuya foto se está viendo en grande (null = modal cerrado). */
  devAbierto: Desarrollador | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.tema = params.get('tema') ?? '';
      this.seccion = INFO_TEMAS[this.tema] ?? null;
    });
  }

  abrirWeb(): void {
    window.open(NEGOCIO.webInformativa, '_blank');
  }

  abrirDev(d: Desarrollador): void {
    this.devAbierto = d;
  }

  cerrarDev(): void {
    this.devAbierto = null;
  }
}
