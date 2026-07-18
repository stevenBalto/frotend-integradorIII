import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { CrcCurrencyPipe } from '../../shared/pipes/crc-currency.pipe';
import { AdminInicioPage } from './inicio.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    CrcCurrencyPipe,
    RouterModule.forChild([{ path: '', component: AdminInicioPage }]),
  ],
  declarations: [AdminInicioPage],
})
export class AdminInicioPageModule {}
