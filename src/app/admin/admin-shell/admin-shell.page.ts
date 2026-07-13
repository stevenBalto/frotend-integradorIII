import { Component } from '@angular/core';
import { Router } from '@angular/router';

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
export class AdminShellPage {
  sidebarOpen = false;

  readonly navItems: NavItem[] = [
    { id: 'dashboard',      label: 'Dashboard',         icon: 'grid-outline' },
    { id: 'pedidos',        label: 'Pedidos',           icon: 'clipboard-outline' },
    { id: 'menu',           label: 'Menú',              icon: 'restaurant-outline' },
    { id: 'inventario',     label: 'Inventario',        icon: 'cube-outline' },
    { id: 'ofertas',        label: 'Ofertas y cupones', icon: 'pricetag-outline' },
    { id: 'usuarios',       label: 'Usuarios y roles',  icon: 'shield-checkmark-outline' },
    { id: 'analiticas',     label: 'Analíticas',        icon: 'bar-chart-outline' },
    { id: 'notificaciones', label: 'Notificaciones',    icon: 'notifications-outline', badge: '3' },
    { id: 'resenas',        label: 'Reseñas',           icon: 'star-outline' },
    { id: 'configuracion',  label: 'Configuración',     icon: 'settings-outline' },
  ];

  constructor(private router: Router) {}

  closeSidebar(): void { this.sidebarOpen = false; }

  /** Temporal: vuelve a la app cliente (sin invalidar token, es otro contexto). */
  salirAlApp(): void {
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
