import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminResenasPage } from './resenas.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    RouterModule.forChild([{ path: '', component: AdminResenasPage }]),
  ],
  declarations: [AdminResenasPage],
})
export class AdminResenasPageModule {}
