import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ForgotPasswordPage } from './forgot-password.page';
import { ForgotPasswordPageRoutingModule } from './forgot-password-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, ForgotPasswordPageRoutingModule],
  declarations: [ForgotPasswordPage],
})
export class ForgotPasswordPageModule {}
