import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminOfertasPage } from './ofertas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    RouterModule.forChild([{ path: '', component: AdminOfertasPage }]),
  ],
  declarations: [AdminOfertasPage],
})
export class AdminOfertasPageModule {}
