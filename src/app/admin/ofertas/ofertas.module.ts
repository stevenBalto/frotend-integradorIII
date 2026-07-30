import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { QrScannerComponent } from '../shared/qr-scanner.component';
import { AdminOfertasPage } from './ofertas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AdminSharedModule,
    QrScannerComponent,
    RouterModule.forChild([{ path: '', component: AdminOfertasPage }]),
  ],
  declarations: [AdminOfertasPage],
})
export class AdminOfertasPageModule {}
