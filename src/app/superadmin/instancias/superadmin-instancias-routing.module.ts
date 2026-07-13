import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperadminInstanciasPage } from './superadmin-instancias.page';
import { superAdminAuthGuard } from '../../core/guards/superadmin.guard';

const routes: Routes = [
  { path: '', component: SuperadminInstanciasPage, canActivate: [superAdminAuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminInstanciasPageRoutingModule {}
