import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminShellPage } from './admin-shell.page';

const routes: Routes = [
  {
    path: '',
    component: AdminShellPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.AdminDashboardPageModule),
      },
      {
        path: 'pedidos',
        loadChildren: () => import('../pedidos/pedidos.module').then(m => m.AdminPedidosPageModule),
      },
      {
        path: 'menu',
        loadChildren: () => import('../menu/menu.module').then(m => m.AdminMenuPageModule),
      },
      {
        path: 'inventario',
        loadChildren: () => import('../inventario/inventario.module').then(m => m.AdminInventarioPageModule),
      },
      {
        path: 'ofertas',
        loadChildren: () => import('../ofertas/ofertas.module').then(m => m.AdminOfertasPageModule),
      },
      {
        path: 'usuarios',
        loadChildren: () => import('../usuarios/usuarios.module').then(m => m.AdminUsuariosPageModule),
      },
      {
        path: 'analiticas',
        loadChildren: () => import('../analiticas/analiticas.module').then(m => m.AdminAnaliticasPageModule),
      },
      {
        path: 'notificaciones',
        loadChildren: () => import('../notificaciones/notificaciones.module').then(m => m.AdminNotificacionesPageModule),
      },
      {
        path: 'resenas',
        loadChildren: () => import('../resenas/resenas.module').then(m => m.AdminResenasPageModule),
      },
      {
        path: 'configuracion',
        loadChildren: () => import('../configuracion/configuracion.module').then(m => m.AdminConfiguracionPageModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminShellPageRoutingModule {}
