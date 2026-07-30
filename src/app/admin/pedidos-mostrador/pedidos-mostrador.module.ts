import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { CrcCurrencyPipe } from '../../shared/pipes/crc-currency.pipe';
import { PedidosMostradorPageRoutingModule } from './pedidos-mostrador-routing.module';
import { PedidosMostradorPage } from './pedidos-mostrador.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    CrcCurrencyPipe,
    PedidosMostradorPageRoutingModule,
  ],
  declarations: [PedidosMostradorPage],
})
export class PedidosMostradorPageModule {}
