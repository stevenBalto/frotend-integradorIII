import { Injectable, OnDestroy, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription, fromEvent, interval, merge } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { SuperAdminAuthService } from './superadmin-auth.service';

/** Cada cuánto se comprueba contra el servidor que la sesión siga viva. */
const INTERVALO_MS = 15000;

/**
 * Latido de sesión del panel de superadmin.
 *
 * Sin esto, una ventana que quedó abierta y quieta no se entera de que su cuenta
 * fue eliminada o desactivada desde otra ventana: sigue mostrando el panel hasta
 * que el usuario refresca. El latido pregunta periódicamente por /superadmin/me
 * (y al volver a la pestaña) y, si el servidor ya no reconoce el token, cierra la
 * sesión y expulsa al login explicando el motivo.
 */
@Injectable()
export class SuperAdminSessionWatchService implements OnDestroy {
  private auth = inject(SuperAdminAuthService);
  private router = inject(Router);
  private toast = inject(ToastController);

  private sub: Subscription | null = null;
  private expulsando = false;

  iniciar(): void {
    if (this.sub) return;

    // Latido periódico + comprobación inmediata al volver a la pestaña.
    const volverAlFoco = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible'),
    );

    this.sub = merge(interval(INTERVALO_MS), volverAlFoco)
      .pipe(
        filter(() => this.auth.estaAutenticado && !this.expulsando),
        switchMap(() => this.auth.me()),
      )
      .subscribe({
        error: (err: HttpErrorResponse) => {
          if (err.status === 401 || err.status === 403) {
            void this.expulsar(err.error?.message);
            return;
          }
          // Error de red o del servidor: no se cierra la sesión, se reanuda el latido.
          this.sub = null;
          this.iniciar();
        },
      });
  }

  detener(): void {
    this.sub?.unsubscribe();
    this.sub = null;
  }

  ngOnDestroy(): void {
    this.detener();
  }

  private async expulsar(mensaje?: string): Promise<void> {
    this.expulsando = true;
    this.detener();
    this.auth.limpiarSesion();
    const t = await this.toast.create({
      message: mensaje ?? 'Tu cuenta de superadministrador ya no está disponible.',
      duration: 4000,
      position: 'top',
      color: 'danger',
    });
    await t.present();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
