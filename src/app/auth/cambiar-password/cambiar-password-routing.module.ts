import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CambiarPasswordPage } from './cambiar-password.page';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [{ path: '', component: CambiarPasswordPage, canActivate: [authGuard] }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CambiarPasswordPageRoutingModule {}
