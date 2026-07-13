import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { AdminSharedModule } from '../shared/admin-shared.module';
import { AdminUsuariosPage } from './usuarios.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AdminSharedModule,
    RouterModule.forChild([{ path: '', component: AdminUsuariosPage }]),
  ],
  declarations: [AdminUsuariosPage],
})
export class AdminUsuariosPageModule {}
