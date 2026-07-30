import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion, rutaDeNotificacion, iconoDeNotificacion } from '../../core/models/notificacion.model';

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
  borrandoTodas = false;

  // #17 Filtros de la bandeja.
  filtroEstado: 'todas' | 'no_leidas' | 'leidas' = 'todas';
  filtroPeriodo: 'todas' | 'hoy' | 'ayer' | 'semana' | 'mes' = 'todas';
  readonly periodos: { v: 'todas' | 'hoy' | 'ayer' | 'semana' | 'mes'; l: string }[] = [
    { v: 'todas', l: 'Todas' },
    { v: 'hoy', l: 'Hoy' },
    { v: 'ayer', l: 'Ayer' },
    { v: 'semana', l: 'Semana' },
    { v: 'mes', l: 'Mes' },
  ];

  constructor(
    private notificaciones: NotificacionService,
    private router: Router,
    private alertCtrl: AlertController,
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

  /** #17 Notificaciones tras aplicar estado + periodo. */
  get notifsFiltradas(): Notificacion[] {
    return this.notifs.filter((n) => {
      const estadoOk =
        this.filtroEstado === 'todas' ||
        (this.filtroEstado === 'no_leidas' ? !n.leida : n.leida);
      return estadoOk && this.enPeriodo(n.created_at);
    });
  }

  private enPeriodo(iso?: string | null): boolean {
    if (this.filtroPeriodo === 'todas') return true;
    if (!iso) return false;
    const d = new Date(iso);
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.filtroPeriodo === 'hoy') return d >= hoy;
    if (this.filtroPeriodo === 'ayer') {
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      return d >= ayer && d < hoy;
    }
    if (this.filtroPeriodo === 'semana') {
      const inicio = new Date(hoy);
      inicio.setDate(inicio.getDate() - 6);
      return d >= inicio;
    }
    // mes = últimos 30 días
    const inicioMes = new Date(hoy);
    inicioMes.setDate(inicioMes.getDate() - 29);
    return d >= inicioMes;
  }

  /** #17 Elimina una notificación (no interfiere con abrir). */
  eliminar(n: Notificacion, ev: Event): void {
    ev.stopPropagation();
    this.notificaciones.eliminar(n.id).pipe(takeUntil(this.destroy$)).subscribe();
  }

  /** Clic en una notificación: la marca leída y navega a la sección del evento. */
  abrir(n: Notificacion): void {
    if (!n.leida) {
      this.notificaciones.marcarLeida(n.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.notificaciones.refrescar().subscribe());
    }
    const destino = rutaDeNotificacion(n);
    if (destino) {
      void this.router.navigate(destino.path, destino.extras);
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

  /** Borra TODAS las notificaciones (con confirmación). */
  async borrarTodas(): Promise<void> {
    if (this.notifs.length === 0) {
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Borrar notificaciones',
      message: '¿Borrar todas las notificaciones? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar todas',
          role: 'destructive',
          handler: () => {
            this.borrandoTodas = true;
            this.notificaciones.eliminarTodas()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: () => (this.borrandoTodas = false),
                error: () => (this.borrandoTodas = false),
              });
          },
        },
      ],
    });
    await alert.present();
  }

  /** Ícono según el tipo de notificación. */
  icono(n: Notificacion): string {
    return iconoDeNotificacion(n.tipo);
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
