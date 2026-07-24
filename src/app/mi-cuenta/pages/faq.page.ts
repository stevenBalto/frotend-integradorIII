import { Component } from '@angular/core';
import { FAQ, PreguntaFrecuente } from '../../shared/constants/mi-cuenta-contenido';

/** Preguntas frecuentes (acordeon) sobre el uso de la app como cliente. */
@Component({
  selector: 'app-faq',
  standalone: false,
  styleUrls: ['./sub-page.scss'],
  styles: [`
    .faq-item {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid rgba(0,0,0,0.05);
      margin-bottom: 10px;
      overflow: hidden;
    }
    .faq-q {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 15px 16px;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
    }
    .faq-q__text {
      flex: 1;
      font-family: var(--rooster-font-sans);
      font-size: 14px;
      font-weight: 700;
      color: var(--rooster-dark);
    }
    .faq-q__icon { font-size: 18px; color: var(--rooster-red); flex-shrink: 0; transition: transform 0.2s; }
    .faq-q__icon--open { transform: rotate(180deg); }
    .faq-a {
      padding: 0 16px 16px;
      font-family: var(--rooster-font-sans);
      font-size: 13px;
      line-height: 1.55;
      color: var(--rooster-brown);
      margin: 0;
    }
  `],
  template: `
    <ion-content [fullscreen]="true" class="sub-content">
      <div class="sub-header">
        <button class="sub-back" routerLink="/tabs/mi-cuenta"><ion-icon name="arrow-back-outline"></ion-icon></button>
        <h2 class="sub-title">Preguntas frecuentes</h2>
      </div>

      <div class="sub-body">
        <div class="faq-item" *ngFor="let f of faqs; let i = index">
          <button class="faq-q" (click)="toggle(i)">
            <span class="faq-q__text">{{ f.pregunta }}</span>
            <ion-icon name="chevron-down-outline" class="faq-q__icon"
              [class.faq-q__icon--open]="abierta === i"></ion-icon>
          </button>
          <p class="faq-a" *ngIf="abierta === i">{{ f.respuesta }}</p>
        </div>
      </div>
    </ion-content>
  `,
})
export class FaqPage {
  readonly faqs: PreguntaFrecuente[] = FAQ;
  abierta: number | null = 0;

  toggle(i: number): void {
    this.abierta = this.abierta === i ? null : i;
  }
}
