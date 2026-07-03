import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AdminShellPage } from './admin-shell.page';
import { AdminShellPageRoutingModule } from './admin-shell-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AdminShellPageRoutingModule,
  ],
  declarations: [AdminShellPage],
})
export class AdminShellPageModule {}
