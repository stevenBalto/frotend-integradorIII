import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MisPedidosPage } from './mis-pedidos.page';

const routes: Routes = [
  {
    path: '',
    component: MisPedidosPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MisPedidosPageRoutingModule {}
