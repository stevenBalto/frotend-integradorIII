import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'pedir',
        loadChildren: () => import('../pedir/pedir.module').then(m => m.PedirPageModule)
      },
      {
        path: 'ofertas',
        loadChildren: () => import('../ofertas/ofertas.module').then(m => m.OfertasPageModule)
      },
      {
        path: 'mi-cuenta',
        loadChildren: () => import('../mi-cuenta/mi-cuenta.module').then(m => m.MiCuentaPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
