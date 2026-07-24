import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { MiCuentaPage } from './mi-cuenta.page';
import { FaqPage } from './pages/faq.page';
import { InfoPage } from './pages/info.page';
import { ProductosPage } from './pages/productos.page';
import { RoostersPage } from './pages/roosters.page';
import { PerfilPage } from './pages/perfil.page';
import { HistorialPage } from './pages/historial.page';
import { RestaurantesPage } from './pages/restaurantes.page';

const routes: Routes = [
  { path: '', component: MiCuentaPage },
  // Contenido publico (bajo Mi cuenta, pero sin datos personales).
  { path: 'faq', component: FaqPage },
  { path: 'info/:tema', component: InfoPage },
  { path: 'productos', component: ProductosPage },
  { path: 'restaurantes', component: RestaurantesPage },
  // Datos personales: requieren sesion.
  { path: 'roosters', component: RoostersPage, canActivate: [authGuard] },
  { path: 'perfil', component: PerfilPage, canActivate: [authGuard] },
  { path: 'historial', component: HistorialPage, canActivate: [authGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MiCuentaPageRoutingModule {}
