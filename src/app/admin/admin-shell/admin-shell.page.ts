import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SucursalService } from '../../core/services/sucursal.service';
import { Usuario } from '../../core/models/usuario.model';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
}

/**
 * Shell del panel admin: sidebar (colapsable en móvil) + header persistente
 * + <ion-router-outlet> para las 9 páginas hijas.
 */
@Component({
  selector: 'app-admin-shell',
  templateUrl: './admin-shell.page.html',
  styleUrls: ['./admin-shell.page.scss'],
  standalone: false,
})
export class AdminShellPage implements OnInit {
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
    { id: 'notificaciones', label: 'Notificaciones',    icon: 'notifications-outline', badge: '3' },
    { id: 'resenas',        label: 'Reseñas',           icon: 'star-outline' },
    { id: 'configuracion',  label: 'Configuración',     icon: 'settings-outline' },
  ];

  constructor(
    private router: Router,
    private auth: AuthService,
    private sucursalService: SucursalService,
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
    const sucursalId = this.auth.usuario?.sucursal_id;
    if (sucursalId) {
      this.sucursalService.listarActivas().subscribe({
        next: (sucursales) => {
          this.sucursalNombre = sucursales.find((s) => s.id === sucursalId)?.nombre ?? null;
        },
      });
    }
  }

  closeSidebar(): void { this.sidebarOpen = false; }

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
