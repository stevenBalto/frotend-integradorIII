import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsQR from 'jsqr';

/**
 * Escanea un código QR con la cámara del dispositivo (getUserMedia + jsQR, sin
 * wrapper de Angular) e incluye un input de texto como respaldo manual si la
 * cámara falla o no hay permisos.
 */
@Component({
  selector: 'qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="qr-scanner">
      <div class="qr-scanner__video-wrap" *ngIf="!errorCamara">
        <video #video playsinline autoplay muted></video>
        <canvas #canvas hidden></canvas>
        <div class="qr-scanner__frame"></div>
      </div>

      <p class="qr-scanner__error" *ngIf="errorCamara">
        No se pudo acceder a la cámara ({{ errorCamara }}). Escribí el código manualmente.
      </p>

      <div class="qr-scanner__manual">
        <input
          type="text"
          placeholder="o escribí el código aquí"
          [(ngModel)]="codigoManual"
          (keydown.enter)="enviarManual()"
        />
        <button type="button" (click)="enviarManual()">Validar</button>
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner { display: flex; flex-direction: column; gap: 12px; }
    .qr-scanner__video-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      max-width: 320px;
      margin: 0 auto;
      border-radius: 16px;
      overflow: hidden;
      background: #111;
    }
    video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .qr-scanner__frame {
      position: absolute;
      inset: 12%;
      border: 3px solid rgba(255,255,255,0.85);
      border-radius: 12px;
      pointer-events: none;
    }
    .qr-scanner__error {
      font-size: 12px;
      color: var(--admin-text-muted, #6B7280);
      text-align: center;
      margin: 0;
    }
    .qr-scanner__manual {
      display: flex;
      gap: 8px;
    }
    .qr-scanner__manual input {
      flex: 1;
      border: 1px solid var(--admin-border, #E5E7EB);
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 13px;
    }
    .qr-scanner__manual button {
      border: none;
      border-radius: 8px;
      padding: 8px 14px;
      background: var(--admin-accent, #E13642);
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
  `],
})
export class QrScannerComponent implements OnDestroy {
  @Output() readonly decoded = new EventEmitter<string>();

  @ViewChild('video') private videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  codigoManual = '';
  errorCamara: string | null = null;

  private stream: MediaStream | null = null;
  private frameId: number | null = null;
  private yaDecodio = false;

  ngAfterViewInit(): void {
    this.iniciarCamara();
  }

  ngOnDestroy(): void {
    this.detener();
  }

  enviarManual(): void {
    const valor = this.codigoManual.trim();
    if (valor) {
      this.emitirUnaVez(valor);
    }
  }

  private async iniciarCamara(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
    } catch (e) {
      this.errorCamara = e instanceof Error ? e.message : 'permiso denegado';
      return;
    }

    const video = this.videoRef?.nativeElement;
    if (!video) {
      return;
    }

    video.srcObject = this.stream;
    await video.play().catch(() => undefined);
    this.loop();
  }

  private loop = (): void => {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const resultado = jsQR(frame.data, frame.width, frame.height);

        if (resultado?.data) {
          this.emitirUnaVez(resultado.data);
          return;
        }
      }
    }

    this.frameId = requestAnimationFrame(this.loop);
  };

  private emitirUnaVez(valor: string): void {
    if (this.yaDecodio) {
      return;
    }
    this.yaDecodio = true;
    this.detener();
    this.decoded.emit(valor);
  }

  private detener(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
