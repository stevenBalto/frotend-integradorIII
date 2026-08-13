import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Gesture, GestureController, ToastController } from '@ionic/angular';
import { Observable, map, Subject, takeUntil, filter, startWith } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { Usuario } from '../../core/models/usuario.model';
import { NotificacionService } from '../../core/services/notificacion.service';
import {
  Notificacion,
  rutaDeNotificacion,
  seccionDeNotificacion,
  iconoDeNotificacion,
} from '../../core/models/notificacion.model';
import { AdminHeaderLead, AdminHeaderService } from '../shared/admin-header.service';
import { SidebarFocusService } from '../shared/sidebar-focus.service';
import { InactivityService } from '../../core/services/inactivity.service';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  /** SVG propio (assets) cuando ningún ionicon calza. Si está, se usa en vez de `icon`. */
  iconSrc?: string;
  badge?: string;
}

interface NavGroup {
  titulo: string;
  items: NavItem[];
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
  providers: [InactivityService],
})
export class AdminShellPage implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private auth = inject(AuthService);
  private sucursalService = inject(SucursalService);
  private notificaciones = inject(NotificacionService);
  private toastCtrl = inject(ToastController);
  private adminHeader = inject(AdminHeaderService);
  private sidebarFocus = inject(SidebarFocusService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private zone = inject(NgZone);
  private gestureCtrl = inject(GestureController);

  private destroy$ = new Subject<void>();
  private sidebarGesture?: Gesture;

  sidebarOpen = false;
  sucursalNombre: string | null = null;

  /** Id de la sección del sidebar con el pulso de "foco" activo (al llegar desde una
   *  notificación). Se limpia solo tras el pulso; el estado activo lo maneja el router. */
  focoSidebarId: string | null = null;
  private focoTimer?: ReturnType<typeof setTimeout>;

  // Header contextual (tentativo): el saludo solo se muestra en Dashboard; en el
  // resto de secciones el header global muestra el titulo/subtitulo de la seccion
  // (antes vivian dentro de cada pagina). Asi se recupera espacio vertical.
  esDashboard = true;
  seccionTitulo = '';
  seccionSubtitulo = '';

  /**
   * Secciones donde el header NO muestra titulo/subtitulo (ni el saludo del
   * dashboard): limpieza de UX pedida. Pedidos conserva su encabezado (no
   * esta en la lista).
   */
  private readonly seccionesSinTitulo = new Set<string>([
    'dashboard', 'inicio', 'menu', 'inventario', 'ofertas',
    'clientes', 'usuarios', 'analiticas', 'notificaciones',
    'resenas', 'configuracion', 'pedidos-mostrador',
    // 'configuracion' usa conservaTitulo (su lead es el chip de estado del negocio):
    // el chip se muestra igual, y kpimode oculta título/subtítulo en tablet+ (en móvil
    // el título sigue visible, como en el resto de secciones).
  ]);
  ocultarHeaderTexto = true;

  /** Secciones donde el título NO se muestra NUNCA, ni en móvil (a diferencia del
   *  resto de "kpimode", que sí lo muestran en móvil). Pedido de mostrador es una
   *  sub-pantalla a la que solo se llega canjeando un código: su propio resumen del
   *  canje (o nada, si no hay canje) ocupa ese lugar en vez de un título fijo. */
  private readonly seccionesSinTituloSiempre = new Set<string>(['pedidos-mostrador']);
  ocultarTituloSiempre = false;

  /** Titulo/subtitulo por seccion, replicando lo que mostraba cada admin-page-header. */
  private readonly secciones: Record<string, { titulo: string; subtitulo: string }> = {
    inicio:         { titulo: 'Inicio',                  subtitulo: 'Dashboard / Inicio' },
    pedidos:        { titulo: 'Pedidos',                 subtitulo: 'Dashboard / Gestión de pedidos' },
    menu:           { titulo: 'Menú',                    subtitulo: 'Dashboard / Menú' },
    inventario:     { titulo: 'Inventario',              subtitulo: 'Dashboard / Inventario' },
    ofertas:        { titulo: 'Ofertas',                 subtitulo: 'Dashboard / Ofertas y cupones' },
    'pedidos-mostrador': { titulo: 'Pedido de mostrador', subtitulo: 'Canje de cupón por QR' },
    clientes:       { titulo: 'Clientes',                subtitulo: 'Dashboard / Clientes' },
    usuarios:       { titulo: 'Usuarios',                subtitulo: 'Dashboard / Usuarios y roles' },
    analiticas:     { titulo: 'Reportes',               subtitulo: 'Dashboard / Reportes y analíticas' },
    notificaciones: { titulo: 'Notificaciones',          subtitulo: 'Bandeja del panel' },
    resenas:        { titulo: 'Reseñas y calificaciones', subtitulo: 'Gestión y moderación' },
    configuracion:  { titulo: 'Configuración general',   subtitulo: 'Dashboard / Configuración' },
  };

  // Campana del header (panel desplegable con las últimas notificaciones).
  bellOpen = false;
  // Modal de perfil del usuario admin (datos + accesos por módulo) — item 30.
  perfilOpen = false;
  // Modal de ayuda: descarga del manual de usuario.
  ayudaOpen = false;
  readonly manualUsuarioUrl = 'assets/docs/Manual_Usuario_Rooster_Pizza_Grill.pdf';
  noLeidasCount = 0;
  notifsRecientes: Notificacion[] = [];

  readonly usuario$: Observable<Usuario | null>;
  readonly avatarInicial$: Observable<string>;
  readonly rolLabel$: Observable<string>;

  /** Acciones que la página activa publica para el header (junto a la campana). */
  readonly headerActions$: Observable<TemplateRef<unknown> | null>;

  /** Slot izquierdo/central: contenido (KPIs) que la página proyecta al header. */
  readonly headerLead$: Observable<AdminHeaderLead | null>;

  readonly saludo = this.calcularSaludo();
  readonly fechaTexto = this.calcularFecha();

  readonly navItems: NavItem[] = [
    { id: 'dashboard',      label: 'Dashboard',         icon: 'apps-outline', iconSrc: 'assets/icon/dashboard-grid.svg' },
    { id: 'inicio',         label: 'Inicio (Home)',     icon: 'home-outline' },
    { id: 'pedidos',        label: 'Pedidos',           icon: 'clipboard-outline', iconSrc: 'assets/icon/pedidos-clipboard.svg' },
    { id: 'menu',           label: 'Menú',              icon: 'restaurant-outline' },
    { id: 'inventario',     label: 'Inventario',        icon: 'cube-outline' },
    { id: 'ofertas',        label: 'Ofertas y cupones', icon: 'pricetags-outline' },
    { id: 'clientes',       label: 'Clientes',          icon: 'people-outline' },
    { id: 'usuarios',       label: 'Usuarios y roles',  icon: 'shield-checkmark-outline' },
    { id: 'analiticas',     label: 'Analíticas',        icon: 'bar-chart-outline' },
    { id: 'notificaciones', label: 'Notificaciones',    icon: 'notifications-outline' },
    { id: 'resenas',        label: 'Reseñas',           icon: 'star-outline' },
    { id: 'configuracion',  label: 'Configuración',     icon: 'settings-outline' },
  ];

  /** Sidebar agrupado por secciones (encabezados). Los grupos referencian los MISMOS
   *  objetos de navItems, así el badge de notificaciones (que muta el item) se refleja. */
  readonly navGroups: NavGroup[] = [
    { titulo: 'Análisis',        items: this.itemsPorId('dashboard', 'analiticas') },
    { titulo: 'Operación',       items: this.itemsPorId('pedidos', 'inventario') },
    { titulo: 'Catálogo',        items: this.itemsPorId('menu', 'ofertas') },
    { titulo: 'Clientes',        items: this.itemsPorId('clientes', 'resenas') },
    { titulo: 'App del cliente', items: this.itemsPorId('inicio', 'notificaciones') },
    { titulo: 'Administración',  items: this.itemsPorId('usuarios', 'configuracion') },
  ];

  constructor() {
    this.usuario$ = this.auth.usuarioActual$;
    this.headerActions$ = this.adminHeader.actions$;
    this.headerLead$ = this.adminHeader.lead$;

    this.avatarInicial$ = this.usuario$.pipe(
      map((u) => (u?.nombre?.trim()?.charAt(0) ?? 'A').toUpperCase()),
    );

    this.rolLabel$ = this.usuario$.pipe(
      map((u) => (u?.rol === 'super_admin' || u?.rol === 'admin_sede' ? 'Administrador' : (u?.rol ?? ''))),
    );
  }

  /** NavItems (por id, en orden) para armar un grupo del sidebar (mismas referencias). */
  private itemsPorId(...ids: string[]): NavItem[] {
    return ids
      .map((id) => this.navItems.find((i) => i.id === id))
      .filter((i): i is NavItem => !!i);
  }

  ngOnInit(): void {
    // #23 Limpiar las acciones del header al INICIAR la navegación (no al
    // terminarla): así la página entrante las re-publica DESPUÉS del clear y el
    // botón del header no queda "pegado" en null por una condición de carrera.
    this.router.events
      .pipe(
        filter((e): e is NavigationStart => e instanceof NavigationStart),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.adminHeader.setActions(null);
        this.adminHeader.setLead(null);
      });

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
      .subscribe((n) => {
        this.noLeidasCount = n;
        this.setBadge(n);
      });

    // Lista para el panel de la campana (las últimas).
    this.notificaciones.notificaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lista) => (this.notifsRecientes = lista.slice(0, 6)));

    this.notificaciones.nuevas$
      .pipe(takeUntil(this.destroy$))
      .subscribe((nuevas) => nuevas.forEach((n) => void this.mostrarToast(n)));

    // Pulso de foco en el sidebar al abrir una notificación que redirige a otra sección.
    this.sidebarFocus.foco$
      .pipe(takeUntil(this.destroy$))
      .subscribe((id) => this.enfocarSidebar(id));

    this.notificaciones.iniciarPolling();
  }

  ngAfterViewInit(): void {
    // #2 En móvil, arrastrar horizontalmente abre/cierra el sidebar: deslizar de
    // izquierda a derecha (deltaX > 0) lo abre; de derecha a izquierda (deltaX < 0)
    // lo cierra. En escritorio el sidebar es fijo, así que la gesture no aplica.
    this.sidebarGesture = this.gestureCtrl.create({
      el: this.host.nativeElement,
      gestureName: 'admin-sidebar-swipe',
      direction: 'x',
      threshold: 20,
      onEnd: (ev) => {
        if (window.innerWidth >= 768) return;
        if (!this.sidebarOpen && ev.deltaX > 60) {
          this.zone.run(() => (this.sidebarOpen = true));
        } else if (this.sidebarOpen && ev.deltaX < -60) {
          this.zone.run(() => (this.sidebarOpen = false));
        }
      },
    });
    this.sidebarGesture.enable(true);
  }

  ngOnDestroy(): void {
    this.notificaciones.detenerPolling();
    this.sidebarGesture?.destroy();
    clearTimeout(this.focoTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  closeSidebar(): void { this.sidebarOpen = false; }

  /** Ilumina brevemente el ítem del sidebar de la sección indicada (pulso ~1.6s). */
  private enfocarSidebar(seccionId: string): void {
    clearTimeout(this.focoTimer);
    // Reinicia la animación aunque se pida la misma sección dos veces seguidas.
    this.focoSidebarId = null;
    setTimeout(() => {
      this.focoSidebarId = seccionId;
      this.focoTimer = setTimeout(() => (this.focoSidebarId = null), 1600);
    });
  }

  /** Deriva la seccion activa del URL (/admin/<id>) para el header contextual. */
  private actualizarSeccion(url: string): void {
    const id = url.split('?')[0].split('/').filter(Boolean)[1] ?? 'dashboard';
    this.esDashboard = id === 'dashboard';
    this.ocultarHeaderTexto = this.seccionesSinTitulo.has(id);
    this.ocultarTituloSiempre = this.seccionesSinTituloSiempre.has(id);
    const sec = this.secciones[id];
    this.seccionTitulo = sec?.titulo ?? '';
    this.seccionSubtitulo = sec?.subtitulo ?? '';
    // (La limpieza de acciones del header se hace en NavigationStart —ver ngOnInit—
    // para garantizar el orden clear→publish y evitar el botón "pegado".)
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
      icon: iconoDeNotificacion(n.tipo),
      cssClass: 'notif-toast',
      buttons: [
        { text: 'Ver', handler: () => this.abrirNotificacion(n) },
        { text: 'Cerrar', role: 'cancel' },
      ],
    });
    await toast.present();
  }

  // ── Campana del header ──

  toggleBell(): void {
    this.bellOpen = !this.bellOpen;
  }

  cerrarBell(): void {
    this.bellOpen = false;
  }

  /** Abre el modal de perfil y refresca /me para traer los módulos/permisos del usuario. */
  abrirPerfil(): void {
    this.perfilOpen = true;
    this.auth.refrescarPerfil().subscribe({ error: () => { /* usa lo que ya haya en sesión */ } });
  }

  cerrarPerfil(): void {
    this.perfilOpen = false;
  }

  abrirAyuda(): void {
    this.ayudaOpen = true;
  }

  cerrarAyuda(): void {
    this.ayudaOpen = false;
  }

  iconoNotif(n: Notificacion): string {
    return iconoDeNotificacion(n.tipo);
  }

  /** Marca leída y navega a la sección del evento (según el tipo). */
  abrirNotificacion(n: Notificacion): void {
    this.cerrarBell();
    this.closeSidebar();
    if (!n.leida) {
      this.notificaciones.marcarLeida(n.id).subscribe(() => this.notificaciones.refrescar().subscribe());
    }
    const destino = rutaDeNotificacion(n);
    if (destino) {
      const seccion = seccionDeNotificacion(n);
      if (seccion) this.sidebarFocus.enfocar(seccion);
      void this.router.navigate(destino.path, destino.extras);
    }
  }

  verTodas(): void {
    this.cerrarBell();
    void this.router.navigate(['/admin/notificaciones']);
  }

  marcarTodasLeidas(): void {
    this.notificaciones.marcarTodasLeidas().subscribe(() => this.notificaciones.refrescar().subscribe());
  }

  tiempoNotif(n: Notificacion): string {
    if (!n.created_at) return '';
    const min = Math.floor((Date.now() - new Date(n.created_at).getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    return `${Math.floor(h / 24)} d`;
  }

  /** Temporal: vuelve a la app cliente (sin invalidar token, es otro contexto). */
  salirAlApp(): void {
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /** Sesion cerrada por inactividad o por tope absoluto de horas (idle-session-modal). */
  async onSesionExpirada(): Promise<void> {
    this.auth.logout().subscribe({ complete: () => undefined, error: () => undefined });
    const toast = await this.toastCtrl.create({
      message: 'Tu sesión se cerró por inactividad.',
      duration: 4000,
      position: 'top',
      color: 'medium',
    });
    await toast.present();
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
