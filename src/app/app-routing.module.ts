import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

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
    // Panel admin (base visual). Acceso temporal sin guard de rol: ver HiloActualFront.
    path: 'admin',
    loadChildren: () => import('./admin/admin-shell/admin-shell.module').then((m) => m.AdminShellPageModule),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then((m) => m.TabsPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
