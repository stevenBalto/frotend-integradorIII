import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, map, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { Usuario } from '../../core/models/usuario.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

/**
 * Shell del panel admin: sidebar (colapsable en móvil) + header persistente
 * + <ion-router-outlet> para las 9 páginas hijas.
 *
 * Aquí vive el "tiempo real" de notificaciones: mientras el admin esté en el
 * panel (cualquier pantalla), se sondea el backend y se muestra un toast global
 * + se actualiza el badge del sidebar.
 */
@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.page.html',
  styleUrls: ['./admin-shell.page.scss'],
  standalone: false,
})
export class AdminShellPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  sidebarOpen = false;
  sucursalNombre: string | null = null;

  readonly usuario$: Observable<Usuario | null>;
  readonly avatarInicial$: Observable<string>;
  readonly rolLabel$: Observable<string>;

  readonly saludo = this.calcularSaludo();
  readonly fechaTexto = this.calcularFecha();

  readonly navItems: NavItem[] = [
    { id: 'dashboard',      label: 'Dashboard',         icon: 'grid-outline' },
    { id: 'inicio',         label: 'Inicio (Home)',     icon: 'home-outline' },
    { id: 'pedidos',        label: 'Pedidos',           icon: 'clipboard-outline' },
    { id: 'menu',           label: 'Menú',              icon: 'restaurant-outline' },
    { id: 'inventario',     label: 'Inventario',        icon: 'cube-outline' },
    { id: 'ofertas',        label: 'Ofertas y cupones', icon: 'pricetag-outline' },
    { id: 'clientes',       label: 'Clientes',          icon: 'people-outline' },
    { id: 'usuarios',       label: 'Usuarios y roles',  icon: 'shield-checkmark-outline' },
    { id: 'analiticas',     label: 'Analíticas',        icon: 'bar-chart-outline' },
    { id: 'notificaciones', label: 'Notificaciones',    icon: 'notifications-outline' },
    { id: 'resenas',        label: 'Reseñas',           icon: 'star-outline' },
    { id: 'configuracion',  label: 'Configuración',     icon: 'settings-outline' },
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
    private sucursalService: SucursalService,
    private notificaciones: NotificacionService,
    private toastCtrl: ToastController,
  ) {
    this.usuario$ = this.auth.usuarioActual$;

    this.avatarInicial$ = this.usuario$.pipe(
      map((u) => (u?.nombre?.trim()?.charAt(0) ?? 'A').toUpperCase()),
    );

    this.rolLabel$ = this.usuario$.pipe(
      map((u) => (u?.rol === 'super_admin' || u?.rol === 'admin_sede' ? 'Administrador' : (u?.rol ?? ''))),
    );
  }

  ngOnInit(): void {
    // Header dinámico: nombre de la sucursal del admin (aporte del compañero).
    const sucursalId = this.auth.usuario?.sucursal_id;
    if (sucursalId) {
      this.sucursalService.listarActivas().subscribe({
        next: (sucursales) => {
          this.sucursalNombre = sucursales.find((s) => s.id === sucursalId)?.nombre ?? null;
        },
      });
    }

    // Notificaciones en tiempo real: badge en vivo + toast global (polling).
    this.notificaciones.noLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((n) => this.setBadge(n));

    this.notificaciones.nuevas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nuevas) => nuevas.forEach((n) => void this.mostrarToast(n)));

    this.notificaciones.iniciarPolling();
  }

  ngOnDestroy(): void {
    this.notificaciones.detenerPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeSidebar(): void { this.sidebarOpen = false; }

  private setBadge(cantidad: number): void {
    const item = this.navItems.find((i) => i.id === 'notificaciones');
    if (item) {
      item.badge = cantidad > 0 ? String(cantidad) : undefined;
    }
  }

  private async mostrarToast(n: Notificacion): Promise<void> {
    const toast = await this.toastCtrl.create({
      header: n.titulo,
      message: n.mensaje,
      duration: 6000,
      position: 'top',
      icon: 'notifications-outline',
      cssClass: 'notif-toast',
      buttons: [
        {
          text: 'Ver',
          handler: () => this.abrirPedido(n),
        },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    await toast.present();
  }

  /** Abre el pedido de la notificación en el módulo de Pedidos. */
  private abrirPedido(n: Notificacion): void {
    const codigo = n.data?.codigo;
    this.closeSidebar();
    void this.router.navigate(['/admin/pedidos'], {
      queryParams: codigo ? { codigo } : {},
    });
  }

  /** Temporal: vuelve a la app cliente (sin invalidar token, es otro contexto). */
  salirAlApp(): void {
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private calcularSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  private calcularFecha(): string {
    const texto = new Date().toLocaleDateString('es-CR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
