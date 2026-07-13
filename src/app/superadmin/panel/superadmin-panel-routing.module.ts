import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperadminPanelPage } from './superadmin-panel.page';
import { superAdminAuthGuard } from '../../core/guards/superadmin.guard';

const routes: Routes = [
  { path: '', component: SuperadminPanelPage, canActivate: [superAdminAuthGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SuperadminPanelPageRoutingModule {}
