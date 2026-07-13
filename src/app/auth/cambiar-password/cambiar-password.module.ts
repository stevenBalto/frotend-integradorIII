import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CambiarPasswordPage } from './cambiar-password.page';
import { CambiarPasswordPageRoutingModule } from './cambiar-password-routing.module';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, IonicModule, CambiarPasswordPageRoutingModule],
  declarations: [CambiarPasswordPage],
})
export class CambiarPasswordPageModule {}
