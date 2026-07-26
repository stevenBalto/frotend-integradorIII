import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';

/** Bandeja de notificaciones del admin (datos reales; polling en el shell). */
@Component({
  selector: 'app-admin-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class AdminNotificacionesPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  notifs: Notificacion[] = [];
  cargando = true;
  marcandoTodas = false;

  constructor(
    private notificaciones: NotificacionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.notificaciones.notificaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lista) => {
        this.notifs = lista;
        this.cargando = false;
      });

    // Trae lo más fresco al entrar (el shell ya sondea en segundo plano).
    this.notificaciones.refrescar()
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: () => (this.cargando = false), error: () => (this.cargando = false) });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get noLeidas(): number {
    return this.notifs.filter((n) => !n.leida).length;
  }

  /** Clic en una notificación: la marca leída y abre el pedido si lo tiene. */
  abrir(n: Notificacion): void {
    if (!n.leida) {
      this.notificaciones.marcarLeida(n.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.notificaciones.refrescar().subscribe());
    }
    const codigo = n.data?.codigo;
    if (n.pedido_id) {
      void this.router.navigate(['/admin/pedidos'], {
        queryParams: codigo ? { codigo } : {},
      });
    }
  }

  marcarTodas(): void {
    if (this.noLeidas === 0) {
      return;
    }
    this.marcandoTodas = true;
    this.notificaciones.marcarTodasLeidas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.notificaciones.refrescar().subscribe(() => (this.marcandoTodas = false)),
        error: () => (this.marcandoTodas = false),
      });
  }

  /** Ícono según el tipo de notificación. */
  icono(n: Notificacion): string {
    switch (n.tipo) {
      case 'pedido_nuevo': return 'clipboard-outline';
      default: return 'notifications-outline';
    }
  }

  /** Tiempo relativo simple ("hace 2 min", "hace 1 h", "ayer"). */
  tiempo(n: Notificacion): string {
    if (!n.created_at) {
      return '';
    }
    const diffMs = Date.now() - new Date(n.created_at).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return `hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ayer';
    return `hace ${dias} días`;
  }
}
