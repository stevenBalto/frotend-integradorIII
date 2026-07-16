import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MisPedidosPageRoutingModule } from './mis-pedidos-routing.module';
import { MisPedidosPage } from './mis-pedidos.page';
import { CrcCurrencyPipe } from '../shared/pipes/crc-currency.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MisPedidosPageRoutingModule,
    CrcCurrencyPipe,
  ],
  declarations: [MisPedidosPage],
})
export class MisPedidosPageModule {}
