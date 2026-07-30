import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import * as QRCode from 'qrcode';

/** Genera un código QR en un <canvas> a partir de un texto (sin dependencias de Angular). */
@Component({
  selector: 'qr-code',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`
    :host { display: flex; justify-content: center; }
    canvas { max-width: 100%; height: auto; }
  `],
})
export class QrCodeComponent implements OnChanges, AfterViewInit {
  @Input() value = '';
  @Input() size = 220;

  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(): void {
    this.dibujar();
  }

  ngAfterViewInit(): void {
    this.dibujar();
  }

  private dibujar(): void {
    if (!this.value || !this.canvasRef) {
      return;
    }

    QRCode.toCanvas(this.canvasRef.nativeElement, this.value, {
      width: this.size,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#1E1E1E', light: '#FFFFFF' },
    }).catch(() => {
      /* si falla el render, el texto del código sigue visible como fallback */
    });
  }
}
