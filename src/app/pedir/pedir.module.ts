import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PedirPage } from './pedir.page';
import { PedirPageRoutingModule } from './pedir-routing.module';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PedirPageRoutingModule,
    CrcCurrencyPipe,
  ],
  declarations: [PedirPage]
})
export class PedirPageModule {}
