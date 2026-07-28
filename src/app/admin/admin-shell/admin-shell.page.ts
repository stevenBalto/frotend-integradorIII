import { Component, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Observable, map, Subject, takeUntil, filter, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { Usuario } from '../../core/models/usuario.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Notificacion } from '../../core/models/notificacion.model';
import { AdminHeaderService } from '../shared/admin-header.service';

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

  // Header contextual (tentativo): el saludo solo se muestra en Dashboard; en el
  // resto de secciones el header global muestra el titulo/subtitulo de la seccion
  // (antes vivian dentro de cada pagina). Asi se recupera espacio vertical.
  esDashboard = true;
  seccionTitulo = '';
  seccionSubtitulo = '';

  /** Titulo/subtitulo por seccion, replicando lo que mostraba cada admin-page-header. */
  private readonly secciones: Record<string, { titulo: string; subtitulo: string }> = {
    inicio:         { titulo: 'Inicio',                  subtitulo: 'Dashboard / Inicio' },
    pedidos:        { titulo: 'Pedidos',                 subtitulo: 'Dashboard / Gestión de pedidos' },
    menu:           { titulo: 'Menú',                    subtitulo: 'Dashboard / Menú' },
    inventario:     { titulo: 'Inventario',              subtitulo: 'Dashboard / Inventario' },
    ofertas:        { titulo: 'Ofertas',                 subtitulo: 'Dashboard / Ofertas y cupones' },
    clientes:       { titulo: 'Clientes',                subtitulo: 'Dashboard / Clientes' },
    usuarios:       { titulo: 'Usuarios',                subtitulo: 'Dashboard / Usuarios y roles' },
    analiticas:     { titulo: 'Reportes',               subtitulo: 'Dashboard / Reportes y analíticas' },
    notificaciones: { titulo: 'Notificaciones',          subtitulo: 'Bandeja del panel' },
    resenas:        { titulo: 'Reseñas y calificaciones', subtitulo: 'Gestión y moderación' },
    configuracion:  { titulo: 'Configuración general',   subtitulo: 'Dashboard / Configuración' },
  };

  readonly usuario$: Observable<Usuario | null>;
  readonly avatarInicial$: Observable<string>;
  readonly rolLabel$: Observable<string>;

  /** Acciones que la página activa publica para el header (junto a la campana). */
  readonly headerActions$: Observable<TemplateRef<unknown> | null>;

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
    private adminHeader: AdminHeaderService,
  ) {
    this.usuario$ = this.auth.usuarioActual$;
    this.headerActions$ = this.adminHeader.actions$;

    this.avatarInicial$ = this.usuario$.pipe(
      map((u) => (u?.nombre?.trim()?.charAt(0) ?? 'A').toUpperCase()),
    );

    this.rolLabel$ = this.usuario$.pipe(
      map((u) => (u?.rol === 'super_admin' || u?.rol === 'admin_sede' ? 'Administrador' : (u?.rol ?? ''))),
    );
  }

  ngOnInit(): void {
    // Header contextual: al navegar entre secciones, actualiza el titulo/subtitulo
    // (o marca Dashboard para mostrar el saludo).
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects),
        startWith(this.router.url),
        takeUntil(this.destroy$),
      )
      .subscribe((url) => this.actualizarSeccion(url));

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

  /** Deriva la seccion activa del URL (/admin/<id>) para el header contextual. */
  private actualizarSeccion(url: string): void {
    const id = url.split('?')[0].split('/').filter(Boolean)[1] ?? 'dashboard';
    this.esDashboard = id === 'dashboard';
    const sec = this.secciones[id];
    this.seccionTitulo = sec?.titulo ?? '';
    this.seccionSubtitulo = sec?.subtitulo ?? '';
    // Red de seguridad: al cambiar de sección, limpia las acciones del header.
    // La página entrante (si tiene) re-publica las suyas en un microtask posterior,
    // así ningún botón/aviso de la sección anterior queda "pegado".
    this.adminHeader.setActions(null);
  }

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
