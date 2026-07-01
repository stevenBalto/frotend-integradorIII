import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MiCuentaPage } from './mi-cuenta.page';
import { MiCuentaPageRoutingModule } from './mi-cuenta-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    MiCuentaPageRoutingModule
  ],
  declarations: [MiCuentaPage]
})
export class MiCuentaPageModule {}
