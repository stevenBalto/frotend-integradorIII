import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginPage } from './login.page';
import { guestGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: LoginPage, canActivate: [guestGuard] },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}
