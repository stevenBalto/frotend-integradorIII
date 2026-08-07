import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminShellPage } from './admin-shell.page';
import { AdminShellPageRoutingModule } from './admin-shell-routing.module';
import { AdminSharedModule } from '../shared/admin-shared.module';
import { IdleSessionModalComponent } from '../../shared/components/idle-session-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminSharedModule,
    AdminShellPageRoutingModule,
    IdleSessionModalComponent,
  ],
  declarations: [AdminShellPage],
})
export class AdminShellPageModule {}
