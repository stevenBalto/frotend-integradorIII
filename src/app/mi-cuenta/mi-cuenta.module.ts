import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MiCuentaPage } from './mi-cuenta.page';
import { MiCuentaPageRoutingModule } from './mi-cuenta-routing.module';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule,
    MiCuentaPageRoutingModule,
    CrcCurrencyPipe
  ],
  declarations: [MiCuentaPage]
})
export class MiCuentaPageModule {}
