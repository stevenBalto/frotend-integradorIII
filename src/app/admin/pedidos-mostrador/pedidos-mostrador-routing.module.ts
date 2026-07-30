import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PedidosMostradorPage } from './pedidos-mostrador.page';

const routes: Routes = [{ path: '', component: PedidosMostradorPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidosMostradorPageRoutingModule {}
