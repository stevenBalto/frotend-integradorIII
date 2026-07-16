import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminPedidosPage } from './pedidos.page';
import { CrcCurrencyPipe } from '../../shared/pipes/crc-currency.pipe';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    CrcCurrencyPipe,
    RouterModule.forChild([{ path: '', component: AdminPedidosPage }]),
  ],
  declarations: [AdminPedidosPage],
})
export class AdminPedidosPageModule {}
