import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { CrcCurrencyPipe } from '../../shared/pipes/crc-currency.pipe';
import { AdminMenuPage } from './menu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AdminSharedModule,
    CrcCurrencyPipe,
    RouterModule.forChild([{ path: '', component: AdminMenuPage }]),
  ],
  declarations: [AdminMenuPage],
})
export class AdminMenuPageModule {}
