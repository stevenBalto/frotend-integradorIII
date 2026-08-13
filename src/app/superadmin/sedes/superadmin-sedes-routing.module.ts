import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperadminSedesPage } from './superadmin-sedes.page';
import { superAdminAuthGuard } from '../../core/guards/superadmin.guard';

const routes: Routes = [
  { path: '', component: SuperadminSedesPage, canActivate: [superAdminAuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminSedesPageRoutingModule {}
