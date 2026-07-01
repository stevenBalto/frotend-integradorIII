import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PedirPage } from './pedir.page';

const routes: Routes = [
  {
    path: '',
    component: PedirPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PedirPageRoutingModule {}
