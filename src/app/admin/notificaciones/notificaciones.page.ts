import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion, rutaDeNotificacion, seccionDeNotificacion, iconoDeNotificacion } from '../../core/models/notificacion.model';
import { SidebarFocusService } from '../shared/sidebar-focus.service';
import { ConfirmService } from '../../core/services/confirm.service';

/** Bandeja de notificaciones del admin (datos reales; polling en el shell). */
@Component({
  selector: 'app-admin-notificaciones',
  templateUrl: './notificaciones.page.html',
  styleUrls: ['./notificaciones.page.scss'],
  standalone: false,
})
export class AdminNotificacionesPage implements OnInit, OnDestroy {
  private notificaciones = inject(NotificacionService);
  private router = inject(Router);
  private confirm = inject(ConfirmService);
  private sidebarFocus = inject(SidebarFocusService);

  private destroy$ = new Subject<void>();

  notifs: Notificacion[] = [];
  cargando = true;
  marcandoTodas = false;
  borrandoTodas = false;
  /** Ids con la animación de salida corriendo (se borran de verdad al terminar). */
  eliminandoIds = new Set<number>();

  // #17 Filtros de la bandeja.
  filtroEstado: 'todas' | 'no_leidas' | 'leidas' = 'todas';
  filtroPeriodo: 'todas' | 'hoy' | 'ayer' | 'semana' | 'mes' = 'todas';
  readonly periodos: { v: 'hoy' | 'ayer' | 'semana' | 'mes'; l: string }[] = [
    { v: 'hoy', l: 'Hoy' },
    { v: 'ayer', l: 'Ayer' },
    { v: 'semana', l: 'Semana' },
    { v: 'mes', l: 'Mes' },
  ];

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

  /** #17 Elimina una notificación (no interfiere con abrir). Corre primero la
   *  animación de salida (fade) y recién ahí la borra del stream. */
  eliminar(n: Notificacion, ev: Event): void {
    ev.stopPropagation();
    if (this.eliminandoIds.has(n.id)) return;
    this.eliminandoIds.add(n.id);
    setTimeout(() => {
      this.notificaciones.eliminar(n.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({ error: () => this.eliminandoIds.delete(n.id) });
    }, 240); // ~ igual que la animación notifSalir (0.26s)
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
      // Enfoca el ítem del sidebar de la sección destino (pulso en el shell).
      const seccion = seccionDeNotificacion(n);
      if (seccion) this.sidebarFocus.enfocar(seccion);
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

  /** Borra TODAS las notificaciones (con confirmación, mismo diálogo que el resto del panel). */
  async borrarTodas(): Promise<void> {
    if (this.notifs.length === 0) {
      return;
    }
    const confirmado = await this.confirm.preguntar({
      titulo: '¿Borrar todas las notificaciones?',
      mensaje: 'Se quitarán todas las notificaciones de la bandeja. Esta acción no se puede deshacer.',
      textoConfirmar: 'Borrar todas',
      tono: 'peligro',
      icono: 'trash-outline',
    });
    if (!confirmado) {
      return;
    }
    this.borrandoTodas = true;
    this.notificaciones.eliminarTodas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => (this.borrandoTodas = false),
        error: () => (this.borrandoTodas = false),
      });
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
