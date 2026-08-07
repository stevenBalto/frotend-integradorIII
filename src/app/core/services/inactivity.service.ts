import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, fromEvent, interval, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

export interface InactivityConfig {
  /** Minutos sin actividad antes de mostrar el aviso. */
  avisoMinutos: number;
  /** Segundos de cuenta regresiva del aviso antes de cerrar sesion. */
  cuentaRegresivaSegundos: number;
  /** Tope absoluto de sesion (horas), aunque el usuario este activo todo el tiempo. */
  maxSesionHoras: number;
}

const CONFIG_DEFAULT: InactivityConfig = {
  avisoMinutos: 15,
  cuentaRegresivaSegundos: 60,
  maxSesionHoras: 10,
};

/**
 * Timeout de sesion por inactividad para paneles administrativos (admin_sede /
 * superadmin). NO es un singleton de app (sin `providedIn: 'root'`): cada host lo
 * agrega a sus propios `providers` para tener timers aislados y poder detenerlos
 * al salir de ese panel.
 *
 * Basado en timestamps (Date.now()), no en contadores de ticks: si el tab queda en
 * background y el navegador throttlea el setInterval, al volver a foreground el
 * calculo se autocorrige solo (no se "atrasa" ni hay que compensar drift a mano).
 */
@Injectable()
export class InactivityService implements OnDestroy {
  private config: InactivityConfig = { ...CONFIG_DEFAULT };

  private lastActivity = Date.now();
  private sessionStart = Date.now();
  private warningStartedAt = 0;

  private activitySub?: Subscription;
  private tickSub?: Subscription;

  private readonly warningSubject = new BehaviorSubject<boolean>(false);
  private readonly remainingSubject = new BehaviorSubject<number>(0);
  private readonly expiredSubject = new Subject<void>();

  /** true mientras se muestra el modal de aviso (cuenta regresiva en curso). */
  readonly warning$ = this.warningSubject.asObservable();
  /** Segundos restantes de la cuenta regresiva (solo relevante si warning$ es true). */
  readonly remainingSeconds$ = this.remainingSubject.asObservable();
  /** Emite una vez cuando la sesion debe cerrarse (cuenta regresiva agotada o tope absoluto). */
  readonly expired$ = this.expiredSubject.asObservable();

  configure(config: Partial<InactivityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  start(): void {
    this.stop();
    this.lastActivity = Date.now();
    this.sessionStart = Date.now();
    this.warningSubject.next(false);

    this.activitySub = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'click'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll', { passive: true }),
    )
      .pipe(throttleTime(1000))
      .subscribe(() => {
        // Si ya esta en cuenta regresiva, la actividad NO la cancela sola: el
        // usuario tiene que confirmar con el boton "Seguir conectado" (a proposito,
        // asi no se queda una sesion viva solo porque el mouse rozo la pantalla).
        if (!this.warningSubject.value) {
          this.lastActivity = Date.now();
        }
      });

    this.tickSub = interval(1000).subscribe(() => this.tick());
  }

  /** El usuario confirmo que sigue ahi: cierra el aviso y reinicia el conteo de inactividad. */
  extender(): void {
    this.lastActivity = Date.now();
    this.warningSubject.next(false);
  }

  stop(): void {
    this.activitySub?.unsubscribe();
    this.tickSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private tick(): void {
    const ahora = Date.now();

    const maxSesionMs = this.config.maxSesionHoras * 60 * 60 * 1000;
    if (ahora - this.sessionStart >= maxSesionMs) {
      this.expirar();
      return;
    }

    if (this.warningSubject.value) {
      const cuentaRegresivaMs = this.config.cuentaRegresivaSegundos * 1000;
      const restanteMs = cuentaRegresivaMs - (ahora - this.warningStartedAt);
      this.remainingSubject.next(Math.max(0, Math.ceil(restanteMs / 1000)));
      if (restanteMs <= 0) {
        this.expirar();
      }
      return;
    }

    const avisoMs = this.config.avisoMinutos * 60 * 1000;
    if (ahora - this.lastActivity >= avisoMs) {
      this.warningStartedAt = ahora;
      this.remainingSubject.next(this.config.cuentaRegresivaSegundos);
      this.warningSubject.next(true);
    }
  }

  private expirar(): void {
    this.warningSubject.next(false);
    this.stop();
    this.expiredSubject.next();
  }
}
