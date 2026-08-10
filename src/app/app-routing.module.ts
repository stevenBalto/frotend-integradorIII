import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./auth/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./auth/register/register.module').then((m) => m.RegisterPageModule),
  },
  {
    path: 'forgot-password',
    loadChildren: () =>
      import('./auth/forgot-password/forgot-password.module').then((m) => m.ForgotPasswordPageModule),
  },
  {
    path: 'reset-password',
    loadChildren: () =>
      import('./auth/reset-password/reset-password.module').then((m) => m.ResetPasswordPageModule),
  },
  {
    path: 'cambiar-password',
    loadChildren: () =>
      import('./auth/cambiar-password/cambiar-password.module').then((m) => m.CambiarPasswordPageModule),
  },
  {
    path: 'mis-pedidos',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./mis-pedidos/mis-pedidos.module').then((m) => m.MisPedidosPageModule),
  },
  {
    // Panel admin (base visual). Acceso temporal sin guard de rol: ver HiloActualFront.
    path: 'admin',
    loadChildren: () => import('./admin/admin-shell/admin-shell.module').then((m) => m.AdminShellPageModule),
  },
  {
    // Superadmin: panel de gestion (login unico; protegido por guard de superadmin).
    path: 'superadmin/panel',
    loadChildren: () =>
      import('./superadmin/panel/superadmin-panel.module').then((m) => m.SuperadminPanelPageModule),
  },
  {
    // Superadmin: CRUD de instancias (cuentas independientes).
    path: 'superadmin/instancias',
    loadChildren: () =>
      import('./superadmin/instancias/superadmin-instancias.module').then(
        (m) => m.SuperadminInstanciasPageModule,
      ),
  },
  { path: 'superadmin', redirectTo: 'superadmin/panel', pathMatch: 'full' },
  // La app ya no obliga a loguearse al abrir: se entra directo a la vitrina.
  // El login vive en la tab "Mi cuenta" para quien no tenga sesion.
  { path: '', redirectTo: 'tabs/home', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then((m) => m.TabsPageModule),
  },
];

@NgModule({
  // Sin preload global: PreloadAllModules descargaba TODAS las rutas lazy
  // (admin/superadmin/kiosko) al abrir la vista cliente, inflando la carga
  // inicial. Ahora cada ruta se trae on-demand al navegar a ella.
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
